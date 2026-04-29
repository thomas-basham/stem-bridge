import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ProjectSummary } from '@shared/types';
import { Badge, Button, EmptyState, Input, LoadingSpinner, Modal } from '@/components/ui';
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

      resetForm();
      onClose();
      navigate(`/projects/${project.id}`);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Unable to create project.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="New Project"
      description="Create a workspace for versions, files, collaborators, and notes."
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="create-project-form" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Project'}
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
  const projectCount = projectsState.status === 'success' ? String(projects.length) : '...';
  const versionCount =
    projectsState.status === 'success'
      ? String(projects.reduce((total, project) => total + project.versionCount, 0))
      : '...';
  const collaboratorCount =
    projectsState.status === 'success'
      ? String(projects.reduce((total, project) => total + project.collaboratorCount, 0))
      : '...';

  return (
    <>
      <PageContainer
        eyebrow="Projects"
        title="Project Dashboard"
        description="Track your StemBridge workspaces, collaborators, tempo notes, keys, and version activity."
        actions={
          <Button type="button" onClick={() => setIsCreateModalOpen(true)}>
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
          {isLoading ? (
            <div className="loading-state">
              <LoadingSpinner label="Loading projects..." />
            </div>
          ) : null}

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
              description="Create a project to start collecting versions, files, and collaborator feedback."
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
