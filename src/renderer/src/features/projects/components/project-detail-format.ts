import type { ProjectSummary } from '@shared/types';
import type { User } from '@/types/api';

export const formatProjectDate = (isoDate: string | undefined): string => {
  if (!isoDate) {
    return 'Not available';
  }

  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const getOwnerLabel = (project: Pick<ProjectSummary, 'owner'>): string => {
  return project.owner?.name || project.owner?.email || 'Unknown owner';
};

export const getUserLabel = (user: Pick<User, 'email' | 'name'> | undefined): string => {
  return user?.name || user?.email || 'Unknown user';
};

export const renderProjectValue = (value: string | number | null | undefined): string => {
  return value === null || value === undefined || value === '' ? 'Not set' : String(value);
};
