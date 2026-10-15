import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

// Hash URLs also work with static hosting; history entries are scoped to the signed-in user.
export function useWebNavigation<T>(initial: T, encode: (value: T) => string, decode: (path: string) => T, owner: string, restore?: (value: T) => T) {
  const read = useCallback(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return initial;
    const path = window.location.hash.slice(1);
    try {
      const saved = window.history.state?.gomate;
      if (saved?.owner === owner && saved.path === path) return restore ? restore(saved.value as T) : saved.value as T;
      const cached = JSON.parse(sessionStorage.getItem(`gomate.route.${owner}.${path}`) || 'null');
      if (cached) return restore ? restore(cached as T) : cached as T;
    } catch { /* A disabled storage area must not break navigation. */ }
    return decode(path);
  }, [initial, decode, owner, restore]);
  const [value, update] = useState<T>(read);
  const current = useRef(value);
  const write = useCallback((next: T, replace = false) => {
    current.current = next; update(next);
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const path = encode(next);
    try { sessionStorage.setItem(`gomate.route.${owner}.${path}`, JSON.stringify(next)); } catch { /* Optional cache. */ }
    const state = { ...window.history.state, gomate: { owner, path, value: next } };
    if (replace || window.location.hash === `#${path}`) window.history.replaceState(state, '', `#${path}`);
    else window.history.pushState(state, '', `#${path}`);
  }, [encode, owner]);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    write(current.current, true);
    const restore = () => { const next = read(); current.current = next; update(next); };
    window.addEventListener('popstate', restore);
    window.addEventListener('hashchange', restore);
    return () => { window.removeEventListener('popstate', restore); window.removeEventListener('hashchange', restore); };
  }, [read, write]);
  return [value, write] as const;
}
