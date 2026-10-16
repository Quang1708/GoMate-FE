import { api } from './api';
import type { ActivityDraft } from './activityService';
export type ActivityDraftState = { step: number; customCategory: boolean; data: ActivityDraft };
export type SavedActivityDraft = { version: number; savedAt: string; state: ActivityDraftState };
export const loadActivityDraft = async () => (await api<{ draft: SavedActivityDraft | null }>('/activity-draft', { timeoutMs: 120000 })).draft;
export const saveActivityDraft = (state: ActivityDraftState, version: number) => api<{ version: number; savedAt: string }>('/activity-draft', { method: 'PUT', body: JSON.stringify({ state: { ...state, data: { ...state.data, cover: undefined, photos: state.data.photos.map(photo => ({ base64: photo.base64 })) } }, version }), timeoutMs: 120000 });
export const deleteActivityDraft = (version: number) => api<void>('/activity-draft', { method: 'DELETE', body: JSON.stringify({ version }) });
export function restoreDraftPhotos(photos: ActivityDraft['photos']) {
  return photos.map(photo => photo.base64 ? { ...photo, uri: `data:image/${photo.base64.startsWith('iVBOR') ? 'png' : photo.base64.startsWith('UklGR') ? 'webp' : 'jpeg'};base64,${photo.base64}` } : photo);
}
