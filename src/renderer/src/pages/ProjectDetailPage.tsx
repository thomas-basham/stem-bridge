import { Link, useParams } from 'react-router-dom';
import { EmptyState, LoadingSpinner } from '@/components/ui';
import { PageContainer } from '@/components/layout/PageContainer';
import { WaveformPlayer } from '@/components/player/WaveformPlayer';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatCard } from '@/components/ui/StatCard';
import { useProject } from '@/features/projects/useProject';

const formatTimestamp = (isoDate: string): string => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return formatter.format(new Date(isoDate));
};

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

  const project = projectState.data;

  return (
    <PageContainer
      eyebrow="Project Detail"
      title={project.title}
      description={`Owned by ${project.owner}. This placeholder detail screen is ready for version history, comments, and file delivery flows.`}
      actions={
        <Link to="/projects" className="control-button control-button--ghost">
          Back to Projects
        </Link>
      }
    >
      <div className="stats-grid">
        <StatCard
          label="Versions"
          value={String(project.versionCount)}
          detail="Saved revision checkpoints"
          tone="teal"
        />
        <StatCard
          label="Collaborators"
          value={String(project.collaboratorCount)}
          detail="People with project access"
          tone="amber"
        />
        <StatCard
          label="Last Updated"
          value={formatTimestamp(project.lastUpdated)}
          detail="Latest upload or note activity"
          tone="slate"
        />
      </div>

      <div className="content-grid">
        <SectionCard
          title="Version Preview"
          subtitle="wavesurfer.js is ready for mixdown playback once audio URLs are wired to the project."
        >
          <WaveformPlayer />
        </SectionCard>

        <SectionCard
          title="Project Snapshot"
          subtitle="Core route parameters and collaboration metadata."
        >
          <div className="info-stack">
            <div className="info-row">
              <span>Project Id</span>
              <strong>{project.id}</strong>
            </div>
            <div className="info-row">
              <span>Status</span>
              <strong>{project.status}</strong>
            </div>
            <div className="info-row">
              <span>Owner</span>
              <strong>{project.owner}</strong>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="content-grid content-grid--triple">
        <SectionCard
          title="Timestamped Comments"
          subtitle="Feedback threads can anchor to exact points in a version timeline."
        >
          <EmptyState
            title="No comments yet"
            description="This panel is reserved for playback-linked notes and revision requests."
          />
        </SectionCard>

        <SectionCard
          title="Files"
          subtitle="Stems, mixdowns, MIDI, samples, and bundled downloads."
        >
          <EmptyState
            title="No files uploaded"
            description="Wire project assets into this slot once the file API is available."
          />
        </SectionCard>

        <SectionCard
          title="Version Timeline"
          subtitle="Release checkpoints and review milestones."
        >
          <EmptyState
            title="No timeline events"
            description="Version history will appear here after uploads and comments are connected."
          />
        </SectionCard>
      </div>
    </PageContainer>
  );
}
