import type { StemBridgeDesktopApi } from '@shared/types';

declare global {
  interface Window {
    stemBridge: StemBridgeDesktopApi;
  }
}

export {};
