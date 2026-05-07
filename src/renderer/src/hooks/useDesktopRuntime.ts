import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DesktopQueueItem } from '@shared/types';
import { isDesktopBridgeAvailable } from '@/lib/desktop';
import { syncDesktopQueueOnce } from '@/lib/desktop-sync';

export interface DesktopRuntimeState {
  isDesktop: boolean;
  isOnline: boolean;
  queueItems: DesktopQueueItem[];
  isSyncing: boolean;
  retryQueue: () => Promise<void>;
}

export function useDesktopRuntime(): DesktopRuntimeState {
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator === 'undefined' ? true : navigator.onLine;
  });
  const [queueItems, setQueueItems] = useState<DesktopQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const isDesktop = isDesktopBridgeAvailable();

  const refreshQueue = useCallback(async (): Promise<void> => {
    if (!isDesktopBridgeAvailable()) {
      setQueueItems([]);
      return;
    }

    setQueueItems(await window.stemBridge.queue.list());
  }, []);

  const syncQueue = useCallback(async (): Promise<void> => {
    if (!isDesktopBridgeAvailable() || !navigator.onLine) {
      return;
    }

    setIsSyncing(true);

    try {
      await syncDesktopQueueOnce();
      await refreshQueue();
    } finally {
      setIsSyncing(false);
    }
  }, [refreshQueue]);

  const retryQueue = useCallback(async (): Promise<void> => {
    if (!isDesktopBridgeAvailable()) {
      return;
    }

    await window.stemBridge.queue.retryAll();
    await syncQueue();
  }, [syncQueue]);

  useEffect(() => {
    const handleOnline = (): void => {
      setIsOnline(true);
      void syncQueue();
    };
    const handleOffline = (): void => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    void refreshQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshQueue, syncQueue]);

  useEffect(() => {
    if (!isDesktopBridgeAvailable()) {
      return;
    }

    return window.stemBridge.queue.onChanged((items) => {
      setQueueItems(items);
    });
  }, []);

  useEffect(() => {
    if (isOnline) {
      void syncQueue();
    }
  }, [isOnline, syncQueue]);

  return useMemo(
    () => ({
      isDesktop,
      isOnline,
      queueItems,
      isSyncing,
      retryQueue,
    }),
    [isDesktop, isOnline, isSyncing, queueItems, retryQueue],
  );
}
