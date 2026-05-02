import { useMemo } from 'react';
import { Button, EmptyState, LoadingSpinner } from '@/components/ui';
import { getActivityEventText } from '@/features/projects/activityFeedText';
import { useProjectActivity } from '@/features/projects/useProjectActivity';
import type { ActivityEvent } from '@/types/api';

interface ActivityFeedProps {
  projectId: string;
}

const sortActivityNewestFirst = (events: ActivityEvent[]): ActivityEvent[] => {
  return [...events].sort((left, right) => {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
};

const formatActivityTimestamp = (isoDate: string): string => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return 'Timestamp unavailable';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

export function ActivityFeed({ projectId }: ActivityFeedProps) {
  const activityState = useProjectActivity(projectId, 1, 20);
  const events = useMemo(() => {
    return sortActivityNewestFirst(activityState.data);
  }, [activityState.data]);

  return (
    <section className="activity-feed">
      <header className="activity-feed__header">
        <div>
          <h4>Activity</h4>
          <p>Latest project events</p>
        </div>
      </header>

      {activityState.status === 'loading' ? (
        <div className="activity-feed__loading">
          <LoadingSpinner label="Loading activity..." size="sm" />
        </div>
      ) : null}

      {activityState.status === 'error' ? (
        <EmptyState
          tone="error"
          title="Activity unavailable"
          description={activityState.errorMessage}
          action={
            <Button type="button" variant="secondary" size="sm" onClick={() => void activityState.refresh()}>
              Retry
            </Button>
          }
        />
      ) : null}

      {activityState.status === 'success' && events.length === 0 ? (
        <EmptyState title="No activity yet" description="Project events will appear here as work happens." />
      ) : null}

      {activityState.status === 'success' && events.length > 0 ? (
        <ol className="activity-feed__list">
          {events.map((event) => (
            <li key={event.id} className="activity-feed__item">
              <span className="activity-feed__marker" aria-hidden="true" />
              <div>
                <strong>{getActivityEventText(event)}</strong>
                <span>{formatActivityTimestamp(event.createdAt)}</span>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
