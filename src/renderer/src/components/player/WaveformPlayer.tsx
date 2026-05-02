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
            setErrorMessage(error instanceof Error ? error.message : 'Unable to load waveform.');
          });

          await wavesurfer.load(objectUrl);
        } catch (error) {
          if (isActive) {
            setStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'Unable to load waveform.');
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
