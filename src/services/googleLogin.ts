import { post, Session, persistSession } from './api';
export async function finishGoogleLogin(idToken: string) {
  const result = await post<Session>('/auth/google', { idToken, rememberMe: true });
  await persistSession(result);
}
