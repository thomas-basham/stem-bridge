import { Link, useParams } from 'react-router-dom';
import { EmptyState, LoadingSpinner } from '@/components/ui';
import { PageContainer } from '@/components/layout/PageContainer';
import { ProjectDetailShell } from '@/features/projects/components/ProjectDetailShell';
import { useProject } from '@/features/projects/useProject';

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const projectState = useProject(projectId);

  if (projectState.status === 'loading') {
    return (
      <PageContainer
        eyebrow="Project Detail"
        title="Loading project"
        description="Fetching the requested project route."
        actions={
          <Link to="/projects" className="control-button control-button--ghost">
            Back to Projects
          </Link>
        }
      >
        <div className="loading-state">
          <LoadingSpinner label="Loading project workspace..." />
        </div>
      </PageContainer>
    );
  }

  if (projectState.status === 'error') {
    return (
      <PageContainer
        eyebrow="Project Detail"
        title="Project unavailable"
        description="The protected detail route could not load."
        actions={
          <Link to="/projects" className="control-button control-button--ghost">
            Back to Projects
          </Link>
        }
      >
        <EmptyState
          tone="error"
          title="Unable to open project"
          description={projectState.errorMessage}
        />
      </PageContainer>
    );
  }

  if (projectState.status === 'not-found') {
    return (
      <PageContainer
        eyebrow="Project Detail"
        title="Project not found"
        description="The requested project route does not map to an available workspace."
        actions={
          <Link to="/projects" className="control-button control-button--ghost">
            Back to Projects
          </Link>
        }
      >
        <EmptyState
          title="Missing project"
          description="Try opening a project from the list view instead of navigating directly to an unknown project id."
        />
      </PageContainer>
    );
  }

  return <ProjectDetailShell project={projectState.data} />;
}
