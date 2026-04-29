import { useRef, useState, type DragEvent } from 'react';
import { Button } from '@/components/ui';

interface FileDropzoneProps {
  disabled?: boolean;
  onFilesAdded: (files: File[]) => void;
}

const getFilesFromList = (fileList: FileList | null): File[] => {
  return fileList ? Array.from(fileList) : [];
};

export function FileDropzone({ disabled = false, onFilesAdded }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();

    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (): void => {
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setIsDragging(false);

    if (disabled) {
      return;
    }

    onFilesAdded(getFilesFromList(event.dataTransfer.files));
  };

  return (
    <div
      className={isDragging ? 'file-dropzone file-dropzone--active' : 'file-dropzone'}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        className="file-dropzone__input"
        type="file"
        multiple
        disabled={disabled}
        onChange={(event) => {
          onFilesAdded(getFilesFromList(event.target.files));
          event.target.value = '';
        }}
      />
      <div className="file-dropzone__copy">
        <strong>Drop files here</strong>
        <span>Upload stems, mixes, MIDI, samples, and other session assets.</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        Choose Files
      </Button>
    </div>
  );
}
