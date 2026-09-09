import axios from 'axios';

export const tokenKey = 'mini-erp-token';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api', timeout: 15000 });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(tokenKey);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use((response) => response, (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401 && error.config?.url !== '/auth/login') {
    sessionStorage.removeItem(tokenKey);
    window.dispatchEvent(new Event('session-expired'));
  }
  return Promise.reject(error);
});
interface ApiErrorBody { error?: { message?: string; details?: { field: string; message: string }[] } }
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) return error.response?.data.error?.message || 'Unable to reach the server. Please try again.';
  return 'Something went wrong. Please try again.';
}
export function fieldErrors(error: unknown) {
  return axios.isAxiosError<ApiErrorBody>(error) ? error.response?.data.error?.details ?? [] : [];
}
