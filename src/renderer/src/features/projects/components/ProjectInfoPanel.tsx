import type { ProjectSummary } from '@shared/types';
import { CollaboratorsPanel } from './CollaboratorsPanel';
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

      <CollaboratorsPanel
        projectId={project.id}
        collaborators={collaborators}
        collaboratorCount={project.collaboratorCount}
      />
    </aside>
  );
}
