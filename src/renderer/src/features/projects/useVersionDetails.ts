import { useEffect, useState } from 'react';
import { versionsService } from '@/features/projects/versionsService';
import type { SongVersion } from '@/types/api';

type VersionDetailsState =
  | {
      status: 'idle';
      data: null;
      errorMessage: null;
    }
  | {
      status: 'loading';
      data: null;
      errorMessage: null;
    }
  | {
      status: 'success';
      data: SongVersion;
      errorMessage: null;
    }
  | {
      status: 'error';
      data: null;
      errorMessage: string;
    };

export function useVersionDetails(versionId: string | null): VersionDetailsState {
  const [state, setState] = useState<VersionDetailsState>({
    status: 'idle',
    data: null,
    errorMessage: null,
  });

  useEffect(() => {
    let isMounted = true;

    if (!versionId) {
      setState({ status: 'idle', data: null, errorMessage: null });
      return;
    }

    const loadVersion = async (): Promise<void> => {
      setState({ status: 'loading', data: null, errorMessage: null });

      try {
        const version = await versionsService.getById(versionId);

        if (isMounted) {
          setState({ status: 'success', data: version, errorMessage: null });
        }
      } catch (error: unknown) {
        if (isMounted) {
          setState({
            status: 'error',
            data: null,
            errorMessage: error instanceof Error ? error.message : 'Unable to load version.',
          });
        }
      }
    };

    void loadVersion();

    return () => {
      isMounted = false;
    };
  }, [versionId]);

  return state;
}
