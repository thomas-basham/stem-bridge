import { Badge, EmptyState } from '@/components/ui';
import type { Invite, InviteStatus } from '@/types/api';
import { formatProjectDate, getUserLabel } from './project-detail-format';

interface InviteListProps {
  invites: Invite[];
}

const getInviteStatusTone = (status: InviteStatus): 'amber' | 'teal' | 'danger' | 'neutral' => {
  if (status === 'PENDING') {
    return 'amber';
  }

  if (status === 'ACCEPTED') {
    return 'teal';
  }

  if (status === 'DECLINED' || status === 'EXPIRED' || status === 'REVOKED') {
    return 'danger';
  }

  return 'neutral';
};

const formatInviteStatus = (status: InviteStatus): string => {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
};

export function InviteList({ invites }: InviteListProps) {
  if (invites.length === 0) {
    return (
      <EmptyState
        title="No pending invites"
        description="Invites awaiting acceptance will appear here."
      />
    );
  }

  return (
    <ul className="invite-list">
      {invites.map((invite) => (
        <li key={invite.id} className="invite-list-item">
          <div className="invite-list-item__main">
            <strong>{invite.email}</strong>
            <span>
              Invited {formatProjectDate(invite.createdAt)}
              {invite.invitedBy ? ` by ${getUserLabel(invite.invitedBy)}` : ''}
            </span>
          </div>
          <div className="invite-list-item__meta">
            <Badge tone={getInviteStatusTone(invite.status)}>{formatInviteStatus(invite.status)}</Badge>
            <span>Expires {formatProjectDate(invite.expiresAt)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
