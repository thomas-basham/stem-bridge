import { mkdir, mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { dialog } from 'electron';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DesktopStore } from './desktop-store';
import type { DesktopDawFileCandidate } from '@shared/types';

vi.mock('electron', () => ({
  BrowserWindow: {
    getAllWindows: () => [],
  },
  dialog: {
    showOpenDialog: vi.fn(),
  },
  net: {
    isOnline: () => true,
  },
}));

const createCandidate = (patch: Partial<DesktopDawFileCandidate> = {}): DesktopDawFileCandidate => ({
  id: 'candidate-1',
  folderId: 'folder-1',
  path: '',
  name: 'Bass.mid',
  type: 'MIDI',
  mimeType: 'audio/midi',
  sizeBytes: 12,
  modifiedAt: '2026-05-06T00:00:00.000Z',
  imported: false,
  discoveredAt: '2026-05-06T00:00:00.000Z',
  ...patch,
});

const mockChooseDirectory = (directoryPath: string): void => {
  vi.mocked(dialog.showOpenDialog).mockResolvedValue({
    canceled: false,
    filePaths: [directoryPath],
  });
};

const expectDirectory = async (directoryPath: string): Promise<void> => {
  const directoryStats = await stat(directoryPath);
  expect(directoryStats.isDirectory()).toBe(true);
};

describe('DesktopStore DAW candidate imports', () => {
  let tempDirectory: string;

  beforeEach(async () => {
    tempDirectory = await mkdtemp(join(tmpdir(), 'stembridge-desktop-store-'));
    vi.mocked(dialog.showOpenDialog).mockReset();
  });

  afterEach(async () => {
    await rm(tempDirectory, { recursive: true, force: true });
  });

  it('caches a DAW candidate without marking it imported', async () => {
    const sourcePath = join(tempDirectory, 'Bass.mid');
    await writeFile(sourcePath, 'midi-content');
    const store = new DesktopStore(join(tempDirectory, 'user-data'));
    const testStore = store as unknown as {
      isLoaded: boolean;
      state: {
        snapshots: Record<string, unknown>;
        queue: unknown[];
        watchedFolders: unknown[];
        dawCandidates: DesktopDawFileCandidate[];
        cachedFiles: Record<string, unknown>;
      };
    };
    testStore.isLoaded = true;
    testStore.state = {
      snapshots: {},
      queue: [],
      watchedFolders: [],
      dawCandidates: [createCandidate({ path: sourcePath })],
      cachedFiles: {},
    };

    const cachedFile = await store.cacheDawCandidate('candidate-1');

    expect(cachedFile.fileName).toBe('Bass.mid');
    expect(testStore.state.cachedFiles[cachedFile.id]).toEqual(cachedFile);
    expect(testStore.state.dawCandidates[0].imported).toBe(false);
  });

  it('marks only supplied DAW candidates imported', async () => {
    const store = new DesktopStore(join(tempDirectory, 'user-data'));
    const testStore = store as unknown as {
      isLoaded: boolean;
      state: {
        snapshots: Record<string, unknown>;
        queue: unknown[];
        watchedFolders: unknown[];
        dawCandidates: DesktopDawFileCandidate[];
        cachedFiles: Record<string, unknown>;
      };
    };
    testStore.isLoaded = true;
    testStore.state = {
      snapshots: {},
      queue: [],
      watchedFolders: [],
      dawCandidates: [
        createCandidate({ id: 'candidate-1' }),
        createCandidate({ id: 'candidate-2', name: 'Lead.wav', type: 'STEM' }),
      ],
      cachedFiles: {},
    };

    const candidates = await store.markDawCandidatesImported(['candidate-2']);

    expect(candidates.find((candidate) => candidate.id === 'candidate-1')?.imported).toBe(false);
    expect(candidates.find((candidate) => candidate.id === 'candidate-2')?.imported).toBe(true);
  });
});

describe('DesktopStore Ableton watch folders', () => {
  let tempDirectory: string;

  beforeEach(async () => {
    tempDirectory = await mkdtemp(join(tmpdir(), 'stembridge-watch-folders-'));
    vi.mocked(dialog.showOpenDialog).mockReset();
  });

  afterEach(async () => {
    await rm(tempDirectory, { recursive: true, force: true });
  });

  it('creates stems and mix folders when adding a new Ableton watch folder', async () => {
    const projectPath = join(tempDirectory, 'Ableton Project');
    await mkdir(projectPath);
    mockChooseDirectory(projectPath);
    const store = new DesktopStore(join(tempDirectory, 'user-data'));

    const folder = await store.chooseWatchFolder();

    expect(folder?.path).toBe(projectPath);
    await expectDirectory(join(projectPath, 'stems'));
    await expectDirectory(join(projectPath, 'mix'));
  });

  it('accepts existing stems and mix folders when adding a watch folder', async () => {
    const projectPath = join(tempDirectory, 'Ableton Project');
    await mkdir(join(projectPath, 'stems'), { recursive: true });
    await mkdir(join(projectPath, 'mix'), { recursive: true });
    mockChooseDirectory(projectPath);
    const store = new DesktopStore(join(tempDirectory, 'user-data'));

    const folder = await store.chooseWatchFolder();

    expect(folder?.path).toBe(projectPath);
    await expectDirectory(join(projectPath, 'stems'));
    await expectDirectory(join(projectPath, 'mix'));
  });

  it('recreates missing export folders when reselecting an existing watch folder', async () => {
    const projectPath = join(tempDirectory, 'Ableton Project');
    await mkdir(projectPath);
    mockChooseDirectory(projectPath);
    const store = new DesktopStore(join(tempDirectory, 'user-data'));

    const folder = await store.chooseWatchFolder();
    await rm(join(projectPath, 'mix'), { recursive: true, force: true });
    const existingFolder = await store.chooseWatchFolder();

    expect(existingFolder?.id).toBe(folder?.id);
    await expectDirectory(join(projectPath, 'stems'));
    await expectDirectory(join(projectPath, 'mix'));
  });
});
