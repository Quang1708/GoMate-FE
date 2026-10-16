import { fetch as streamFetch } from 'expo/fetch';
import { apiBaseUrl, getSession } from './api';

// Headers keep session tokens out of URLs, browser history and server access logs.
export function watchConversation(id: string, onUpdate: () => void, onStatus: (connected: boolean) => void) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined, delay = 1000;
  const connect = async () => {
    try {
      const token = getSession()?.accessToken;
      if (!token || controller.signal.aborted) return;
      const response = await streamFetch(`${apiBaseUrl}/conversations/${encodeURIComponent(id)}/events`, { headers: { Accept: 'text/event-stream', Authorization: `Bearer ${token}` }, signal: controller.signal });
      if (!response.ok || !response.body) throw new Error('Stream unavailable');
      onStatus(true); delay = 1000;
      const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = '';
      while (!controller.signal.aborted) {
        const { value, done } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true });
        if (buffer.length > 256000) throw new Error('Invalid event stream');
        let end: number;
        while ((end = buffer.indexOf('\n\n')) >= 0) {
          const event = buffer.slice(0, end); buffer = buffer.slice(end + 2);
          if (event.includes('event: conversation.updated') || event.includes('event: access-revoked')) onUpdate();
        }
      }
    } catch { /* Polling remains available during disconnects. */ }
    if (!controller.signal.aborted) { onStatus(false); timer = setTimeout(() => void connect(), delay); delay = Math.min(delay * 2, 15000); }
  };
  void connect();
  return () => { controller.abort(); clearTimeout(timer); };
}
