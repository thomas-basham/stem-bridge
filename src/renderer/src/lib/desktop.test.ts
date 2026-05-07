import { describe, expect, it, vi } from 'vitest';
import { isLikelyNetworkError, readDesktopSnapshot, saveDesktopSnapshot } from './desktop';

describe('desktop cache helpers', () => {
  it('treats request errors without responses as network failures', () => {
    expect(isLikelyNetworkError({ request: {}, message: 'Network Error' })).toBe(true);
    expect(isLikelyNetworkError({ response: { status: 500 }, message: 'Server error' })).toBe(false);
  });

  it('serializes project snapshots through the desktop bridge', async () => {
    const snapshot = {
      key: 'projects:list',
      data: [{ id: 'project-1', name: 'Project One' }],
      savedAt: '2026-05-06T00:00:00.000Z',
    };

    Object.defineProperty(window, 'stemBridge', {
      configurable: true,
      value: {
        cache: {
          saveProjectSnapshot: vi.fn().mockResolvedValue(snapshot),
          getProjectSnapshot: vi.fn().mockResolvedValue(snapshot),
        },
      },
    });

    await saveDesktopSnapshot(snapshot.key, snapshot.data);
    await expect(readDesktopSnapshot(snapshot.key)).resolves.toEqual(snapshot);
    expect(window.stemBridge.cache.saveProjectSnapshot).toHaveBeenCalledWith({
      key: snapshot.key,
      data: snapshot.data,
    });
  });
});
