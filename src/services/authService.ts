// Compatibility API for the original screens; all flows share one session store.
import { login as loginSession, post, verifyEmail as verifySession } from './api';
export { apiBaseUrl, ApiError, getSession, logout } from './api';
export type { Session } from './api';
export type Credentials = { email: string; password: string };
export const register = (data: Credentials & { name: string }) => post('/auth/register', data);
export const verifyEmail = (email: string, code: string) => verifySession(email, code);
export const resendVerification = (email: string) => post('/auth/resend-verification', { email });
export const login = (data: Credentials) => loginSession(data.email, data.password);
