import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { clearAuthSession, getAuthToken, setAuthSession } from '@/lib/auth-storage';
import type {
  ActivityEvent,
  ApiResponse,
  AuthResponse,
  Comment,
  FileAsset,
  Invite,
  Project,
  ProjectMember,
  SongVersion,
  User,
  VersionFileAsset,
  VersionFileAssetType,
} from '@/types/api';

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:4000';

export const unauthorizedEventName = 'stembridge:unauthorized';

export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401) {
      clearAuthSession();
      window.dispatchEvent(new CustomEvent(unauthorizedEventName));
    }

    return Promise.reject(error);
  },
);

export const getApiErrorMessage = (error: unknown, fallback = 'Request failed.'): string => {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    return error.response?.data?.message || error.response?.statusText || error.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
};

export const apiRequest = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.request<ApiResponse<T>>(config);
  return response.data.data;
};

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name?: string;
  email: string;
  password: string;
}

interface CurrentUserResponse {
  user: User;
}

interface ProjectsResponse {
  projects: Project[];
}

interface ProjectResponse {
  project: Project;
}

interface VersionsResponse {
  versions: SongVersion[];
}

interface VersionResponse {
  version: SongVersion;
}

interface FileUploadResponse {
  file: VersionFileAsset;
}

export interface FileDownloadResponse {
  blob: Blob;
  fileName: string;
}

export interface ProjectPayload {
  name: string;
  bpm?: number;
  musicalKey?: string;
}

export interface CreateVersionPayload {
  notes?: string;
}

export interface CommentPayload {
  body: string;
  songVersionId?: string;
  timestampSeconds?: number;
}

export interface InvitePayload {
  email: string;
  role: ProjectMember['role'];
}

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const authResponse = await apiRequest<AuthResponse>({
      method: 'POST',
      url: '/auth/login',
      data: payload,
    });
    setAuthSession(authResponse);
    return authResponse;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const authResponse = await apiRequest<AuthResponse>({
      method: 'POST',
      url: '/auth/register',
      data: payload,
    });
    setAuthSession(authResponse);
    return authResponse;
  },

  async me(): Promise<User> {
    const response = await apiRequest<CurrentUserResponse>({ method: 'GET', url: '/auth/me' });
    return response.user;
  },

  logout(): void {
    clearAuthSession();
  },
};

export const projectsApi = {
  async list(): Promise<Project[]> {
    const response = await apiRequest<ProjectsResponse>({ method: 'GET', url: '/projects' });
    return response.projects;
  },

  async getById(projectId: string): Promise<Project> {
    const response = await apiRequest<ProjectResponse>({
      method: 'GET',
      url: `/projects/${projectId}`,
    });
    return response.project;
  },

  async create(payload: ProjectPayload): Promise<Project> {
    const response = await apiRequest<ProjectResponse>({
      method: 'POST',
      url: '/projects',
      data: payload,
    });
    return response.project;
  },

  update: (projectId: string, payload: Partial<ProjectPayload>): Promise<Project> =>
    apiRequest<Project>({ method: 'PATCH', url: `/projects/${projectId}`, data: payload }),

  members: (projectId: string): Promise<ProjectMember[]> =>
    apiRequest<ProjectMember[]>({ method: 'GET', url: `/projects/${projectId}/members` }),

  async versions(projectId: string): Promise<SongVersion[]> {
    const response = await apiRequest<VersionsResponse>({
      method: 'GET',
      url: `/projects/${projectId}/versions`,
    });
    return response.versions;
  },

  async createVersion(projectId: string, payload: CreateVersionPayload): Promise<SongVersion> {
    const response = await apiRequest<VersionResponse>({
      method: 'POST',
      url: `/projects/${projectId}/versions`,
      data: payload,
    });
    return response.version;
  },

  files: (projectId: string): Promise<FileAsset[]> =>
    apiRequest<FileAsset[]>({ method: 'GET', url: `/projects/${projectId}/files` }),

  comments: (projectId: string): Promise<Comment[]> =>
    apiRequest<Comment[]>({ method: 'GET', url: `/projects/${projectId}/comments` }),

  activity: (projectId: string): Promise<ActivityEvent[]> =>
    apiRequest<ActivityEvent[]>({ method: 'GET', url: `/projects/${projectId}/activity` }),

  invites: (projectId: string): Promise<Invite[]> =>
    apiRequest<Invite[]>({ method: 'GET', url: `/projects/${projectId}/invites` }),
};

export const versionsApi = {
  async getById(versionId: string): Promise<SongVersion> {
    const response = await apiRequest<VersionResponse>({
      method: 'GET',
      url: `/versions/${versionId}`,
    });
    return response.version;
  },

  async uploadFile(
    versionId: string,
    payload: {
      file: File;
      type: VersionFileAssetType;
      onProgress?: (progress: number) => void;
    },
  ): Promise<VersionFileAsset> {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('type', payload.type);

    const response = await apiRequest<FileUploadResponse>({
      method: 'POST',
      url: `/versions/${versionId}/files/upload`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress(progressEvent) {
        if (!payload.onProgress || !progressEvent.total) {
          return;
        }

        payload.onProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
      },
    });

    return response.file;
  },

  async downloadFile(versionId: string, fileId: string): Promise<FileDownloadResponse> {
    const response = await apiClient.request<Blob>({
      method: 'GET',
      url: `/versions/${versionId}/files/${fileId}/download`,
      responseType: 'blob',
    });

    return {
      blob: response.data,
      fileName: getDownloadFileName(response.headers['content-disposition']) || 'download',
    };
  },
};

const getDownloadFileName = (contentDisposition: unknown): string | null => {
  if (typeof contentDisposition !== 'string') {
    return null;
  }

  const encodedFileName = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];

  if (encodedFileName) {
    try {
      return decodeURIComponent(encodedFileName);
    } catch {
      return encodedFileName;
    }
  }

  return contentDisposition.match(/filename="([^"]+)"/i)?.[1] ?? null;
};

export const commentsApi = {
  create: (projectId: string, payload: CommentPayload): Promise<Comment> =>
    apiRequest<Comment>({ method: 'POST', url: `/projects/${projectId}/comments`, data: payload }),

  resolve: (commentId: string): Promise<Comment> =>
    apiRequest<Comment>({ method: 'PATCH', url: `/comments/${commentId}`, data: { status: 'resolved' } }),
};

export const invitesApi = {
  create: (projectId: string, payload: InvitePayload): Promise<Invite> =>
    apiRequest<Invite>({ method: 'POST', url: `/projects/${projectId}/invites`, data: payload }),

  revoke: (inviteId: string): Promise<Invite> =>
    apiRequest<Invite>({ method: 'PATCH', url: `/invites/${inviteId}`, data: { status: 'revoked' } }),
};
