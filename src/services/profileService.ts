import { api, apiBaseUrl, getSession, setSession } from './api';

export type ProfilePhoto = { id: string; url: string };
export type UserProfile = {
  id: string; name: string; email: string; username: string; bio: string; location: string; interests: string[];
  languages: string[]; gender: string; religion: string; alcohol: string; birthDate: string; avatarUrl: string | null;
  age: number | null; basicProfileComplete: boolean; emailVerified: boolean; photos: ProfilePhoto[];
  education: string; school: string; companionGoal: string; availableTimes: string[]; activityWish: string; contribution: string;
  profileComplete: boolean; missingFields: string[];
  coverUrl?: string | null; occupation?: string; demo?: boolean;
};
export type ProfileDraft = Pick<UserProfile, 'name' | 'username' | 'bio' | 'location' | 'interests' | 'languages' | 'gender' | 'religion' | 'alcohol' | 'birthDate' | 'occupation' | 'education' | 'school' | 'companionGoal' | 'availableTimes' | 'activityWish' | 'contribution'>;
export const missingFieldLabels: Record<string, string> = { birthDate: 'ngày sinh', gender: 'giới tính', name: 'họ tên', location: 'khu vực', bio: 'giới thiệu', interests: 'sở thích', languages: 'ngôn ngữ' };
export function imageUrl(url: string) { return url.startsWith('/') && /^https?:/.test(apiBaseUrl) ? `${apiBaseUrl.replace(/\/api$/, '')}${url}` : url; }
export const getProfile = async () => (await api<{ profile: UserProfile }>('/profile/me')).profile;
export type Reputation = { average: number | null; count: number; completedActivities: number };
export type PublicProfile = { reputation?: Reputation } & Pick<UserProfile, 'id' | 'name' | 'username' | 'bio' | 'location' | 'interests' | 'languages' | 'avatarUrl' | 'coverUrl' | 'occupation' | 'demo' | 'age' | 'photos' | 'education' | 'school' | 'companionGoal' | 'availableTimes' | 'activityWish' | 'contribution'>;
export const getPublicProfile = async (id: string) => { const result = await api<{ profile: PublicProfile; reputation?: Reputation }>(`/profile/${encodeURIComponent(id)}`); return { ...result.profile, reputation: result.reputation }; };
export async function saveProfile(fields: ProfileDraft) {
  const { profile } = await api<{ profile: UserProfile }>('/profile/me', { method: 'PATCH', body: JSON.stringify(fields) });
  const session = getSession(); if (session) setSession({ ...session, user: { ...session.user, name: profile.name } });
  return profile;
}
export const uploadAvatar = async (base64: string) => (await api<{ profile: UserProfile }>('/profile/me/avatar', { method: 'PUT', body: JSON.stringify({ base64 }) })).profile;

export const uploadProfilePhoto = async (base64: string) => (await api<{ profile: UserProfile }>('/profile/me/photos', { method: 'POST', body: JSON.stringify({ base64 }) })).profile;
export const arrangeProfilePhotos = async (photoIds: string[]) => (await api<{ profile: UserProfile }>('/profile/me/photos', { method: 'PATCH', body: JSON.stringify({ photoIds }) })).profile;
export type ProfileReviews = { items: { id: string; score: number; comment?: string; activityTitle?: string; createdAt: string }[]; average: number | null; count: number };
export const getMyReviews = () => api<ProfileReviews>('/profile/me/reviews');

export const uploadCover = async (base64: string) => (await api<{ profile: UserProfile }>('/profile/me/cover', { method: 'PUT', body: JSON.stringify({ base64 }) })).profile;
export const removeCover = async () => (await api<{ profile: UserProfile }>('/profile/me/cover', { method: 'DELETE' })).profile;
