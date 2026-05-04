import { describe, expect, it } from 'vitest';
import { sanitizeDownloadFileName } from '@/lib/file-download';

describe('sanitizeDownloadFileName', () => {
  it('removes path separators and reserved filename characters', () => {
    expect(sanitizeDownloadFileName('../mix:final?.wav')).toBe('..-mix-final-.wav');
  });

  it('falls back when a filename has no usable characters', () => {
    expect(sanitizeDownloadFileName('   ')).toBe('download');
  });
});
