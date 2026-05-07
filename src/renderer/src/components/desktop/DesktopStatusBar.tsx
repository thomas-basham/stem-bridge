import { Badge, Button } from '@/components/ui';
import type { DesktopRuntimeState } from '@/hooks/useDesktopRuntime';

interface DesktopStatusBarProps {
  runtime: DesktopRuntimeState;
}

export function DesktopStatusBar({ runtime }: DesktopStatusBarProps) {
  const activeQueueItems = runtime.queueItems.filter((item) => item.status !== 'complete');
  const failedQueueItems = runtime.queueItems.filter((item) => item.status === 'failed');
  const syncingQueueItems = runtime.queueItems.filter((item) => item.status === 'syncing');

  return (
    <div className={runtime.isOnline ? 'desktop-status-bar' : 'desktop-status-bar desktop-status-bar--offline'}>
      <div className="desktop-status-bar__main">
        <Badge tone={runtime.isOnline ? 'teal' : 'amber'}>
          {runtime.isOnline ? 'Online' : 'Offline'}
        </Badge>
        <span>
          {runtime.isOnline
            ? 'Desktop sync is available.'
            : 'Using cached workspace data. New comments and uploads will queue locally.'}
        </span>
      </div>

      <div className="desktop-status-bar__queue">
        <span>{activeQueueItems.length} queued</span>
        {syncingQueueItems.length > 0 ? <span>{syncingQueueItems.length} syncing</span> : null}
        {failedQueueItems.length > 0 ? <span>{failedQueueItems.length} failed</span> : null}
        {failedQueueItems.length > 0 ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void runtime.retryQueue()}
            isLoading={runtime.isSyncing}
            loadingLabel="Retrying..."
          >
            Retry Sync
          </Button>
        ) : null}
      </div>
    </div>
  );
}
