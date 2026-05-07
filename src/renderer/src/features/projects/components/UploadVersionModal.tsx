import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { DesktopCachedUploadFile } from '@shared/types';
import { Button, Modal, Textarea, useToast } from '@/components/ui';
import { FileDropzone } from '@/components/upload/FileDropzone';
import { UploadFileList } from '@/components/upload/UploadFileList';
import type { PendingUploadFile } from '@/components/upload/uploadTypes';
import { DEFAULT_UPLOAD_FILE_TYPE } from '@/constants/app-constants';
import { notifyProjectActivityChanged } from '@/features/projects/projectActivityEvents';
import { versionsService } from '@/features/projects/versionsService';
import { markDesktopDawCandidatesImported } from '@/lib/desktop';
import type { VersionFileAssetType } from '@/types/api';

type UploadDestination = 'latest' | 'new';

interface UploadVersionModalProps {
  open: boolean;
  projectId: string;
  latestVersion?: {
    id: string;
    versionNumber: number;
  } | null;
  initialFiles?: Array<{
    candidateId?: string;
    file: File;
    cachedFile?: DesktopCachedUploadFile;
    type?: VersionFileAssetType;
  }>;
  initialFilesKey?: number;
  onClose: () => void;
  onComplete: (versionId: string) => Promise<void>;
}

const createUploadFile = (params: {
  file: File;
  cachedFile?: DesktopCachedUploadFile;
  type?: VersionFileAssetType;
  candidateId?: string;
}): PendingUploadFile => ({
  id: window.crypto.randomUUID(),
  dawCandidateId: params.candidateId,
  file: params.file,
  cachedFile: params.cachedFile,
  type: params.type ?? DEFAULT_UPLOAD_FILE_TYPE,
  progress: 0,
  status: 'pending',
});

export function UploadVersionModal({
  open,
  projectId,
  latestVersion = null,
  initialFiles = [],
  initialFilesKey = 0,
  onClose,
  onComplete,
}: UploadVersionModalProps) {
  const toast = useToast();
  const [notes, setNotes] = useState('');
  const [destination, setDestination] = useState<UploadDestination>(
    latestVersion ? 'latest' : 'new',
  );
  const [files, setFiles] = useState<PendingUploadFile[]>([]);
  const [createdVersionId, setCreatedVersionId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canUseLatestVersion = latestVersion !== null;
  const hasFiles = files.length > 0;
  const effectiveDestination: UploadDestination = canUseLatestVersion ? destination : 'new';
  const uploadableFiles = useMemo(
    () => files.filter((file) => file.status !== 'success'),
    [files],
  );

  const resetForm = (): void => {
    setNotes('');
    setDestination(latestVersion ? 'latest' : 'new');
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

    setFiles((currentFiles) => [
      ...currentFiles,
      ...nextFiles.map((file) =>
        createUploadFile({
          file,
        }),
      ),
    ]);
    setSubmitError(null);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    setDestination(latestVersion ? 'latest' : 'new');
  }, [latestVersion, open]);

  useEffect(() => {
    if (!open || initialFiles.length === 0) {
      return;
    }

    setFiles((currentFiles) => [
      ...currentFiles,
      ...initialFiles.map((initialFile) => {
        return createUploadFile({
          file: initialFile.file,
          cachedFile: initialFile.cachedFile,
          type: initialFile.type,
          candidateId: initialFile.candidateId,
        });
      }),
    ]);
  }, [initialFiles, initialFilesKey, open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!hasFiles) {
      setSubmitError('Add at least one file before uploading a version.');
      return;
    }

    setIsUploading(true);
    setSubmitError(null);

    let versionId = effectiveDestination === 'latest' ? latestVersion?.id ?? null : createdVersionId;
    let failedUploads = 0;

    try {
      if (!versionId) {
        const createdVersion = await versionsService.create(projectId, {
          notes: notes.trim() || undefined,
        });
        versionId = createdVersion.id;
        setCreatedVersionId(createdVersion.id);
      }

      if (!versionId) {
        throw new Error('Choose a destination version before uploading.');
      }

      for (const uploadFile of uploadableFiles) {
        patchFile(uploadFile.id, { status: 'uploading', progress: 0, errorMessage: undefined });

        try {
          await versionsService.uploadFile({
            versionId,
            file: uploadFile.file,
            cachedFile: uploadFile.cachedFile,
            type: uploadFile.type,
            onProgress: (progress) => patchFile(uploadFile.id, { progress }),
          });
          patchFile(uploadFile.id, { status: 'success', progress: 100 });

          if (uploadFile.dawCandidateId) {
            try {
              await markDesktopDawCandidatesImported([uploadFile.dawCandidateId]);
            } catch {
              // The upload succeeded; a later scan can still show the candidate if marking failed.
            }
          }
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

      toast.success(
        effectiveDestination === 'latest' ? 'Files uploaded' : 'Version uploaded',
        effectiveDestination === 'latest'
          ? 'The latest version has the imported files.'
          : 'The new version is selected and ready for review.',
      );
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
      description="Attach files to the latest version or create a new version for review."
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
            {effectiveDestination === 'latest' ? 'Upload Files' : 'Upload Version'}
          </Button>
        </>
      }
    >
      <form id="upload-version-form" className="upload-version-form" onSubmit={handleSubmit}>
        <fieldset className="upload-destination" disabled={isUploading}>
          <legend>Destination</legend>
          <label>
            <input
              type="radio"
              name="uploadDestination"
              value="latest"
              checked={effectiveDestination === 'latest'}
              disabled={!canUseLatestVersion || isUploading}
              onChange={() => setDestination('latest')}
            />
            <span>
              Add to latest version
              {latestVersion ? ` · v${latestVersion.versionNumber}` : ' · no version yet'}
            </span>
          </label>
          <label>
            <input
              type="radio"
              name="uploadDestination"
              value="new"
              checked={effectiveDestination === 'new'}
              onChange={() => setDestination('new')}
            />
            <span>Create new version</span>
          </label>
        </fieldset>

        {effectiveDestination === 'new' ? (
          <Textarea
            label="Notes"
            name="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="What changed in this version?"
            disabled={isUploading || createdVersionId !== null}
          />
        ) : null}

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
