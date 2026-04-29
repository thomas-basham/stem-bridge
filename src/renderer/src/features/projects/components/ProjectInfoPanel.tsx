import type { ProjectSummary } from '@shared/types';
import { EmptyState } from '@/components/ui';
import {
  formatProjectDate,
  getOwnerLabel,
  renderProjectValue,
} from './project-detail-format';

interface ProjectInfoPanelProps {
  project: ProjectSummary;
}

export function ProjectInfoPanel({ project }: ProjectInfoPanelProps) {
  const collaborators = project.collaborators ?? [];

  return (
    <aside className="project-detail-panel project-detail-panel--info">
      <div className="project-detail-panel__header">
        <div>
          <h4>Project Info</h4>
          <p>Workspace metadata and access context</p>
        </div>
      </div>

      <div className="info-stack">
        <div className="info-row">
          <span>Owner</span>
          <strong>{getOwnerLabel(project)}</strong>
        </div>
        <div className="info-row">
          <span>BPM</span>
          <strong>{renderProjectValue(project.bpm)}</strong>
        </div>
        <div className="info-row">
          <span>Musical Key</span>
          <strong>{renderProjectValue(project.musicalKey)}</strong>
        </div>
        <div className="info-row">
          <span>Created</span>
          <strong>{formatProjectDate(project.createdAt)}</strong>
        </div>
        <div className="info-row">
          <span>Updated</span>
          <strong>{formatProjectDate(project.updatedAt)}</strong>
        </div>
      </div>

      <div className="project-collaborators">
        <h5>Collaborators</h5>
        {collaborators.length > 0 ? (
          <ul>
            {collaborators.map((collaborator) => (
              <li key={collaborator.id}>
                <strong>{collaborator.user.name || collaborator.user.email}</strong>
                <span>Joined {formatProjectDate(collaborator.joinedAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No collaborator list yet"
            description={`${project.collaboratorCount} collaborator${
              project.collaboratorCount === 1 ? '' : 's'
            } on this project.`}
          />
        )}
      </div>
    </aside>
  );
}
