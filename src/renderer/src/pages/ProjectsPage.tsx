import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ProjectSummary } from '@shared/types';
import { Badge, Button, EmptyState, Input, Modal, Skeleton, useToast } from '@/components/ui';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatCard } from '@/components/ui/StatCard';
import { getApiErrorMessage } from '@/lib/api';
import { useProjects } from '@/features/projects/useProjects';

const formatDate = (isoDate: string | undefined): string => {
  if (!isoDate) {
    return 'Not available';
  }

  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const getLatestVersionNumber = (project: ProjectSummary): number | null => {
  if (project.latestVersion?.versionNumber) {
    return project.latestVersion.versionNumber;
  }

  return project.versionCount > 0 ? project.versionCount : null;
};

const renderProjectValue = (value: string | number | null | undefined): string => {
  return value === null || value === undefined || value === '' ? 'Not set' : String(value);
};

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreateProject: ReturnType<typeof useProjects>['createProject'];
}

function CreateProjectModal({ open, onClose, onCreateProject }: CreateProjectModalProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState('');
  const [bpm, setBpm] = useState('');
  const [musicalKey, setMusicalKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = (): void => {
    setName('');
    setBpm('');
    setMusicalKey('');
    setErrorMessage(null);
  };

  const handleClose = (): void => {
    if (isSubmitting) {
      return;
    }

    resetForm();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const project = await onCreateProject({
        name,
        bpm: bpm ? Number(bpm) : undefined,
        musicalKey: musicalKey.trim() || undefined,
      });

      toast.success('Project created', `${project.name} is ready for versions and files.`);
      resetForm();
      onClose();
      navigate(`/projects/${project.id}`);
    } catch (error) {
      const message = getApiErrorMessage(error, 'Unable to create project.');
      setErrorMessage(message);
      toast.error('Project creation failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="New Project"
      description="Create a workspace for versions, files, collaborators, and notes."
      closeDisabled={isSubmitting}
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-project-form"
            isLoading={isSubmitting}
            loadingLabel="Creating..."
          >
            Create Project
          </Button>
        </>
      }
    >
      <form id="create-project-form" className="modal-form" onSubmit={handleSubmit}>
        <Input
          label="Project Name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Late Night Mix"
          disabled={isSubmitting}
          required
        />

        <div className="modal-form__grid">
          <Input
            label="BPM"
            name="bpm"
            type="number"
            min={1}
            max={400}
            value={bpm}
            onChange={(event) => setBpm(event.target.value)}
            placeholder="120"
            disabled={isSubmitting}
          />
          <Input
            label="Musical Key"
            name="musicalKey"
            value={musicalKey}
            onChange={(event) => setMusicalKey(event.target.value)}
            placeholder="C minor"
            disabled={isSubmitting}
          />
        </div>

        {errorMessage ? (
          <p className="auth-form__error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

function ProjectGridSkeleton() {
  return (
    <div className="project-grid" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="project-card project-card--skeleton">
          <div className="project-card__header">
            <div>
              <Skeleton width={180} height={20} />
              <Skeleton width={130} height={14} />
            </div>
            <Skeleton width={72} height={32} />
          </div>

          <div className="project-card__meta">
            <span>
              <Skeleton width={44} height={18} />
              BPM
            </span>
            <span>
              <Skeleton width={70} height={18} />
              Key
            </span>
            <span>
              <Skeleton width={34} height={18} />
              Collaborators
            </span>
          </div>

          <div className="project-card__footer">
            <Skeleton width={150} height={14} />
            <Skeleton width={94} height={14} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectGrid({ projects }: { projects: ProjectSummary[] }) {
  return (
    <div className="project-grid">
      {projects.map((project) => {
        const latestVersionNumber = getLatestVersionNumber(project);

        return (
          <Link key={project.id} to={`/projects/${project.id}`} className="project-card">
            <div className="project-card__header">
              <div>
                <h4>{project.name}</h4>
                <p>Updated {formatDate(project.updatedAt ?? project.createdAt)}</p>
              </div>
              <Badge tone={latestVersionNumber ? 'teal' : 'amber'}>
                {latestVersionNumber ? `v${latestVersionNumber}` : 'No versions'}
              </Badge>
            </div>

            <div className="project-card__meta">
              <span>
                <strong>{renderProjectValue(project.bpm)}</strong>
                BPM
              </span>
              <span>
                <strong>{renderProjectValue(project.musicalKey)}</strong>
                Key
              </span>
              <span>
                <strong>{project.collaboratorCount}</strong>
                Collaborators
              </span>
            </div>

            <div className="project-card__footer">
              <span>Created {formatDate(project.createdAt)}</span>
              <strong>Open Project</strong>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function ProjectsPage() {
  const projectsState = useProjects();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const projects = projectsState.data;
  const isLoading = projectsState.status === 'loading';
  const loadingValue = <Skeleton className="stat-card__skeleton" width={58} height={34} />;
  const projectCount = projectsState.status === 'success' ? String(projects.length) : loadingValue;
  const versionCount =
    projectsState.status === 'success'
      ? String(projects.reduce((total, project) => total + project.versionCount, 0))
      : loadingValue;
  const collaboratorCount =
    projectsState.status === 'success'
      ? String(projects.reduce((total, project) => total + project.collaboratorCount, 0))
      : loadingValue;

  return (
    <>
      <PageContainer
        eyebrow="Projects"
        title="Project Dashboard"
        description="Track your StemBridge workspaces, collaborators, tempo notes, keys, and version activity."
        actions={
          <Button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            disabled={projectsState.status === 'loading'}
          >
            New Project
          </Button>
        }
      >
        <div className="stats-grid">
          <StatCard label="Projects" value={projectCount} detail="Active workspaces" tone="teal" />
          <StatCard label="Versions" value={versionCount} detail="Latest saved revisions" tone="amber" />
          <StatCard
            label="Collaborators"
            value={collaboratorCount}
            detail="Project memberships"
            tone="slate"
          />
        </div>

        <SectionCard
          title="Your Projects"
          subtitle="Open a project to manage versions, files, feedback, and collaborators."
          action={<Badge tone="violet">GET /projects</Badge>}
        >
          {isLoading ? <ProjectGridSkeleton /> : null}

          {projectsState.status === 'error' ? (
            <EmptyState
              tone="error"
              title="Projects unavailable"
              description={projectsState.errorMessage}
              action={
                <Button type="button" variant="secondary" onClick={() => void projectsState.refresh()}>
                  Retry
                </Button>
              }
            />
          ) : null}

          {projectsState.status === 'success' && projects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              description="Create a project, then upload a first version to collect mixes, stems, MIDI, samples, and timeline feedback in one workspace."
              action={
                <Button type="button" onClick={() => setIsCreateModalOpen(true)}>
                  New Project
                </Button>
              }
            />
          ) : null}

          {projectsState.status === 'success' && projects.length > 0 ? (
            <ProjectGrid projects={projects} />
          ) : null}
        </SectionCard>
      </PageContainer>

      <CreateProjectModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateProject={projectsState.createProject}
      />
    </>
  );
}
