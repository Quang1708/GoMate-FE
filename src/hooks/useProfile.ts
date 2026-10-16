import { useCallback, useEffect, useState } from 'react';
import { getProfile, Profile } from '../services/legacyProfileService';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  useEffect(() => {
    let active = true;
    getProfile().then(value => { if (active) { setProfile(value); setError(''); } })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Không tải được hồ sơ.'); });
    return () => { active = false; };
  }, [attempt]);
  return { profile, error, retry };
}
