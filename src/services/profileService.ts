import { api, apiBaseUrl, getSession, setSession } from './api';

export type UserProfile = {
  id: string; name: string; email: string; username: string; bio: string; location: string; interests: string[];
  languages: string[]; gender: string; religion: string; alcohol: string; birthDate: string; avatarUrl: string | null;
  profileComplete: boolean; missingFields: string[];
  coverUrl?: string | null; occupation?: string; demo?: boolean;
};
export type ProfileDraft = Pick<UserProfile, 'name' | 'username' | 'bio' | 'location' | 'interests' | 'languages' | 'gender' | 'religion' | 'alcohol' | 'birthDate'>;
export const missingFieldLabels: Record<string, string> = { name: 'họ tên', location: 'khu vực', bio: 'giới thiệu', interests: 'sở thích', languages: 'ngôn ngữ' };
export function imageUrl(url: string) { return url.startsWith('/') && /^https?:/.test(apiBaseUrl) ? `${apiBaseUrl.replace(/\/api$/, '')}${url}` : url; }
export const getProfile = async () => (await api<{ profile: UserProfile }>('/profile/me')).profile;
export type PublicProfile = Pick<UserProfile, 'id' | 'name' | 'username' | 'bio' | 'location' | 'interests' | 'languages' | 'avatarUrl' | 'coverUrl' | 'occupation' | 'demo'>;
export const getPublicProfile = async (id: string) => (await api<{ profile: PublicProfile }>(`/profile/${encodeURIComponent(id)}`)).profile;
export async function saveProfile(fields: ProfileDraft) {
  const { profile } = await api<{ profile: UserProfile }>('/profile/me', { method: 'PATCH', body: JSON.stringify(fields) });
  const session = getSession(); if (session) setSession({ ...session, user: { ...session.user, name: profile.name } });
  return profile;
}
export const uploadAvatar = async (base64: string) => (await api<{ profile: UserProfile }>('/profile/me/avatar', { method: 'PUT', body: JSON.stringify({ base64 }) })).profile;
