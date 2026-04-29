import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { versionsService } from '@/features/projects/versionsService';
import type { VersionFileAsset } from '@/types/api';

interface WaveformPlayerProps {
  versionId: string;
  mixFile?: VersionFileAsset;
}

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');

  return `${minutes}:${remainingSeconds}`;
};

export function WaveformPlayer({ versionId, mixFile }: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const container = containerRef.current;

    const resetPlayer = (): void => {
      wavesurferRef.current?.destroy();
      wavesurferRef.current = null;

      if (objectUrlRef.current) {
        window.URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    };

    resetPlayer();

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

        if (isCancelled) {
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
          setDuration(readyDuration || wavesurfer.getDuration());
          setStatus('ready');
        });
        wavesurfer.on('play', () => setIsPlaying(true));
        wavesurfer.on('pause', () => setIsPlaying(false));
        wavesurfer.on('finish', () => {
          setIsPlaying(false);
          setCurrentTime(0);
        });
        wavesurfer.on('timeupdate', (time) => setCurrentTime(time));
        wavesurfer.on('seeking', (time) => setCurrentTime(time));
        wavesurfer.on('error', (error) => {
          setStatus('error');
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load waveform.');
        });

        await wavesurfer.load(objectUrl);
      } catch (error) {
        if (!isCancelled) {
          setStatus('error');
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load waveform.');
        }
      }
    };

    void initializeWaveform();

    return () => {
      isCancelled = true;
      resetPlayer();
    };
  }, [mixFile, versionId]);

  const handleTogglePlayback = (): void => {
    wavesurferRef.current?.playPause();
  };

  if (!mixFile) {
    return (
      <div className="waveform-player waveform-player--empty">
        <EmptyState
          title="No mix file"
          description="Upload a MIX file to this version to render a waveform preview."
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
            : `${formatTime(currentTime)} / ${formatTime(duration)}`}
        </span>
      </div>
    </div>
  );
}
