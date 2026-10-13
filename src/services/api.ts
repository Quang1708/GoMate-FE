import { Platform } from 'react-native';

const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
export const apiBaseUrl = (configuredUrl || (Platform.OS === 'web' ? '/api' : 'http://localhost:3000/api')).replace(/\/$/, '');

export type Session = { accessToken: string; user: { id: string; name: string; email: string } };
let session: Session | null = null;
let onUnauthorized: (() => void) | undefined;
export const getSession = () => session;
export const setSession = (value: Session | null) => { session = value; };
export const setUnauthorizedHandler = (handler?: () => void) => { onUnauthorized = handler; };

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = session?.accessToken;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options, signal: controller.signal,
      headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    });
    if (response.status === 204) return undefined as T;
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401 && token && session?.accessToken === token) { session = null; onUnauthorized?.(); }
      throw new ApiError(payload?.error || `Yêu cầu thất bại (${response.status})`, response.status);
    }
    if (payload === null) throw new Error('API trả về dữ liệu không hợp lệ. Kiểm tra địa chỉ BE.');
    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error(error instanceof Error && error.name === 'AbortError'
      ? 'Kết nối quá thời gian. Vui lòng thử lại.'
      : 'Không kết nối được BE. Kiểm tra mạng và EXPO_PUBLIC_API_BASE_URL.');
  } finally { clearTimeout(timeout); }
}

export const post = <T,>(path: string, body: unknown) => api<T>(path, { method: 'POST', body: JSON.stringify(body) });
export async function login(email: string, password: string) {
  const result = await post<Session>('/auth/login', { email: email.trim(), password });
  setSession(result);
  return result;
}
export async function verifyEmail(email: string, code: string) {
  const result = await post<Session>('/auth/verify-email', { email: email.trim(), code });
  setSession(result);
  return result;
}
export async function logout() {
  try { await post<void>('/auth/logout', {}); } finally { setSession(null); }
}
