import type { DesktopDawFileCandidate } from './types';

const getExtension = (fileName: string): string => {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? `.${match[1]}` : '';
};

export const shouldScanAbletonProjectDirectory = (directoryName: string): boolean => {
  return directoryName.toLowerCase() !== 'backup';
};

export const inferDawFileType = (fileName: string): DesktopDawFileCandidate['type'] => {
  const lowerName = fileName.toLowerCase();
  const extension = getExtension(lowerName);

  if (extension === '.mid' || extension === '.midi') {
    return 'MIDI';
  }

  if (lowerName.includes('mix') || lowerName.includes('bounce') || lowerName.includes('master')) {
    return 'MIX';
  }

  if (lowerName.includes('sample') || lowerName.includes('loop')) {
    return 'SAMPLE';
  }

  return 'STEM';
};
