import { Activity } from '../data/activities';
import { api, post } from './api';
import type { ParticipantPreferences } from '../components/ActivityChoices';
import { imageUrl } from './profileService';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'left' | 'removed';
export type ActivityDto = {
  id: string; hostId: string; hostName: string; title: string; description: string; category: string;
  location: string; startsAt: string; endsAt?: string; estimatedCost: number; maxParticipants: number;
  memberCount: number; tags?: string[]; requirements?: string[]; plan?: string[]; imageUrl?: string;
  distanceKm?: number | null; status?: 'published' | 'in-progress' | 'completed';
  minParticipants?: number; participantPreferences?: ParticipantPreferences; meetingPoint?: string; registrationDeadline?: string;
};
export type JoinRequest = { id: string; userId: string; name: string; status: RequestStatus; activityId?: string; activity?: ActivityDto };
export type Member = { userId: string; name: string; role: 'host' | 'member'; avatarUrl?: string | null };
type Page<T> = { items: T[]; page: number; limit: number; total: number; hasMore: boolean };
const idPath = (id: string) => `/activities/${encodeURIComponent(id)}`;

// Exhaust pagination so requests and membership do not disappear after the first 20 rows.
export async function allPages<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= 500; page++) {
    const result = await api<Page<T>>(`${path}${path.includes('?') ? '&' : '?'}page=${page}&limit=50`);
    items.push(...result.items);
    if (!result.hasMore) return items;
  }
  throw new Error('Danh sách quá lớn. Vui lòng thu hẹp tìm kiếm.');
}

export function toActivity(row: ActivityDto, requestStatus?: RequestStatus): Activity {
  return {
    id: row.id, hostId: row.hostId, title: row.title, host: row.hostName, location: row.location,
    startsAt: row.startsAt, endsAt: row.endsAt, requestStatus, backendStatus: row.status ?? 'published',
    minParticipants: row.minParticipants ?? 2, participantPreferences: row.participantPreferences, meetingPoint: row.meetingPoint,
    time: new Date(row.startsAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }),
    members: `${row.memberCount}/${row.maxParticipants}`, distance: row.distanceKm == null ? 'Chưa có vị trí' : `${row.distanceKm.toFixed(1)} km`,
    category: row.category, tags: row.tags ?? [], description: row.description,
    estimatedCost: `${row.estimatedCost.toLocaleString('vi-VN')}đ/người`, requirements: row.requirements ?? [], plan: row.plan ?? [],
    hostRating: 0, hostCompletedActivities: 0,
    status: requestStatus === 'pending' ? 'pending' : row.status === 'in-progress' || row.status === 'completed' ? row.status : 'confirmed',
    image: { uri: row.imageUrl ? imageUrl(row.imageUrl) : `https://images.unsplash.com/photo-${row.category === 'Thể thao' ? '1552674605-db6ffd4facb5' : row.category === 'Du lịch' ? '1742311115947-e5023fd20eee' : row.category === 'Ăn uống' ? '1501339847302-ac426a4a7cbb' : '1517245386807-bb43f82c33c4'}?auto=format&fit=crop&w=1200&q=80` },
  };
}
export const listActivities = (query = '') => allPages<ActivityDto>(`/activities${query ? `?${query}` : ''}`);
export const listOwned = () => allPages<ActivityDto>('/activities/mine');
export const listJoined = () => allPages<ActivityDto>('/me/activities');
export const listMyRequests = (status?: RequestStatus) => allPages<JoinRequest>(`/me/join-requests${status ? `?status=${status}` : ''}`);
export const listRequests = (id: string) => allPages<JoinRequest>(`${idPath(id)}/join-requests?status=pending`);
export const listMembers = (id: string) => allPages<Member>(`${idPath(id)}/members`);
export const joinActivity = (id: string) => post<{ request: JoinRequest }>(`${idPath(id)}/join-requests`, {});
export const cancelRequest = (id: string) => api<void>(`${idPath(id)}/join-requests/me`, { method: 'DELETE' });
export const decideRequest = (id: string, requestId: string, status: 'approved' | 'rejected') =>
  api<{ request: JoinRequest }>(`${idPath(id)}/join-requests/${encodeURIComponent(requestId)}`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const leaveActivity = (id: string) => api<void>(`${idPath(id)}/members/me`, { method: 'DELETE' });
export const removeMember = (id: string, userId: string) => api<void>(`${idPath(id)}/members/${encodeURIComponent(userId)}`, { method: 'DELETE' });
