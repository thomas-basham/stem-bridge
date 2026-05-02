import { Link, useParams } from 'react-router-dom';
import { EmptyState, Skeleton } from '@/components/ui';
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
        <div className="project-detail-shell" aria-hidden="true">
          <div className="project-detail-header project-detail-header--skeleton">
            <div className="project-detail-header__title">
              <Skeleton width={260} height={28} />
              <Skeleton width={180} height={16} />
            </div>
            <div className="project-detail-header__stats">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index}>
                  <Skeleton width={76} height={12} />
                  <Skeleton width={54} height={20} />
                </div>
              ))}
            </div>
            <Skeleton width={132} height={42} />
          </div>

          <div className="project-detail-grid">
            {Array.from({ length: 3 }, (_, panelIndex) => (
              <div key={panelIndex} className="project-detail-panel project-detail-panel--skeleton">
                <Skeleton width={150} height={22} />
                <Skeleton width="100%" height={80} />
                <Skeleton width="100%" height={80} />
                <Skeleton width="72%" height={80} />
              </div>
            ))}
          </div>
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
          description="Open a project from the dashboard so StemBridge can load a workspace you belong to."
        />
      </PageContainer>
    );
  }

  return <ProjectDetailShell project={projectState.data} />;
}
