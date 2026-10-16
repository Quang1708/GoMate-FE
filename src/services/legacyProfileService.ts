import { apiBaseUrl, ApiError, getSession } from './authService';

export type Profile = {
  id: string; email: string; name: string; username: string; bio: string;
  location: string; interests: string[]; avatarUrl: string | null;
};
export type ProfileFields = Pick<Profile, 'name' | 'username' | 'bio' | 'location' | 'interests'>;

async function request(path: string, method = 'GET', body?: object): Promise<Profile> {
  const base = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || apiBaseUrl;
  if (!base) throw new Error('Chưa cấu hình địa chỉ API.');
  const session = getSession();
  if (!session) throw new Error('Vui lòng đăng nhập lại.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${base}/profile/${path}`, {
      method, signal: controller.signal,
      headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.error || 'Không thể lưu hồ sơ.', response.status);
    const profile: Profile = data.profile;
    if (profile.avatarUrl) profile.avatarUrl = new URL(profile.avatarUrl, base).toString();
    session.user.name = profile.name;
    return profile;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error('Không tải được hồ sơ. Kiểm tra kết nối và thử lại.');
  } finally { clearTimeout(timer); }
}

export const getProfile = () => request('me');
export const updateProfile = (fields: ProfileFields) => request('me', 'PATCH', fields);
export const uploadAvatar = (base64: string) => request('me/avatar', 'PUT', { base64 });
