import axios from 'axios';
import { getApiErrorMessage, getBlobApiErrorMessage } from '@/lib/api';

export const toProjectServiceError = (error: unknown, fallback: string): Error => {
  if (axios.isAxiosError(error)) {
    return new Error(getApiErrorMessage(error, fallback));
  }

  return error instanceof Error ? error : new Error(fallback);
};

export const toProjectBlobServiceError = async (
  error: unknown,
  fallback: string,
): Promise<Error> => {
  if (axios.isAxiosError(error)) {
    return new Error(await getBlobApiErrorMessage(error, fallback));
  }

  return error instanceof Error ? error : new Error(fallback);
};

export const isNotFoundApiError = (error: unknown): boolean => {
  return axios.isAxiosError(error) && error.response?.status === 404;
};
