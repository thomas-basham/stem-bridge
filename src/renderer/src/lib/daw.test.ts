import { describe, expect, it } from 'vitest';
import { inferDawFileType, shouldScanAbletonProjectDirectory } from '@shared/daw';

describe('inferDawFileType', () => {
  it('classifies MIDI exports by extension', () => {
    expect(inferDawFileType('Verse Hook.mid')).toBe('MIDI');
    expect(inferDawFileType('Bridge MIDI Export.midi')).toBe('MIDI');
  });

  it('classifies likely full mix exports by name', () => {
    expect(inferDawFileType('Late Night Mix.wav')).toBe('MIX');
    expect(inferDawFileType('Song Master Bounce.aiff')).toBe('MIX');
  });

  it('classifies loops and samples before falling back to stems', () => {
    expect(inferDawFileType('808 sample.wav')).toBe('SAMPLE');
    expect(inferDawFileType('Lead Vocal.wav')).toBe('STEM');
  });

  it('ignores Ableton backup folders during project scans', () => {
    expect(shouldScanAbletonProjectDirectory('Backup')).toBe(false);
    expect(shouldScanAbletonProjectDirectory('backup')).toBe(false);
    expect(shouldScanAbletonProjectDirectory('Samples')).toBe(true);
  });
});
