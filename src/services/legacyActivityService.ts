import { apiBaseUrl, ApiError, getSession } from './authService';
import type { ActivityResult } from './discoveryService';

export type ActivityRecord = ActivityResult & {
  hostId: string; endsAt: string; status: string; version: number;
  coordinates?: { type: 'Point'; coordinates: [number, number] } | null;
};
export type ActivityDraft = {
  name: string; category: string; description: string; date: string;
  startTime: string; endTime: string; endDate?: string; location: string; maxParticipants: string;
  estimatedCost: string; requirements: string; latitude?: string; longitude?: string;
  coverBase64?: string;
};
async function request<T>(path: string, method = 'GET', body?: object): Promise<T> {
  const base = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || apiBaseUrl;
  const session = getSession();
  if (!base || !session) throw new Error('Vui lòng đăng nhập và kiểm tra địa chỉ API.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(`${base}/activities${path}`, { method, signal: controller.signal,
      headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = response.status === 204 ? undefined : await response.json();
    if (!response.ok) throw new ApiError(data?.error || 'Không thể xử lý hoạt động.', response.status);
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error('Không kết nối được máy chủ. Nếu vừa đăng hoạt động, kiểm tra danh sách trước khi thử lại.');
  } finally { clearTimeout(timer); }
}
function parseDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) throw new Error('Nhập ngày theo DD/MM/YYYY.');
  const [, day, month, year] = match;
  const date = `${year}-${month}-${day}`;
  const dayCheck = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(dayCheck.getTime()) || dayCheck.toISOString().slice(0, 10) !== date) throw new Error('Ngày không hợp lệ.');
  return date;
}
export function draftBody(draft: ActivityDraft) {
  const date = parseDate(draft.date);
  const endDate = draft.endDate?.trim() ? parseDate(draft.endDate) : date;
  const time = (value: string, day: string) => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error('Giờ phải theo HH:mm.');
    return new Date(`${day}T${value}:00+07:00`).toISOString();
  };
  if (!/^\d+$/.test(draft.maxParticipants) || !/^\d+$/.test(draft.estimatedCost)) throw new Error('Số người và chi phí phải là số nguyên; nhập 0 nếu miễn phí.');
  const hasCoordinates = !!draft.latitude?.trim() || !!draft.longitude?.trim();
  if (hasCoordinates && (!draft.latitude?.trim() || !draft.longitude?.trim() || !Number.isFinite(Number(draft.latitude)) || !Number.isFinite(Number(draft.longitude)))) throw new Error('Cần nhập đủ vĩ độ và kinh độ hợp lệ.');
  return { title: draft.name, category: draft.category, description: draft.description,
    startsAt: time(draft.startTime, date), endsAt: time(draft.endTime, endDate), location: draft.location,
    maxParticipants: Number(draft.maxParticipants), estimatedCost: Number(draft.estimatedCost),
    requirements: draft.requirements.split('\n').map(value => value.trim()).filter(Boolean),
    coordinates: hasCoordinates ? { type: 'Point', coordinates: [Number(draft.longitude), Number(draft.latitude)] } : null,
    ...(draft.coverBase64 ? { coverBase64: draft.coverBase64 } : {}),
  };
}
export function recordDraft(item: ActivityRecord): ActivityDraft {
  const local = (iso: string) => new Date(new Date(iso).getTime() + 7 * 3600000).toISOString();
  const start = local(item.startsAt), end = local(item.endsAt);
  const [year, month, day] = start.slice(0, 10).split('-');
  const [endYear, endMonth, endDay] = end.slice(0, 10).split('-');
  return { name: item.title, category: item.category, description: item.description, date: `${day}/${month}/${year}`,
    startTime: start.slice(11, 16), endTime: end.slice(11, 16), endDate: `${endDay}/${endMonth}/${endYear}`, location: item.location,
    maxParticipants: String(item.maxParticipants), estimatedCost: String(item.estimatedCost),
    requirements: (item.requirements ?? []).join('\n'), latitude: item.coordinates ? String(item.coordinates.coordinates[1]) : '',
    longitude: item.coordinates ? String(item.coordinates.coordinates[0]) : '',
  };
}
export const publishActivityDraft = (draft: ActivityDraft) => request<{ activity: ActivityRecord }>('', 'POST', draftBody(draft));
export const updateActivity = (id: string, draft: ActivityDraft) => request<{ activity: ActivityRecord }>(`/${encodeURIComponent(id)}`, 'PATCH', draftBody(draft));
export const deleteActivity = (id: string) => request<void>(`/${encodeURIComponent(id)}`, 'DELETE');
export const getActivity = (id: string) => request<{ activity: ActivityRecord }>(`/${encodeURIComponent(id)}`);
export const myHostedActivities = (page = 1) => request<{ items: ActivityRecord[]; hasMore: boolean }>(`/mine?page=${page}&limit=20`);
