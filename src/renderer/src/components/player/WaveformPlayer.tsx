import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { FILE_TYPE_LABELS, PRIMARY_MIX_FILE_TYPE } from '@/constants/app-constants';
import { versionsService } from '@/features/projects/versionsService';
import { formatPlaybackTime } from '@/lib/time';
import type { VersionFileAsset } from '@/types/api';

interface WaveformPlayerProps {
  versionId: string;
  mixFile?: VersionFileAsset;
  onTimeChange?: (timeSeconds: number) => void;
}

type WaveformStatus = 'idle' | 'loading' | 'ready' | 'error';

const nonAudioBlobTypePattern = /(?:^text\/|json|html|xml)/i;
const audioFileExtensionPattern = /\.(?:aac|aif|aiff|flac|m4a|mp3|ogg|opus|wav|webm)$/i;
const browserPlayableAudioDescription = 'WAV, MP3, M4A, FLAC, OGG, or WebM';

const startsWithBytes = (bytes: Uint8Array, signature: number[], offset = 0): boolean => {
  if (bytes.length < offset + signature.length) {
    return false;
  }

  return signature.every((byte, index) => bytes[offset + index] === byte);
};

const readUInt32LE = (bytes: Uint8Array, offset: number): number => {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0;
};

const hasUtf8ReplacementBytes = (bytes: Uint8Array): boolean => {
  for (let index = 0; index <= bytes.length - 3; index += 1) {
    if (bytes[index] === 0xef && bytes[index + 1] === 0xbf && bytes[index + 2] === 0xbd) {
      return true;
    }
  }

  return false;
};

const isRiffWave = (bytes: Uint8Array): boolean => {
  return startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWithBytes(bytes, [0x57, 0x41, 0x56, 0x45], 8);
};

const isKnownAudioContainer = (bytes: Uint8Array): boolean => {
  return (
    isRiffWave(bytes) ||
    startsWithBytes(bytes, [0x49, 0x44, 0x33]) ||
    startsWithBytes(bytes, [0x4f, 0x67, 0x67, 0x53]) ||
    startsWithBytes(bytes, [0x66, 0x4c, 0x61, 0x43]) ||
    startsWithBytes(bytes, [0x1a, 0x45, 0xdf, 0xa3]) ||
    startsWithBytes(bytes, [0x66, 0x74, 0x79, 0x70], 4)
  );
};

const readBlobHeaderText = async (blob: Blob): Promise<string> => {
  const header = await blob.slice(0, 512).arrayBuffer();
  return new TextDecoder('utf-8', { fatal: false }).decode(header).replace(/\0/g, '').trim();
};

const getTextDownloadErrorMessage = (fileName: string, headerText: string): string => {
  if (headerText.startsWith('{')) {
    try {
      const parsedHeader = JSON.parse(headerText) as { message?: unknown };

      if (typeof parsedHeader.message === 'string' && parsedHeader.message.trim()) {
        return `Downloaded ${fileName} returned an API error: ${parsedHeader.message.trim()}`;
      }
    } catch {
      return `Downloaded ${fileName} returned JSON instead of audio.`;
    }

    return `Downloaded ${fileName} returned JSON instead of audio.`;
  }

  if (/^<!doctype html|^<html/i.test(headerText)) {
    return `Downloaded ${fileName} returned HTML instead of audio.`;
  }

  if (/^<\?xml|^<Error/i.test(headerText)) {
    return `Downloaded ${fileName} returned XML instead of audio.`;
  }

  return `Downloaded ${fileName} returned text instead of audio.`;
};

const getWaveformErrorMessage = (error: unknown, fileName?: string): string => {
  const unsupportedAudioMessage = `The downloaded${
    fileName ? ` ${fileName}` : ''
  } file could not be decoded as browser-playable audio. Export and re-upload it as ${browserPlayableAudioDescription}.`;

  if (error instanceof Error) {
    if (error.message.includes('DEMUXER_ERROR_COULD_NOT_OPEN')) {
      return unsupportedAudioMessage;
    }

    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    if (error.includes('DEMUXER_ERROR_COULD_NOT_OPEN')) {
      return unsupportedAudioMessage;
    }

    return error.trim();
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.trim()
  ) {
    if (error.message.includes('DEMUXER_ERROR_COULD_NOT_OPEN')) {
      return unsupportedAudioMessage;
    }

    return error.message.trim();
  }

  return 'Unable to load waveform.';
};

const assertAudioDownload = async (blob: Blob, fileName: string): Promise<void> => {
  const blobType = blob.type.trim();

  if (blob.size === 0) {
    throw new Error(`Downloaded ${fileName} was empty.`);
  }

  const header = new Uint8Array(await blob.slice(0, 64).arrayBuffer());
  const headerText = await readBlobHeaderText(blob);

  if (/^(?:\{|\[|<!doctype html|<html|<\?xml|<Error)/i.test(headerText)) {
    throw new Error(getTextDownloadErrorMessage(fileName, headerText));
  }

  if (isRiffWave(header)) {
    const declaredSize = readUInt32LE(header, 4) + 8;

    if (hasUtf8ReplacementBytes(header) || declaredSize > blob.size) {
      throw new Error(
        `Downloaded ${fileName} looks like a corrupted WAV file. Re-export and re-upload the mix as a fresh WAV or MP3.`,
      );
    }
  }

  if (isKnownAudioContainer(header)) {
    return;
  }

  if (blobType.startsWith('audio/')) {
    return;
  }

  if (!blobType || blobType === 'application/octet-stream') {
    if (audioFileExtensionPattern.test(fileName)) {
      return;
    }
  }

  if (nonAudioBlobTypePattern.test(blobType)) {
    throw new Error(`Downloaded ${fileName} as ${blobType} instead of audio.`);
  }
};

export interface WaveformPlayerHandle {
  seekTo: (timeSeconds: number) => void;
  getCurrentTime: () => number;
}

export const WaveformPlayer = forwardRef<WaveformPlayerHandle, WaveformPlayerProps>(
  function WaveformPlayer({ versionId, mixFile, onTimeChange }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const objectUrlRef = useRef<string | null>(null);
    const [status, setStatus] = useState<WaveformStatus>('idle');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        seekTo(timeSeconds) {
          const wavesurfer = wavesurferRef.current;

          if (!wavesurfer) {
            return;
          }

          const resolvedDuration = wavesurfer.getDuration();
          const clampedTime = Math.min(Math.max(timeSeconds, 0), resolvedDuration || timeSeconds);
          wavesurfer.setTime(clampedTime);
          setCurrentTime(clampedTime);
          onTimeChange?.(clampedTime);
        },
        getCurrentTime() {
          return wavesurferRef.current?.getCurrentTime() ?? currentTime;
        },
      }),
      [currentTime, onTimeChange],
    );

    useEffect(() => {
      let isActive = true;
      const container = containerRef.current;

      const destroyWaveform = (): void => {
        wavesurferRef.current?.destroy();
        wavesurferRef.current = null;

        if (objectUrlRef.current) {
          window.URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
      };

      const resetPlaybackState = (): void => {
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        onTimeChange?.(0);
      };

      destroyWaveform();
      resetPlaybackState();

      if (!mixFile || !container) {
        setStatus('idle');
        setErrorMessage(null);
        return;
      }

      setStatus('loading');
      setErrorMessage(null);

      const initializeWaveform = async (): Promise<void> => {
        try {
          const download = await versionsService.downloadFile({ versionId, fileAsset: mixFile });

          if (!isActive) {
            return;
          }

          await assertAudioDownload(download.blob, download.fileName);

          const objectUrl = window.URL.createObjectURL(download.blob);
          objectUrlRef.current = objectUrl;

          const wavesurfer = WaveSurfer.create({
            container,
            waveColor: '#29515a',
            progressColor: '#65f4d7',
            cursorColor: '#f6b85e',
            barWidth: 3,
            barGap: 2,
            height: 132,
            normalize: true,
            dragToSeek: true,
          });

          wavesurferRef.current = wavesurfer;

          wavesurfer.on('ready', (readyDuration) => {
            if (!isActive) {
              return;
            }

            setDuration(readyDuration || wavesurfer.getDuration());
            setStatus('ready');
          });
          wavesurfer.on('play', () => {
            if (isActive) {
              setIsPlaying(true);
            }
          });
          wavesurfer.on('pause', () => {
            if (isActive) {
              setIsPlaying(false);
            }
          });
          wavesurfer.on('finish', () => {
            if (!isActive) {
              return;
            }

            setIsPlaying(false);
            setCurrentTime(0);
            onTimeChange?.(0);
          });
          wavesurfer.on('timeupdate', (time) => {
            if (!isActive) {
              return;
            }

            setCurrentTime(time);
            onTimeChange?.(time);
          });
          wavesurfer.on('seeking', (time) => {
            if (!isActive) {
              return;
            }

            setCurrentTime(time);
            onTimeChange?.(time);
          });
          wavesurfer.on('error', (error) => {
            if (!isActive) {
              return;
            }

            setStatus('error');
            setErrorMessage(getWaveformErrorMessage(error, download.fileName));
          });

          await wavesurfer.load(objectUrl);
        } catch (error) {
          if (isActive) {
            setStatus('error');
            setErrorMessage(getWaveformErrorMessage(error, mixFile.name));
          }
        }
      };

      void initializeWaveform();

      return () => {
        isActive = false;
        destroyWaveform();
      };
    }, [mixFile, onTimeChange, versionId]);

    const handleTogglePlayback = (): void => {
      wavesurferRef.current?.playPause();
    };

    if (!mixFile) {
      return (
        <div className="waveform-player waveform-player--empty">
          <EmptyState
            title="No mix file"
            description={`Upload a ${FILE_TYPE_LABELS[PRIMARY_MIX_FILE_TYPE]} file to this version to render a waveform preview.`}
          />
        </div>
      );
    }

    return (
      <div className="waveform-player">
        <div className="waveform-player__frame">
          <div ref={containerRef} className="waveform-player__canvas" />
          {status === 'loading' ? (
            <div className="waveform-player__loading">
              <LoadingSpinner label="Preparing waveform..." />
            </div>
          ) : null}
        </div>

        <div className="waveform-player__controls">
          <button
            type="button"
            className="control-button"
            onClick={handleTogglePlayback}
            disabled={status !== 'ready'}
          >
            {isPlaying ? 'Pause Preview' : 'Play Preview'}
          </button>

          <span className="waveform-player__status">
            {status === 'error'
              ? errorMessage
              : `${formatPlaybackTime(currentTime)} / ${formatPlaybackTime(duration)}`}
          </span>
        </div>
      </div>
    );
  },
);
