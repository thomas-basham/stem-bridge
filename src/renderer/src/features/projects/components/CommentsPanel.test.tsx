import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { commentsApi } from '@/lib/api';
import { renderWithAppProviders } from '@/test/render';
import { CommentsPanel } from './CommentsPanel';
import type { VersionComment } from '@/types/api';

vi.mock('@/lib/api', () => ({
  commentsApi: {
    list: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
  },
  getApiErrorMessage: (error: unknown, fallback = 'Request failed.') =>
    error instanceof Error ? error.message : fallback,
  getBlobApiErrorMessage: async (error: unknown, fallback = 'Request failed.') =>
    error instanceof Error ? error.message : fallback,
}));

const createdComment: VersionComment = {
  id: 'comment-1',
  versionId: 'version-1',
  text: 'Needs brighter hats',
  timestampSeconds: 42.25,
  createdAt: '2026-05-02T17:30:00.000Z',
  author: {
    id: 'user-1',
    email: 'producer@stembridge.app',
    name: 'Producer',
  },
};

describe('CommentsPanel', () => {
  it('adds a timestamped comment at the current playback position', async () => {
    vi.mocked(commentsApi.list)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([createdComment]);
    vi.mocked(commentsApi.create).mockResolvedValue(createdComment);

    const user = userEvent.setup();
    renderWithAppProviders(
      <CommentsPanel
        versionId="version-1"
        currentTimeSeconds={42.25}
        onSeekComment={vi.fn()}
      />,
    );

    expect(await screen.findByText(/no timestamp comments/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/add comment at/i), createdComment.text);
    await user.click(screen.getByRole('button', { name: /post comment/i }));

    expect(commentsApi.create).toHaveBeenCalledWith('version-1', {
      text: createdComment.text,
      timestampSeconds: createdComment.timestampSeconds,
    });
    expect(await screen.findByText(createdComment.text)).toBeInTheDocument();
  });
});
