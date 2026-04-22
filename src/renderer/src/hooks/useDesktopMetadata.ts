import { useEffect, useState } from 'react';
import type { DesktopMetadata } from '@shared/types';

export type DesktopMetadataState =
  | {
      status: 'loading';
      data: null;
      errorMessage: null;
    }
  | {
      status: 'success';
      data: DesktopMetadata;
      errorMessage: null;
    }
  | {
      status: 'error';
      data: null;
      errorMessage: string;
    };

export function useDesktopMetadata(): DesktopMetadataState {
  const [state, setState] = useState<DesktopMetadataState>({
    status: 'loading',
    data: null,
    errorMessage: null,
  });

  useEffect(() => {
    let isMounted = true;

    const loadMetadata = async (): Promise<void> => {
      try {
        const metadata = await window.stemBridge.app.getMetadata();

        if (isMounted) {
          setState({
            status: 'success',
            data: metadata,
            errorMessage: null,
          });
        }
      } catch (error: unknown) {
        if (isMounted) {
          setState({
            status: 'error',
            data: null,
            errorMessage:
              error instanceof Error ? error.message : 'Unable to reach preload bridge.',
          });
        }
      }
    };

    void loadMetadata();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
