const projectActivityChangedEvent = 'stembridge:project-activity-changed';

type ProjectActivityChangedHandler = (projectId: string) => void;

export const notifyProjectActivityChanged = (projectId: string): void => {
  window.dispatchEvent(
    new CustomEvent(projectActivityChangedEvent, {
      detail: { projectId },
    }),
  );
};

export const subscribeToProjectActivityChanges = (
  handler: ProjectActivityChangedHandler,
): (() => void) => {
  const handleActivityChanged = (event: Event): void => {
    if (!(event instanceof CustomEvent)) {
      return;
    }

    const projectId = (event.detail as { projectId?: unknown } | undefined)?.projectId;

    if (typeof projectId === 'string') {
      handler(projectId);
    }
  };

  window.addEventListener(projectActivityChangedEvent, handleActivityChanged);

  return () => window.removeEventListener(projectActivityChangedEvent, handleActivityChanged);
};
