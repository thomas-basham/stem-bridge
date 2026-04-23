import { Link } from 'react-router-dom';
import type { ProjectSummary } from '@shared/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatCard } from '@/components/ui/StatCard';
import { useProjects } from '@/features/projects/useProjects';

const formatTimestamp = (isoDate: string): string => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return formatter.format(new Date(isoDate));
};

const renderProjects = (projectsState: ReturnType<typeof useProjects>) => {
  if (projectsState.status === 'loading') {
    return <div className="loading-state">Loading project library...</div>;
  }

  if (projectsState.status === 'error') {
    return (
      <EmptyState
        tone="error"
        title="Projects unavailable"
        description={projectsState.errorMessage}
      />
    );
  }

  if (projectsState.data.length === 0) {
    return (
      <EmptyState
        title="No projects yet"
        description="Create the first protected project route to start sharing versions and files."
      />
    );
  }

  return (
    <ul className="project-list">
      {projectsState.data.map((project: ProjectSummary) => (
        <li key={project.id} className="project-list__item">
          <Link to={`/projects/${project.id}`} className="project-list__link">
            <div className="project-list__summary">
              <div className="project-list__identity">
                <h4>{project.title}</h4>
                <p>
                  Owner: {project.owner} · {project.collaboratorCount} collaborators
                </p>
              </div>

              <div className="project-list__meta">
                <span className="status-pill">{project.status}</span>
                <span>{project.versionCount} versions</span>
                <span>{formatTimestamp(project.lastUpdated)}</span>
              </div>
            </div>

            <span className="project-list__cta">Open Project</span>
          </Link>
        </li>
      ))}
    </ul>
  );
};

export function ProjectsPage() {
  const projectsState = useProjects();

  const projectCount =
    projectsState.status === 'success' ? String(projectsState.data.length) : '...';
  const versionCount =
    projectsState.status === 'success'
      ? String(
          projectsState.data.reduce((total, project) => {
            return total + project.versionCount;
          }, 0),
        )
      : '...';
  const collaboratorCount =
    projectsState.status === 'success'
      ? String(
          projectsState.data.reduce((total, project) => {
            return total + project.collaboratorCount;
          }, 0),
        )
      : '...';

  return (
    <PageContainer
      eyebrow="Projects"
      title="Project Library"
      description="Browse active workspaces, jump into route-protected project detail views, and keep desktop collaboration flows organized."
      actions={<span className="tag">Authenticated Navigation</span>}
    >
      <div className="stats-grid">
        <StatCard
          label="Projects"
          value={projectCount}
          detail="Authenticated workspaces"
          tone="teal"
        />
        <StatCard
          label="Versions"
          value={versionCount}
          detail="Tracked revisions across sessions"
          tone="amber"
        />
        <StatCard
          label="Collaborators"
          value={collaboratorCount}
          detail="People routed into active projects"
          tone="slate"
        />
      </div>

      <div className="content-grid">
        <SectionCard
          title="Active Projects"
          subtitle="Projects route into a dedicated detail view with placeholder collaboration panels."
          action={<span className="tag">/projects/:projectId</span>}
        >
          {renderProjects(projectsState)}
        </SectionCard>

        <SectionCard
          title="Routing Overview"
          subtitle="The shell separates authenticated project views from public auth pages."
        >
          <div className="info-stack">
            <div className="info-row">
              <span>Public</span>
              <strong>/login, /register</strong>
            </div>
            <div className="info-row">
              <span>Protected</span>
              <strong>/projects, /projects/:projectId</strong>
            </div>
            <div className="info-row">
              <span>Fallback</span>
              <strong>404 page with context-aware navigation</strong>
            </div>
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
