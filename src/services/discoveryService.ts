import type { Activity } from '../data/activities';
import { apiBaseUrl, ApiError, getSession } from './authService';
export type ActivityFilters = { distance: number; categories: string[]; budget: string; days: number[]; fromHour: number; toHour: number };

export type Coordinates = { latitude: number; longitude: number };
export type ActivityResult = {
  id: string; title: string; hostName: string; location: string; startsAt: string;
  memberCount: number; maxParticipants: number; category: string; tags?: string[];
  description: string; estimatedCost: number; requirements?: string[]; plan?: string[];
  imageUrl?: string; distanceKm: number | null;
};
export function searchParams(filters: ActivityFilters, q: string, page: number, coords?: Coordinates) {
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (q.trim()) params.set('q', q.trim());
  if (filters.categories.length) params.set('categories', filters.categories.join(','));
  if (filters.days.length) params.set('days', filters.days.join(','));
  params.set('fromHour', String(filters.fromHour)); params.set('toHour', String(filters.toHour));
  const budgets: Record<string, [number, number]> = {
    'Miễn phí': [0, 0], 'Dưới 100k': [0, 99999], '100k – 300k': [100000, 300000],
    '300k – 500k': [300000, 500000], 'Trên 500k': [500001, 1000000000],
  };
  const budget = budgets[filters.budget];
  if (budget) { params.set('minCost', String(budget[0])); params.set('maxCost', String(budget[1])); }
  if (coords) {
    params.set('lat', String(coords.latitude)); params.set('lng', String(coords.longitude));
    params.set('distanceKm', String(filters.distance));
  }
  return params;
}
export async function searchActivities(filters: ActivityFilters, q: string, page: number, coords: Coordinates | undefined, signal: AbortSignal) {
  const base = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || apiBaseUrl;
  const session = getSession();
  if (!base || !session) throw new Error('Vui lòng đăng nhập và kiểm tra cấu hình API.');
  const response = await fetch(`${base}/activities?${searchParams(filters, q, page, coords)}`, {
    signal, headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  const data = await response.json();
  if (!response.ok) throw new ApiError(data.error || 'Không tìm được hoạt động.', response.status);
  return data as { items: ActivityResult[]; hasMore: boolean; total: number };
}
export function activityCard(item: ActivityResult): Activity {
  return { id: item.id, title: item.title, host: item.hostName || 'Host', location: item.location,
    time: new Date(item.startsAt).toLocaleString('vi-VN', { timeZone: 'Asia/Bangkok' }),
    members: `${item.memberCount}/${item.maxParticipants}`, distance: item.distanceKm === null ? 'Chưa xác định' : `${item.distanceKm.toFixed(1)} km`,
    category: item.category, tags: item.tags ?? [], description: item.description,
    estimatedCost: `${item.estimatedCost.toLocaleString('vi-VN')}đ/người`, requirements: item.requirements ?? [], plan: item.plan ?? [],
    hostRating: 0, hostCompletedActivities: 0,
    image: item.imageUrl ? { uri: item.imageUrl } : require('../assets/logo.png'),
  };
}
