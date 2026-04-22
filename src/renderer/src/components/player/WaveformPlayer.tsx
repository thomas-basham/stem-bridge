import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { EmptyState } from '@/components/ui/EmptyState';

interface WaveformPlayerProps {
  audioUrl?: string;
}

export function WaveformPlayer({ audioUrl }: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!audioUrl || !containerRef.current) {
      setIsReady(false);
      setIsPlaying(false);
      return;
    }

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#29515a',
      progressColor: '#65f4d7',
      cursorColor: '#f6b85e',
      barWidth: 3,
      barGap: 2,
      height: 112,
      normalize: true,
      dragToSeek: true,
    });

    wavesurferRef.current = wavesurfer;
    wavesurfer.load(audioUrl);

    const handleReady = (): void => setIsReady(true);
    const handlePlay = (): void => setIsPlaying(true);
    const handlePause = (): void => setIsPlaying(false);

    wavesurfer.on('ready', handleReady);
    wavesurfer.on('play', handlePlay);
    wavesurfer.on('pause', handlePause);
    wavesurfer.on('finish', handlePause);

    return () => {
      wavesurfer.destroy();
      wavesurferRef.current = null;
      setIsReady(false);
      setIsPlaying(false);
    };
  }, [audioUrl]);

  const handleTogglePlayback = (): void => {
    wavesurferRef.current?.playPause();
  };

  if (!audioUrl) {
    return (
      <div className="waveform-player waveform-player--empty">
        <EmptyState
          title="No version selected"
          description="The waveform panel is wired with wavesurfer.js and ready for mixdown playback when version audio is available."
        />
      </div>
    );
  }

  return (
    <div className="waveform-player">
      <div ref={containerRef} className="waveform-player__canvas" />

      <div className="waveform-player__controls">
        <button
          type="button"
          className="control-button"
          onClick={handleTogglePlayback}
          disabled={!isReady}
        >
          {isPlaying ? 'Pause Preview' : 'Play Preview'}
        </button>

        <span className="waveform-player__status">
          {isReady ? 'Waveform ready' : 'Preparing waveform'}
        </span>
      </div>
    </div>
  );
}
