export const sanitizeDownloadFileName = (fileName: string): string => {
  const sanitizedFileName = fileName
    .split('')
    .filter((character) => {
      const charCode = character.charCodeAt(0);
      return charCode > 31 && charCode !== 127;
    })
    .join('')
    .replace(/[<>:"/\\|?*]/g, '-')
    .trim()
    .slice(0, 180);

  return sanitizedFileName || 'download';
};

export const triggerBlobDownload = (blob: Blob, fileName: string): void => {
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = sanitizeDownloadFileName(fileName);
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
};
