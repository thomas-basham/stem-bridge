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
  name: string;
  email: string;
  password: string;
}

export interface ProjectPayload {
  title: string;
  description?: string;
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

  me: (): Promise<User> => apiRequest<User>({ method: 'GET', url: '/auth/me' }),

  logout(): void {
    clearAuthSession();
  },
};

export const projectsApi = {
  list: (): Promise<Project[]> => apiRequest<Project[]>({ method: 'GET', url: '/projects' }),

  getById: (projectId: string): Promise<Project> =>
    apiRequest<Project>({ method: 'GET', url: `/projects/${projectId}` }),

  create: (payload: ProjectPayload): Promise<Project> =>
    apiRequest<Project>({ method: 'POST', url: '/projects', data: payload }),

  update: (projectId: string, payload: Partial<ProjectPayload>): Promise<Project> =>
    apiRequest<Project>({ method: 'PATCH', url: `/projects/${projectId}`, data: payload }),

  members: (projectId: string): Promise<ProjectMember[]> =>
    apiRequest<ProjectMember[]>({ method: 'GET', url: `/projects/${projectId}/members` }),

  versions: (projectId: string): Promise<SongVersion[]> =>
    apiRequest<SongVersion[]>({ method: 'GET', url: `/projects/${projectId}/versions` }),

  files: (projectId: string): Promise<FileAsset[]> =>
    apiRequest<FileAsset[]>({ method: 'GET', url: `/projects/${projectId}/files` }),

  comments: (projectId: string): Promise<Comment[]> =>
    apiRequest<Comment[]>({ method: 'GET', url: `/projects/${projectId}/comments` }),

  activity: (projectId: string): Promise<ActivityEvent[]> =>
    apiRequest<ActivityEvent[]>({ method: 'GET', url: `/projects/${projectId}/activity` }),

  invites: (projectId: string): Promise<Invite[]> =>
    apiRequest<Invite[]>({ method: 'GET', url: `/projects/${projectId}/invites` }),
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
