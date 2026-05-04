import { useState } from 'react';
import type { ProjectSummary } from '@shared/types';
import { Button, EmptyState, LoadingSpinner } from '@/components/ui';
import { notifyProjectActivityChanged } from '@/features/projects/projectActivityEvents';
import { useProjectInvites } from '@/features/projects/useProjectInvites';
import { InviteCollaboratorModal } from './InviteCollaboratorModal';
import { InviteList } from './InviteList';
import { formatProjectDate } from './project-detail-format';

type ProjectCollaborator = NonNullable<ProjectSummary['collaborators']>[number];

interface CollaboratorsPanelProps {
  projectId: string;
  collaborators: ProjectCollaborator[];
  collaboratorCount: number;
}

const getCollaboratorLabel = (collaborator: ProjectCollaborator): string => {
  return collaborator.user.name || collaborator.user.email;
};

export function CollaboratorsPanel({
  projectId,
  collaborators,
  collaboratorCount,
}: CollaboratorsPanelProps) {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const invitesState = useProjectInvites(projectId);

  return (
    <>
      <section className="collaborators-panel">
        <div className="collaborators-panel__header">
          <div>
            <h4>Collaborators</h4>
            <p>Project access and pending invitations</p>
          </div>
          <Button type="button" size="sm" onClick={() => setIsInviteModalOpen(true)}>
            Invite
          </Button>
        </div>

        <div className="collaborators-section">
          <div className="collaborators-section__header">
            <h5>Active Collaborators</h5>
            <span>{collaboratorCount}</span>
          </div>

          {collaborators.length > 0 ? (
            <ul className="collaborator-list">
              {collaborators.map((collaborator) => (
                <li key={collaborator.id} className="collaborator-list-item">
                  <strong>{getCollaboratorLabel(collaborator)}</strong>
                  <span>{collaborator.user.email}</span>
                  <small>Joined {formatProjectDate(collaborator.joinedAt)}</small>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No collaborator list yet"
              description={`${collaboratorCount} collaborator${
                collaboratorCount === 1 ? '' : 's'
              } on this project.`}
            />
          )}
        </div>

        <div className="collaborators-section">
          <div className="collaborators-section__header">
            <h5>Pending Invites</h5>
            <span>{invitesState.status === 'success' ? invitesState.data.length : '...'}</span>
          </div>

          {invitesState.status === 'loading' ? (
            <div className="collaborators-panel__loading">
              <LoadingSpinner label="Loading invites..." size="sm" />
            </div>
          ) : null}

          {invitesState.status === 'error' ? (
            <EmptyState
              tone="error"
              title="Invites unavailable"
              description={invitesState.errorMessage}
              action={
                <Button type="button" variant="secondary" size="sm" onClick={() => void invitesState.refresh()}>
                  Retry
                </Button>
              }
            />
          ) : null}

          {invitesState.status === 'success' ? <InviteList invites={invitesState.data} /> : null}
        </div>
      </section>

      <InviteCollaboratorModal
        open={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={async (email) => {
          await invitesState.createInvite({ email });
          notifyProjectActivityChanged(projectId);
        }}
      />
    </>
  );
}
