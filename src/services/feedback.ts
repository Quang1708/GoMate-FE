import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

type Listener = (message: string) => void;
const listeners = new Set<Listener>();
export function subscribeFeedback(listener: Listener) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function useFeedbackState<T extends string | undefined>(initial: T) {
  type Value = T extends string ? string : string | undefined;
  const [value, setValue] = useState<Value>(initial as unknown as Value);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const setFeedback: Dispatch<SetStateAction<Value>> = useCallback(next => {
    if (!alive.current) return;
    setValue(next);
    if (typeof next === 'string' && next.trim()) listeners.forEach(listener => listener(next));
  }, []);
  return [value, setFeedback] as const;
}
