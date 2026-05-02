import { ACTIVITY_EVENT_TYPES, ACTIVITY_METADATA_KEYS } from '@/constants/app-constants';
import { formatPlaybackTime } from '@/lib/time';
import type { ActivityEvent } from '@/types/api';

const getMetadataString = (
  metadata: ActivityEvent['metadata'],
  key: string,
): string | null => {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const getMetadataNumber = (
  metadata: ActivityEvent['metadata'],
  key: string,
): number | null => {
  const value = metadata?.[key];

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  return null;
};

const formatEventType = (type: string): string => {
  const label = type
    .toLowerCase()
    .split('_')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ''))
    .filter(Boolean)
    .join(' ');

  return label || 'Activity event';
};

export const getActivityEventText = (event: ActivityEvent): string => {
  const { metadata } = event;

  switch (event.type) {
    case ACTIVITY_EVENT_TYPES.inviteSent: {
      const email = getMetadataString(metadata, ACTIVITY_METADATA_KEYS.email);
      return email ? `Invite created for ${email}.` : 'Invite created.';
    }
    case ACTIVITY_EVENT_TYPES.inviteAccepted: {
      const email = getMetadataString(metadata, ACTIVITY_METADATA_KEYS.email);
      return email ? `${email} accepted an invite.` : 'Invite accepted.';
    }
    case ACTIVITY_EVENT_TYPES.versionCreated: {
      const versionNumber = getMetadataNumber(metadata, ACTIVITY_METADATA_KEYS.versionNumber);
      return versionNumber ? `Version ${versionNumber} created.` : 'Version created.';
    }
    case ACTIVITY_EVENT_TYPES.fileUploaded: {
      const fileName = getMetadataString(metadata, ACTIVITY_METADATA_KEYS.fileName);
      const fileType = getMetadataString(metadata, ACTIVITY_METADATA_KEYS.fileType);
      const fileLabel = fileName ?? 'File';
      return fileType ? `${fileLabel} added as ${fileType}.` : `${fileLabel} added.`;
    }
    case ACTIVITY_EVENT_TYPES.commentAdded: {
      const timestampSeconds = getMetadataNumber(
        metadata,
        ACTIVITY_METADATA_KEYS.timestampSeconds,
      );
      return timestampSeconds === null
        ? 'Comment added.'
        : `Comment added at ${formatPlaybackTime(timestampSeconds)}.`;
    }
    case ACTIVITY_EVENT_TYPES.projectCreated:
      return 'Project created.';
    case ACTIVITY_EVENT_TYPES.projectUpdated:
      return 'Project updated.';
    case ACTIVITY_EVENT_TYPES.memberAdded:
      return 'Collaborator added.';
    case ACTIVITY_EVENT_TYPES.memberRemoved:
      return 'Collaborator removed.';
    default:
      return formatEventType(event.type);
  }
};
