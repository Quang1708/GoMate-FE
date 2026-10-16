import { Platform } from 'react-native';
import { api, apiBaseUrl, ApiError, getSession } from './api';
import type { HistoryPage } from './chatService';

export type ChatAttachment = { id: string; name: string; size: number; mimeType: string; kind: 'image' | 'video' | 'audio' | 'file' };
export type ChatLocation = { latitude: number; longitude: number; label: string };
export type SharedKind = 'media' | 'files' | 'links' | 'locations';
export const attachmentUrl = (conversationId: string, id: string) => `${apiBaseUrl}/conversations/${encodeURIComponent(conversationId)}/attachments/${encodeURIComponent(id)}`;
export const chatHeaders = () => ({ Authorization: `Bearer ${getSession()?.accessToken || ''}` });
export const sharedContent = (id: string, kind: SharedKind, before?: string) => api<HistoryPage>(`/conversations/${encodeURIComponent(id)}/shared?kind=${kind}&limit=30${before ? `&before=${before}` : ''}`);
export const locationUrl = (location: ChatLocation) => `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
export const fileSize = (bytes: number) => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export async function uploadChatFile(conversationId: string, asset: { uri: string; name: string; mimeType?: string; size?: number; file?: File }) {
  if ((asset.size ?? 0) > 10 * 1024 * 1024) throw new Error('Mỗi tệp tối đa 10 MB.');
  const body = new FormData();
  if (Platform.OS === 'web') {
    const blob = asset.file ?? await (await fetch(asset.uri)).blob();
    if (blob.size > 10 * 1024 * 1024) throw new Error('Mỗi tệp tối đa 10 MB.');
    body.append('file', blob, asset.name);
  } else body.append('file', { uri: asset.uri, name: asset.name, type: asset.mimeType || 'application/octet-stream' } as unknown as Blob);
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch(`${apiBaseUrl}/conversations/${encodeURIComponent(conversationId)}/attachments`, { method: 'POST', headers: chatHeaders(), body, signal: controller.signal });
    const payload = await response.json();
    if (!response.ok) throw new ApiError(payload.error || 'Chưa tải được tệp.', response.status);
    return payload.attachment as ChatAttachment;
  } finally { clearTimeout(timer); }
}

export async function downloadChatFile(conversationId: string, file: ChatAttachment) {
  const url = attachmentUrl(conversationId, file.id), headers = chatHeaders();
  if (Platform.OS === 'web') {
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Không tải được tệp. Kiểm tra quyền truy cập và thử lại.');
    const href = URL.createObjectURL(await response.blob()), anchor = document.createElement('a');
    anchor.href = href; anchor.download = file.name; anchor.click(); setTimeout(() => URL.revokeObjectURL(href), 30000);
  } else {
    const [{ File, Paths }, Sharing] = await Promise.all([import('expo-file-system'), import('expo-sharing')]);
    if (!await Sharing.isAvailableAsync()) throw new Error('Thiết bị chưa hỗ trợ chia sẻ tệp.');
    const name = file.name.replace(/[^\p{L}\p{N}._-]/gu, '_');
    const downloaded = await File.downloadFileAsync(url, new File(Paths.cache, `${file.id}-${name}`), { headers, idempotent: true });
    await Sharing.shareAsync(downloaded.uri, { mimeType: file.mimeType });
  }
}
