import { createContext, ReactNode, useContext } from 'react';
import { getProfile, UserProfile } from './profileService';
import { useRemote } from './useRemote';

const ProfileContext = createContext<{ profile: UserProfile | null; loading: boolean; error: string; reload: () => Promise<void>; update: (profile: UserProfile) => void } | null>(null);
export function ProfileProvider({ children }: { children: ReactNode }) {
  const remote = useRemote<UserProfile | null>(getProfile, null);
  return <ProfileContext.Provider value={{ profile: remote.data, loading: remote.loading, error: remote.error, reload: remote.reload, update: remote.setData }}>{children}</ProfileContext.Provider>;
}
export function useProfile() { const value = useContext(ProfileContext); if (!value) throw new Error('ProfileProvider missing'); return value; }
