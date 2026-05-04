import { useMemo, useState, type FormEvent } from 'react';
import { Button, Modal, Textarea, useToast } from '@/components/ui';
import { FileDropzone } from '@/components/upload/FileDropzone';
import { UploadFileList } from '@/components/upload/UploadFileList';
import type { PendingUploadFile } from '@/components/upload/uploadTypes';
import { DEFAULT_UPLOAD_FILE_TYPE } from '@/constants/app-constants';
import { notifyProjectActivityChanged } from '@/features/projects/projectActivityEvents';
import { versionsService } from '@/features/projects/versionsService';

interface UploadVersionModalProps {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onComplete: (versionId: string) => Promise<void>;
}

const createUploadFile = (file: File): PendingUploadFile => ({
  id: window.crypto.randomUUID(),
  file,
  type: DEFAULT_UPLOAD_FILE_TYPE,
  progress: 0,
  status: 'pending',
});

export function UploadVersionModal({
  open,
  projectId,
  onClose,
  onComplete,
}: UploadVersionModalProps) {
  const toast = useToast();
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<PendingUploadFile[]>([]);
  const [createdVersionId, setCreatedVersionId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const hasFiles = files.length > 0;
  const uploadableFiles = useMemo(
    () => files.filter((file) => file.status !== 'success'),
    [files],
  );

  const resetForm = (): void => {
    setNotes('');
    setFiles([]);
    setCreatedVersionId(null);
    setSubmitError(null);
  };

  const handleClose = (): void => {
    if (isUploading) {
      return;
    }

    resetForm();
    onClose();
  };

  const patchFile = (fileId: string, patch: Partial<PendingUploadFile>): void => {
    setFiles((currentFiles) =>
      currentFiles.map((file) => (file.id === fileId ? { ...file, ...patch } : file)),
    );
  };

  const handleFilesAdded = (nextFiles: File[]): void => {
    if (nextFiles.length === 0) {
      return;
    }

    setFiles((currentFiles) => [...currentFiles, ...nextFiles.map(createUploadFile)]);
    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!hasFiles) {
      setSubmitError('Add at least one file before uploading a version.');
      return;
    }

    setIsUploading(true);
    setSubmitError(null);

    let versionId = createdVersionId;
    let failedUploads = 0;

    try {
      if (!versionId) {
        const createdVersion = await versionsService.create(projectId, {
          notes: notes.trim() || undefined,
        });
        versionId = createdVersion.id;
        setCreatedVersionId(createdVersion.id);
      }

      for (const uploadFile of uploadableFiles) {
        patchFile(uploadFile.id, { status: 'uploading', progress: 0, errorMessage: undefined });

        try {
          await versionsService.uploadFile({
            versionId,
            file: uploadFile.file,
            type: uploadFile.type,
            onProgress: (progress) => patchFile(uploadFile.id, { progress }),
          });
          patchFile(uploadFile.id, { status: 'success', progress: 100 });
        } catch (error) {
          failedUploads += 1;
          patchFile(uploadFile.id, {
            status: 'error',
            progress: 0,
            errorMessage: error instanceof Error ? error.message : 'Upload failed.',
          });
        }
      }

      await onComplete(versionId);
      notifyProjectActivityChanged(projectId);

      if (failedUploads > 0) {
        const message = 'One or more files failed to upload. Fix the file list and retry.';
        setSubmitError(message);
        toast.error('Version upload incomplete', message);
        return;
      }

      toast.success('Version uploaded', 'The new version is selected and ready for review.');
      resetForm();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create version.';
      setSubmitError(message);
      toast.error('Version upload failed', message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Upload Version"
      description="Create a version, attach files, and make it available in the project timeline."
      closeDisabled={isUploading}
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="upload-version-form"
            disabled={!hasFiles || uploadableFiles.length === 0}
            isLoading={isUploading}
            loadingLabel="Uploading..."
          >
            Upload Version
          </Button>
        </>
      }
    >
      <form id="upload-version-form" className="upload-version-form" onSubmit={handleSubmit}>
        <Textarea
          label="Notes"
          name="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="What changed in this version?"
          disabled={isUploading || createdVersionId !== null}
        />

        <FileDropzone disabled={isUploading} onFilesAdded={handleFilesAdded} />

        <UploadFileList
          files={files}
          disabled={isUploading}
          onRemove={(fileId) => {
            setFiles((currentFiles) => currentFiles.filter((file) => file.id !== fileId));
          }}
          onTypeChange={(fileId, type) => patchFile(fileId, { type })}
        />

        {submitError ? (
          <p className="auth-form__error" role="alert">
            {submitError}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
