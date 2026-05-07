import { BrowserWindow, dialog, net } from 'electron';
import { createHash, randomUUID } from 'node:crypto';
import { watch, type FSWatcher } from 'node:fs';
import { copyFile, mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import type {
  DesktopCachedFileData,
  DesktopCachedUploadFile,
  DesktopDawFileCandidate,
  DesktopNetworkState,
  DesktopProjectSnapshot,
  DesktopQueueItem,
  DesktopQueueItemStatus,
  DesktopQueueItemType,
  DesktopWatchedFolder,
} from '@shared/types';
import { desktopChannels } from '@shared/types';
import { inferDawFileType, shouldScanAbletonProjectDirectory } from '@shared/daw';
import { getMidiClipFileName, parseAbletonMidiClips, writeMidiClip } from '@shared/ableton-midi';

interface DesktopState {
  snapshots: Record<string, DesktopProjectSnapshot>;
  queue: DesktopQueueItem[];
  watchedFolders: DesktopWatchedFolder[];
  dawCandidates: DesktopDawFileCandidate[];
  cachedFiles: Record<string, DesktopCachedUploadFile>;
}

const initialState = (): DesktopState => ({
  snapshots: {},
  queue: [],
  watchedFolders: [],
  dawCandidates: [],
  cachedFiles: {},
});

const audioAndMidiExtensions = new Set([
  '.wav',
  '.aif',
  '.aiff',
  '.mp3',
  '.m4a',
  '.flac',
  '.mid',
  '.midi',
]);

const abletonSetExtension = '.als';

const abletonExportDirectories = ['stems', 'mix'] as const;

const extensionMimeTypes: Record<string, string> = {
  '.wav': 'audio/wav',
  '.aif': 'audio/aiff',
  '.aiff': 'audio/aiff',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.flac': 'audio/flac',
  '.mid': 'audio/midi',
  '.midi': 'audio/midi',
};

const maxWatchScanDepth = 4;

const getTimestamp = (): string => new Date().toISOString();

const hashValue = (value: string): string => createHash('sha256').update(value).digest('hex');

const sanitizeFileName = (fileName: string): string => {
  const sanitized = fileName
    .split('')
    .filter((character) => {
      const charCode = character.charCodeAt(0);
      return charCode > 31 && charCode !== 127;
    })
    .join('')
    .replace(/[<>:"/\\|?*]/g, '-')
    .trim()
    .slice(0, 160);

  return sanitized || 'upload';
};

const getMimeType = (filePath: string, fallback = 'application/octet-stream'): string => {
  return extensionMimeTypes[extname(filePath).toLowerCase()] ?? fallback;
};

const broadcast = <T>(channel: string, payload: T): void => {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send(channel, payload);
  });
};

export class DesktopStore {
  private state: DesktopState = initialState();

  private isLoaded = false;

  private saveChain = Promise.resolve();

  private readonly watchers = new Map<string, FSWatcher>();

  constructor(private readonly userDataPath: string) {}

  async getNetworkStatus(): Promise<DesktopNetworkState> {
    return {
      status: net.isOnline() ? 'online' : 'offline',
      checkedAt: getTimestamp(),
    };
  }

  async getProjectSnapshot<T = unknown>(key: string): Promise<DesktopProjectSnapshot<T> | null> {
    await this.load();
    return (this.state.snapshots[key] as DesktopProjectSnapshot<T> | undefined) ?? null;
  }

  async saveProjectSnapshot<T = unknown>(snapshot: {
    key: string;
    data: T;
  }): Promise<DesktopProjectSnapshot<T>> {
    await this.load();

    const savedSnapshot: DesktopProjectSnapshot<T> = {
      key: snapshot.key,
      data: snapshot.data,
      savedAt: getTimestamp(),
    };

    this.state.snapshots[snapshot.key] = savedSnapshot as DesktopProjectSnapshot;
    await this.save();
    return savedSnapshot;
  }

  async importUploadFile(sourcePath: string, fileName?: string): Promise<DesktopCachedUploadFile> {
    await this.load();
    const sourceStats = await stat(sourcePath);

    if (!sourceStats.isFile()) {
      throw new Error('Selected upload is not a file.');
    }

    const cachedFile = await this.copyFileIntoCache(sourcePath, {
      fileName: fileName || basename(sourcePath),
      mimeType: getMimeType(sourcePath),
      sizeBytes: sourceStats.size,
    });

    this.state.cachedFiles[cachedFile.id] = cachedFile;
    await this.save();
    return cachedFile;
  }

  async readCachedFile(cachedFileId: string): Promise<DesktopCachedFileData> {
    await this.load();
    const cachedFile = this.state.cachedFiles[cachedFileId];

    if (!cachedFile) {
      throw new Error('Cached file is unavailable.');
    }

    const data = await readFile(cachedFile.cachePath);
    return {
      ...cachedFile,
      data: new Uint8Array(data),
    };
  }

  async listQueue(): Promise<DesktopQueueItem[]> {
    await this.load();
    return [...this.state.queue];
  }

  async enqueueQueueItem<TPayload>(item: {
    type: DesktopQueueItemType;
    payload: TPayload;
  }): Promise<DesktopQueueItem<TPayload>> {
    await this.load();
    const timestamp = getTimestamp();
    const queueItem: DesktopQueueItem<TPayload> = {
      id: randomUUID(),
      type: item.type,
      status: 'pending',
      payload: item.payload,
      attempts: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.state.queue.push(queueItem as DesktopQueueItem);
    await this.save();
    this.broadcastQueue();
    return queueItem;
  }

  async updateQueueItem<TPayload>(
    itemId: string,
    patch: Partial<Pick<DesktopQueueItem<TPayload>, 'status' | 'payload' | 'errorMessage'>>,
  ): Promise<DesktopQueueItem<TPayload>> {
    await this.load();
    const queueItem = this.state.queue.find((candidate) => candidate.id === itemId);

    if (!queueItem) {
      throw new Error('Queue item was not found.');
    }

    if (patch.status) {
      queueItem.status = patch.status as DesktopQueueItemStatus;
      if (patch.status === 'syncing') {
        queueItem.attempts += 1;
      }
    }

    if ('payload' in patch) {
      queueItem.payload = patch.payload;
    }

    if ('errorMessage' in patch) {
      queueItem.errorMessage = patch.errorMessage;
    }

    queueItem.updatedAt = getTimestamp();
    await this.save();
    this.broadcastQueue();
    return queueItem as DesktopQueueItem<TPayload>;
  }

  async retryQueue(): Promise<DesktopQueueItem[]> {
    await this.load();
    const timestamp = getTimestamp();

    this.state.queue = this.state.queue.map((item) => {
      if (item.status !== 'failed') {
        return item;
      }

      return {
        ...item,
        status: 'pending',
        errorMessage: undefined,
        updatedAt: timestamp,
      };
    });

    await this.save();
    this.broadcastQueue();
    return [...this.state.queue];
  }

  async chooseWatchFolder(): Promise<DesktopWatchedFolder | null> {
    await this.load();
    const result = await dialog.showOpenDialog({
      title: 'Choose Ableton export folder',
      properties: ['openDirectory'],
    });

    if (result.canceled || !result.filePaths[0]) {
      return null;
    }

    const folderPath = result.filePaths[0];
    const existingFolder = this.state.watchedFolders.find((folder) => folder.path === folderPath);

    if (existingFolder) {
      await this.ensureAbletonExportDirectories(existingFolder.path);
      await this.scanFolder(existingFolder.id);
      return existingFolder;
    }

    await this.ensureAbletonExportDirectories(folderPath);

    const timestamp = getTimestamp();
    const folder: DesktopWatchedFolder = {
      id: randomUUID(),
      label: basename(folderPath) || 'Ableton Export Folder',
      path: folderPath,
      dawType: 'ABLETON',
      enabled: true,
      createdAt: timestamp,
      lastScanAt: timestamp,
    };

    this.state.watchedFolders.push(folder);
    await this.save();
    this.startWatcher(folder);
    await this.scanFolder(folder.id);
    return folder;
  }

  async listWatchFolders(): Promise<DesktopWatchedFolder[]> {
    await this.load();
    this.ensureWatchers();
    return [...this.state.watchedFolders];
  }

  async removeWatchFolder(folderId: string): Promise<DesktopWatchedFolder[]> {
    await this.load();
    this.stopWatcher(folderId);
    this.state.watchedFolders = this.state.watchedFolders.filter((folder) => folder.id !== folderId);
    this.state.dawCandidates = this.state.dawCandidates.filter(
      (candidate) => candidate.folderId !== folderId,
    );
    await this.save();
    this.broadcastDawCandidates();
    return [...this.state.watchedFolders];
  }

  async listDawCandidates(): Promise<DesktopDawFileCandidate[]> {
    await this.load();
    await Promise.all(this.state.watchedFolders.map((folder) => this.scanFolder(folder.id)));
    return [...this.state.dawCandidates].sort((left, right) => {
      return new Date(right.modifiedAt).getTime() - new Date(left.modifiedAt).getTime();
    });
  }

  async importDawCandidate(candidateId: string): Promise<DesktopCachedUploadFile> {
    await this.load();
    const cachedFile = await this.cacheDawCandidate(candidateId);
    await this.markDawCandidatesImported([candidateId]);
    return cachedFile;
  }

  async cacheDawCandidate(candidateId: string): Promise<DesktopCachedUploadFile> {
    await this.load();
    const candidate = this.getDawCandidate(candidateId);
    const cachedFile = await this.copyDawCandidateIntoCache(candidate);
    this.state.cachedFiles[cachedFile.id] = cachedFile;
    await this.save();
    return cachedFile;
  }

  async markDawCandidatesImported(candidateIds: string[]): Promise<DesktopDawFileCandidate[]> {
    await this.load();
    const candidateIdSet = new Set(candidateIds);

    this.state.dawCandidates = this.state.dawCandidates.map((candidate) => {
      if (!candidateIdSet.has(candidate.id)) {
        return candidate;
      }

      return {
        ...candidate,
        imported: true,
      };
    });

    await this.save();
    this.broadcastDawCandidates();
    return [...this.state.dawCandidates];
  }

  async initialize(): Promise<void> {
    await this.load();
    this.ensureWatchers();
  }

  private get statePath(): string {
    return join(this.userDataPath, 'desktop-state.json');
  }

  private get cacheDirectory(): string {
    return join(this.userDataPath, 'upload-cache');
  }

  private get generatedMidiDirectory(): string {
    return join(this.userDataPath, 'generated-midi');
  }

  private async ensureAbletonExportDirectories(folderPath: string): Promise<void> {
    await Promise.all(
      abletonExportDirectories.map((directoryName) => {
        return mkdir(join(folderPath, directoryName), { recursive: true });
      }),
    );
  }

  private async load(): Promise<void> {
    if (this.isLoaded) {
      return;
    }

    await mkdir(this.userDataPath, { recursive: true });
    await mkdir(this.cacheDirectory, { recursive: true });
    await mkdir(this.generatedMidiDirectory, { recursive: true });

    try {
      const rawState = await readFile(this.statePath, 'utf8');
      this.state = {
        ...initialState(),
        ...(JSON.parse(rawState) as Partial<DesktopState>),
      };
    } catch {
      this.state = initialState();
    }

    this.isLoaded = true;
  }

  private async save(): Promise<void> {
    this.saveChain = this.saveChain.then(async () => {
      await mkdir(this.userDataPath, { recursive: true });
      const tempStatePath = `${this.statePath}.tmp`;
      await writeFile(tempStatePath, JSON.stringify(this.state, null, 2), 'utf8');
      await rename(tempStatePath, this.statePath);
    });

    await this.saveChain;
  }

  private async copyFileIntoCache(
    sourcePath: string,
    metadata: Pick<DesktopCachedUploadFile, 'fileName' | 'mimeType' | 'sizeBytes'>,
  ): Promise<DesktopCachedUploadFile> {
    await mkdir(this.cacheDirectory, { recursive: true });
    const id = randomUUID();
    const fileName = sanitizeFileName(metadata.fileName);
    const cachePath = join(this.cacheDirectory, `${id}-${fileName}`);
    await copyFile(sourcePath, cachePath);

    return {
      id,
      fileName,
      mimeType: metadata.mimeType,
      sizeBytes: metadata.sizeBytes,
      cachePath,
      createdAt: getTimestamp(),
    };
  }

  private ensureWatchers(): void {
    this.state.watchedFolders.forEach((folder) => this.startWatcher(folder));
  }

  private startWatcher(folder: DesktopWatchedFolder): void {
    if (!folder.enabled || this.watchers.has(folder.id)) {
      return;
    }

    try {
      const watcher = watch(folder.path, { persistent: false }, () => {
        void this.scanFolder(folder.id);
      });
      this.watchers.set(folder.id, watcher);
    } catch {
      // The UI still shows the configured folder so the user can remove it.
    }
  }

  private stopWatcher(folderId: string): void {
    const watcher = this.watchers.get(folderId);

    if (watcher) {
      watcher.close();
      this.watchers.delete(folderId);
    }
  }

  private getDawCandidate(candidateId: string): DesktopDawFileCandidate {
    const candidate = this.state.dawCandidates.find((item) => item.id === candidateId);

    if (!candidate) {
      throw new Error('DAW export candidate was not found.');
    }

    return candidate;
  }

  private async copyDawCandidateIntoCache(
    candidate: DesktopDawFileCandidate,
  ): Promise<DesktopCachedUploadFile> {
    return this.copyFileIntoCache(candidate.path, {
      fileName: candidate.name,
      mimeType: candidate.mimeType,
      sizeBytes: candidate.sizeBytes,
    });
  }

  private async scanFolder(folderId: string): Promise<void> {
    const folder = this.state.watchedFolders.find((candidate) => candidate.id === folderId);

    if (!folder?.enabled) {
      return;
    }

    try {
      const discoveredFiles = await this.findDawFiles(folder.path);
      const generatedMidiFiles = await this.generateMidiFilesFromAbletonSets(folder.id, folder.path);
      const discoveredCandidates = [...discoveredFiles, ...generatedMidiFiles];
      const existingCandidates = new Map(
        this.state.dawCandidates.map((candidate) => [candidate.id, candidate]),
      );

      discoveredCandidates.forEach((file) => {
        const id = hashValue(`${folder.id}:${file.path}`);
        const existingCandidate = existingCandidates.get(id);
        const candidate: DesktopDawFileCandidate = {
          id,
          folderId: folder.id,
          path: file.path,
          name: file.name ?? basename(file.path),
          type: file.type ?? inferDawFileType(file.path),
          mimeType: file.mimeType ?? getMimeType(file.path),
          sizeBytes: file.sizeBytes,
          modifiedAt: file.modifiedAt,
          imported: existingCandidate?.imported ?? false,
          discoveredAt: existingCandidate?.discoveredAt ?? getTimestamp(),
        };

        existingCandidates.set(id, candidate);
      });

      const discoveredIds = new Set(
        discoveredCandidates.map((file) => hashValue(`${folder.id}:${file.path}`)),
      );
      this.state.dawCandidates = this.state.dawCandidates
        .filter((candidate) => candidate.folderId !== folder.id || discoveredIds.has(candidate.id))
        .map((candidate) => existingCandidates.get(candidate.id) ?? candidate);

      discoveredCandidates.forEach((file) => {
        const id = hashValue(`${folder.id}:${file.path}`);
        if (!this.state.dawCandidates.some((candidate) => candidate.id === id)) {
          const candidate = existingCandidates.get(id);
          if (candidate) {
            this.state.dawCandidates.push(candidate);
          }
        }
      });

      folder.lastScanAt = getTimestamp();
      await this.save();
      this.broadcastDawCandidates();
    } catch {
      // Watch scans are best effort; failed folders remain removable in the UI.
    }
  }

  private async findDawFiles(
    directoryPath: string,
    depth = 0,
  ): Promise<
    Array<{
      path: string;
      name?: string;
      type?: DesktopDawFileCandidate['type'];
      mimeType?: string;
      sizeBytes: number;
      modifiedAt: string;
    }>
  > {
    if (depth > maxWatchScanDepth) {
      return [];
    }

    const entries = await readdir(directoryPath, { withFileTypes: true });
    const files = await Promise.all(
      entries
        .filter((entry) => !entry.name.startsWith('.'))
        .map(async (entry) => {
          const entryPath = join(directoryPath, entry.name);

          if (entry.isDirectory()) {
            if (!shouldScanAbletonProjectDirectory(entry.name)) {
              return [];
            }

            return this.findDawFiles(entryPath, depth + 1);
          }

          if (!entry.isFile() || !audioAndMidiExtensions.has(extname(entry.name).toLowerCase())) {
            return [];
          }

          const entryStats = await stat(entryPath);
          return [
            {
              path: entryPath,
              sizeBytes: entryStats.size,
              modifiedAt: entryStats.mtime.toISOString(),
            },
          ];
        }),
    );

    return files.flat();
  }

  private async findAbletonSetFiles(directoryPath: string, depth = 0): Promise<string[]> {
    if (depth > maxWatchScanDepth) {
      return [];
    }

    const entries = await readdir(directoryPath, { withFileTypes: true });
    const files = await Promise.all(
      entries
        .filter((entry) => !entry.name.startsWith('.'))
        .map(async (entry) => {
          const entryPath = join(directoryPath, entry.name);

          if (entry.isDirectory()) {
            if (!shouldScanAbletonProjectDirectory(entry.name)) {
              return [];
            }

            return this.findAbletonSetFiles(entryPath, depth + 1);
          }

          if (!entry.isFile() || extname(entry.name).toLowerCase() !== abletonSetExtension) {
            return [];
          }

          return [entryPath];
        }),
    );

    return files.flat();
  }

  private async generateMidiFilesFromAbletonSets(
    folderId: string,
    directoryPath: string,
  ): Promise<
    Array<{
      path: string;
      name: string;
      type: DesktopDawFileCandidate['type'];
      mimeType: string;
      sizeBytes: number;
      modifiedAt: string;
    }>
  > {
    await mkdir(this.generatedMidiDirectory, { recursive: true });
    const abletonSetFiles = await this.findAbletonSetFiles(directoryPath);
    const generatedFiles = await Promise.all(
      abletonSetFiles.map(async (abletonSetPath) => {
        try {
          const compressedSet = await readFile(abletonSetPath);
          const xml = gunzipSync(compressedSet).toString('utf8');
          const clips = parseAbletonMidiClips(xml);
          const setHash = hashValue(`${folderId}:${abletonSetPath}`).slice(0, 12);

          const midiFiles = await Promise.all(
            clips.map(async (clip, index) => {
              const fileName = getMidiClipFileName(clip, index);
              const generatedFileName = sanitizeFileName(`${setHash}-${fileName}`);
              const generatedPath = join(this.generatedMidiDirectory, generatedFileName);
              await writeFile(generatedPath, writeMidiClip(clip));
              const generatedStats = await stat(generatedPath);

              return {
                path: generatedPath,
                name: fileName,
                type: 'MIDI' as const,
                mimeType: 'audio/midi',
                sizeBytes: generatedStats.size,
                modifiedAt: generatedStats.mtime.toISOString(),
              };
            }),
          );

          return midiFiles;
        } catch {
          return [];
        }
      }),
    );

    return generatedFiles.flat();
  }

  private broadcastQueue(): void {
    broadcast(desktopChannels.queueChanged, [...this.state.queue]);
  }

  private broadcastDawCandidates(): void {
    broadcast(desktopChannels.dawCandidatesChanged, [...this.state.dawCandidates]);
  }
}
