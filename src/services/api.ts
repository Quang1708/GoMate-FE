import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { resolveApiBaseUrl } from './apiUrl';
import * as SecureStore from 'expo-secure-store';

export const apiBaseUrl = resolveApiBaseUrl({
  configuredUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  development: __DEV__,
  platform: Platform.OS,
  hostUri: Constants.expoConfig?.hostUri,
  webOrigin: Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined,
});

export type Session = { accessToken: string; user: { id: string; name: string; email: string } };
const sessionKey = 'gomate.session';
function restoreSession(): Session | null {
  if (Platform.OS !== 'web') return null;
  try {
    const value = JSON.parse(localStorage.getItem(sessionKey) || 'null');
    return value && typeof value.accessToken === 'string' && typeof value.user?.id === 'string' ? value : null;
  } catch { return null; }
}
let session: Session | null = restoreSession();
let generation = 0;
let storageQueue: Promise<void> = Promise.resolve();
let onUnauthorized: (() => void) | undefined;
export const getSession = () => session;
export const setSession = (value: Session | null) => { session = value; generation++;
  if (Platform.OS === 'web') try {
    if (value) localStorage.setItem(sessionKey, JSON.stringify(value)); else localStorage.removeItem(sessionKey);
  } catch { /* Storage can be disabled by the browser. */ }
  else {
    storageQueue = storageQueue.catch(() => {}).then(() => value ? SecureStore.setItemAsync(sessionKey, JSON.stringify(value), { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }) : SecureStore.deleteItemAsync(sessionKey));
    void storageQueue.catch(() => {});
  }
};
export async function persistSession(value: Session | null) {
  setSession(value);
  try { await storageQueue; }
  catch (reason) { if (value && session === value) setSession(null); throw reason; }
}
export async function initializeSession() {
  if (Platform.OS === 'web') return;
  const current = generation;
  await storageQueue.catch(() => {});
  const stored = await SecureStore.getItemAsync(sessionKey);
  if (current !== generation) return;
  let value: Session | null = null;
  try { value = JSON.parse(stored || 'null'); } catch { /* Discard damaged data. */ }
  if (!value || typeof value.accessToken !== 'string' || typeof value.user?.id !== 'string') { await persistSession(null); return; }
  session = value;
  // MainApp checks the restored session against BE; network failure keeps a retry path.
}
export const setUnauthorizedHandler = (handler?: () => void) => { onUnauthorized = handler; };

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = session?.accessToken;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), typeof options.body === 'string' && options.body.length > 1000000 ? 120000 : 15000);
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options, signal: controller.signal,
      headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    });
    if (response.status === 204) return undefined as T;
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401 && token && session?.accessToken === token) { setSession(null); onUnauthorized?.(); }
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
  const result = await post<Session>('/auth/login', { email: email.trim(), password, rememberMe: true });
  await persistSession(result);
  return result;
}
export async function verifyEmail(email: string, code: string) {
  const result = await post<Session>('/auth/verify-email', { email: email.trim(), code });
  await persistSession(result);
  return result;
}
export async function logout() {
  try { await post<void>('/auth/logout', {}); } finally { await persistSession(null); }
}
