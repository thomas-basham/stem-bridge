import { describe, expect, it } from 'vitest';
import { API_ENDPOINTS, APP_ROUTES } from '@/constants/app-constants';

describe('app constants', () => {
  it('encodes dynamic route path segments', () => {
    expect(APP_ROUTES.projectDetail('project/with space')).toBe(
      '/projects/project%2Fwith%20space',
    );
  });

  it('encodes dynamic API path segments', () => {
    expect(API_ENDPOINTS.versions.fileDownload('version/1', 'file name.wav')).toBe(
      '/versions/version%2F1/files/file%20name.wav/download',
    );
  });
});
