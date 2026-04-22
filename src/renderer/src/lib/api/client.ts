import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});
