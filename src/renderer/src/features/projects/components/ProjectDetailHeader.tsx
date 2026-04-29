import { Link } from 'react-router-dom';
import type { ProjectSummary } from '@shared/types';
import { Badge, Button } from '@/components/ui';
import { renderProjectValue } from './project-detail-format';

interface ProjectDetailHeaderProps {
  project: ProjectSummary;
  onOpenUpload: () => void;
}

export function ProjectDetailHeader({ project, onOpenUpload }: ProjectDetailHeaderProps) {
  return (
    <header className="project-detail-header">
      <div className="project-detail-header__title">
        <p className="page-container__eyebrow">Project Detail</p>
        <h3>{project.name}</h3>
      </div>

      <dl className="project-detail-header__stats" aria-label="Project metadata">
        <div>
          <dt>BPM</dt>
          <dd>{renderProjectValue(project.bpm)}</dd>
        </div>
        <div>
          <dt>Key</dt>
          <dd>{renderProjectValue(project.musicalKey)}</dd>
        </div>
        <div>
          <dt>Collaborators</dt>
          <dd>{project.collaboratorCount}</dd>
        </div>
      </dl>

      <div className="project-detail-header__actions">
        <Badge tone="violet">/projects/:projectId</Badge>
        <Button type="button" onClick={onOpenUpload}>
          Upload Version
        </Button>
        <Link to="/projects" className="control-button control-button--ghost">
          Back to Projects
        </Link>
      </div>
    </header>
  );
}
