import type { ProjectSummary } from '@shared/types';
import { WaveformPlayer } from '@/components/player/WaveformPlayer';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatCard } from '@/components/ui/StatCard';
import { useProjects } from '@/features/projects/useProjects';
import { useDesktopMetadata, type DesktopMetadataState } from '@/hooks/useDesktopMetadata';

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
    return <div className="loading-state">Loading collaboration workspace...</div>;
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
        description="Create the first StemBridge project to start collecting versions, stems, MIDI, and feedback."
      />
    );
  }

  return (
    <ul className="project-list">
      {projectsState.data.map((project: ProjectSummary) => (
        <li key={project.id} className="project-list__item">
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
        </li>
      ))}
    </ul>
  );
};

const renderDesktopMetadata = (state: DesktopMetadataState) => {
  if (state.status === 'loading') {
    return <div className="loading-state">Loading desktop runtime metadata...</div>;
  }

  if (state.status === 'error') {
    return (
      <EmptyState
        tone="error"
        title="Desktop bridge unavailable"
        description={state.errorMessage}
      />
    );
  }

  return (
    <dl className="metadata-list">
      <div>
        <dt>App</dt>
        <dd>
          {state.data.appName} v{state.data.appVersion}
        </dd>
      </div>
      <div>
        <dt>Electron</dt>
        <dd>{state.data.electronVersion}</dd>
      </div>
      <div>
        <dt>Chrome</dt>
        <dd>{state.data.chromeVersion}</dd>
      </div>
      <div>
        <dt>Node</dt>
        <dd>{state.data.nodeVersion}</dd>
      </div>
      <div>
        <dt>Platform</dt>
        <dd>{state.data.platform}</dd>
      </div>
    </dl>
  );
};

export function DashboardPage() {
  const projectsState = useProjects();
  const metadataState = useDesktopMetadata();

  const activeProjectCount =
    projectsState.status === 'success' ? String(projectsState.data.length) : '...';

  const versionCount =
    projectsState.status === 'success'
      ? String(
          projectsState.data.reduce((total, project) => {
            return total + project.versionCount;
          }, 0),
        )
      : '...';

  return (
    <div className="dashboard-page">
      <section className="hero-card">
        <div className="hero-card__copy">
          <p className="hero-card__eyebrow">Producer Collaboration Workspace</p>
          <h3>StemBridge Desktop App</h3>
          <p>
            Manage version history, share stems and mixdowns, capture timestamped notes, and
            prepare version downloads from one desktop-first workspace.
          </p>
        </div>

        <div className="hero-card__details">
          <span className="hero-card__detail">Ableton + FL Studio ready</span>
          <span className="hero-card__detail">Secure renderer isolation</span>
          <span className="hero-card__detail">Modular React architecture</span>
        </div>
      </section>

      <div className="stats-grid">
        <StatCard
          label="Active Projects"
          value={activeProjectCount}
          detail="Current collaboration workspaces"
          tone="teal"
        />
        <StatCard
          label="Tracked Versions"
          value={versionCount}
          detail="Mixes, stems, and revision checkpoints"
          tone="amber"
        />
        <StatCard
          label="Download Bundles"
          value="ZIP Ready"
          detail="Prepared for version file packaging"
          tone="slate"
        />
      </div>

      <div className="content-grid">
        <SectionCard
          title="Recent Projects"
          subtitle="Backed by a thin feature service with loading, error, and empty handling."
          action={<span className="tag">Mock API Enabled</span>}
        >
          {renderProjects(projectsState)}
        </SectionCard>

        <SectionCard
          title="Waveform Preview"
          subtitle="Version playback shell powered by wavesurfer.js."
        >
          <WaveformPlayer />
        </SectionCard>
      </div>

      <div className="content-grid content-grid--triple">
        <SectionCard
          title="Timestamped Comments"
          subtitle="Future review threads will align to version timecodes."
        >
          <EmptyState
            title="No comment threads yet"
            description="When versions are wired in, collaborators will leave playback-linked feedback here."
          />
        </SectionCard>

        <SectionCard
          title="File Delivery Queue"
          subtitle="Version bundles, stems, MIDI, and sample exports."
        >
          <EmptyState
            title="No files queued"
            description="Upload and export flows can plug into this panel without changing the layout shell."
          />
        </SectionCard>

        <SectionCard
          title="Desktop Runtime"
          subtitle="Secure preload bridge metadata from the Electron main process."
        >
          {renderDesktopMetadata(metadataState)}
        </SectionCard>
      </div>
    </div>
  );
}
