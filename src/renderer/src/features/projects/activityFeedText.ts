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
    case 'INVITE_SENT': {
      const email = getMetadataString(metadata, 'email');
      return email ? `Invite created for ${email}.` : 'Invite created.';
    }
    case 'INVITE_ACCEPTED': {
      const email = getMetadataString(metadata, 'email');
      return email ? `${email} accepted an invite.` : 'Invite accepted.';
    }
    case 'VERSION_CREATED': {
      const versionNumber = getMetadataNumber(metadata, 'versionNumber');
      return versionNumber ? `Version ${versionNumber} created.` : 'Version created.';
    }
    case 'FILE_UPLOADED': {
      const fileName = getMetadataString(metadata, 'name');
      const fileType = getMetadataString(metadata, 'type');
      const fileLabel = fileName ?? 'File';
      return fileType ? `${fileLabel} added as ${fileType}.` : `${fileLabel} added.`;
    }
    case 'COMMENT_ADDED': {
      const timestampSeconds = getMetadataNumber(metadata, 'timestampSeconds');
      return timestampSeconds === null
        ? 'Comment added.'
        : `Comment added at ${formatPlaybackTime(timestampSeconds)}.`;
    }
    case 'PROJECT_CREATED':
      return 'Project created.';
    case 'PROJECT_UPDATED':
      return 'Project updated.';
    case 'MEMBER_ADDED':
      return 'Collaborator added.';
    case 'MEMBER_REMOVED':
      return 'Collaborator removed.';
    default:
      return formatEventType(event.type);
  }
};
