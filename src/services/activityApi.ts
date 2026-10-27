import { Activity } from '../data/activities';
import { api, post } from './api';
import type { ParticipantPreferences } from '../components/ActivityChoices';
import { imageUrl } from './profileService';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'left' | 'removed';
export type ActivityDto = {
  readiness?: { confirmedParticipants: number; externalParticipants: number; minimum: number; ready: boolean; reason: string };
  business?: Activity['business'];
  memberAvatars?: { userId: string; name: string; avatarUrl?: string | null }[];
  hostRating?: number | null; hostRatingCount?: number; hostCompletedActivities?: number;
  scheduleConfirmedAt?: string | null; scheduleConfirmedBy?: string | null;
  version?: number; address?: string; province?: string; district?: string; ward?: string; costNote?: string; reservedSeats?: number; companions?: { name: string; note: string }[]; hostAvatarUrl?: string | null; itinerary?: import('./planService').ItineraryStep[]; planLink?: string; planFile?: import('./planService').PlanFile | null;
  organizerType?: 'personal' | 'business'; coordinates?: { type: 'Point'; coordinates: [number, number] } | null;
  id: string; hostId: string; hostName: string; title: string; description: string; category: string;
  location: string; startsAt: string; endsAt?: string; estimatedCost: number; maxParticipants: number;
  memberCount: number; tags?: string[]; requirements?: string[]; plan?: string[]; imageUrl?: string; imageUrls?: string[];
  distanceKm?: number | null; status?: 'published' | 'in-progress' | 'completed' | 'expired';
  minParticipants?: number; participantPreferences?: ParticipantPreferences; meetingPoint?: string; registrationDeadline?: string | null;
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
    business: row.business,
    memberAvatars: row.memberAvatars, version: row.version, hostAvatarUrl: row.hostAvatarUrl, companions: row.companions, reservedSeats: row.reservedSeats ?? 0, costNote: row.costNote || '', itinerary: row.itinerary || [], planLink: row.planLink || '', planFile: row.planFile,
    organizerType: row.organizerType ?? 'personal', coordinates: row.coordinates ? { longitude: row.coordinates.coordinates[0], latitude: row.coordinates.coordinates[1] } : null,
    id: row.id, hostId: row.hostId, title: row.title, host: row.hostName, location: row.location,
    startsAt: row.startsAt, endsAt: row.endsAt, requestStatus, backendStatus: row.status ?? 'published',
    minParticipants: row.minParticipants ?? 2, participantPreferences: row.participantPreferences, meetingPoint: row.meetingPoint,
    time: new Date(row.startsAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }),
    members: `${row.memberCount}/${row.maxParticipants}`, distance: row.distanceKm == null ? 'Chưa có vị trí' : `${row.distanceKm.toFixed(1)} km`,
    category: row.category, tags: row.tags ?? [], description: row.description,
    estimatedCost: `${row.estimatedCost.toLocaleString('vi-VN')}đ/người`, requirements: row.requirements ?? [], plan: row.plan ?? [],
    hostRating: row.hostRating ?? 0, hostCompletedActivities: row.hostCompletedActivities ?? 0,
    status: requestStatus === 'pending' ? 'pending' : row.status === 'in-progress' || row.status === 'completed' ? row.status : 'confirmed',
    images: (row.imageUrls ?? (row.imageUrl ? [row.imageUrl] : [])).map(url => ({ uri: imageUrl(url) })),
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

export const getActivity = async (id: string) => (await api<{ activity: ActivityDto }>(idPath(id))).activity;
export const deleteActivity = (id: string) => api<void>(idPath(id), { method: 'DELETE' });
export const transitionActivity = async (id: string, action: 'start' | 'complete') => (await post<{ activity: ActivityDto }>(`${idPath(id)}/${action}`, {})).activity;
export const confirmActivitySchedule = async (id: string, version: number) => (await post<{ activity: ActivityDto }>(`${idPath(id)}/confirm-schedule`, { version })).activity;
export type Attendance = { userId: string; name: string; status: 'unmarked' | 'present' | 'absent' | 'late' };
export type ActivityUpdate = { id: string; type: string; text?: string; createdAt: string; userId?: string; status?: string };
export const listAttendance = (id: string) => allPages<Attendance>(`${idPath(id)}/attendance`);
export const listUpdates = (id: string) => allPages<ActivityUpdate>(`${idPath(id)}/updates`);
export const markAttendance = (id: string, userId: string, status: Attendance['status']) => api(`${idPath(id)}/attendance/${encodeURIComponent(userId)}`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const addActivityUpdate = (id: string, text: string) => post(`${idPath(id)}/updates`, { text });

export const addActivityFriends = async (id: string, friendIds: string[], useReservedSeats = true) => (await post<{ activity: ActivityDto }>(`${idPath(id)}/members/friends`, { friendIds, useReservedSeats })).activity;
export type ActivityInvitation = { id: string; userId: string; name: string; status: 'pending' | 'accepted' | 'declined'; activityId: string; activity: ActivityDto };
export const listActivityInvitations = () => allPages<ActivityInvitation>('/activities/invitations');
export const listSentActivityInvitations = async (activityId: string) => (await api<{ items: ActivityInvitation[] }>(`${idPath(activityId)}/invitations`)).items;
export const decideActivityInvitation = async (activityId: string, invitationId: string, status: 'accepted' | 'declined') => (await api<{ activity: ActivityDto }>(`${idPath(activityId)}/invitations/${encodeURIComponent(invitationId)}`, { method: 'PATCH', body: JSON.stringify({ status }) })).activity;
