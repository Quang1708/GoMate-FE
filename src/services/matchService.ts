import { api, post } from './api';
import { ActivityDto, allPages } from './activityApi';
import type { ActivityFilters } from '../screens/FilterScreen';
export type MatchPreferences = { filters: Partial<ActivityFilters> | null; favoriteIds: string[] };
export const getMatchPreferences = () => api<MatchPreferences>('/me/match-preferences');
export function saveMatchFilters(filters: ActivityFilters) {
  const saved = { ...filters };
  delete saved.coordinates;
  return api('/me/match-preferences', { method: 'PUT', body: JSON.stringify(saved) });
}
export const setFavorite = (id: string, saved: boolean) => api<void>(`/me/favorites/${encodeURIComponent(id)}`, { method: saved ? 'PUT' : 'DELETE' });
export const listFavorites = () => allPages<ActivityDto>('/me/favorites');
export const matchFeedback = (activityId: string, outcome: 'skip' | 'dislike' | 'interested' | 'favorite') => post<void>('/me/match-feedback', { activityId, outcome });
