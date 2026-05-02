import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithAppProviders } from '@/test/render';
import { WaveformPlayer } from './WaveformPlayer';

vi.mock('wavesurfer.js', () => ({
  default: {
    create: vi.fn(),
  },
}));

describe('WaveformPlayer', () => {
  it('shows an empty state when no mix file exists', () => {
    renderWithAppProviders(<WaveformPlayer versionId="version-1" />);

    expect(screen.getByText(/no mix file/i)).toBeInTheDocument();
    expect(screen.getByText(/render a waveform preview/i)).toBeInTheDocument();
  });
});
