import { useCallback } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/LocalizedText';
import { ScreenHeader } from '../components/ScreenHeader';
import { RemoteState } from '../components/RemoteState';
import { FriendRequestButton } from '../components/FriendRequestButton';
import { BlockUserButton } from '../components/BlockUserButton';
import { PersonProfile } from '../data/people';
import { getPublicProfile, imageUrl } from '../services/profileService';
import { useRemote } from '../services/useRemote';
import { colors, layout } from '../theme';
export function MemberProfileScreen({ person, onBack }: { person: PersonProfile; onBack: () => void; mode?: 'member' | 'own-preview'; onEdit?: () => void }) {
  const load = useCallback(() => getPublicProfile(person.id), [person.id]), remote = useRemote(load, null), profile = remote.data;
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><ScreenHeader title="Hồ sơ thành viên" onBack={onBack} /><ScrollView contentContainerStyle={{ maxWidth: Math.min(layout.maxWidth, 800), width: '100%', alignSelf: 'center', padding: 18, gap: 16 }}><RemoteState {...remote} onRetry={remote.reload} />{profile && !remote.error && <>
    {profile.coverUrl && <Image source={{ uri: imageUrl(profile.coverUrl) }} style={{ width: '100%', height: 180, borderRadius: 22 }} />}
    <View style={{ backgroundColor: colors.surface, padding: 20, borderRadius: 22, gap: 13 }}>
      {profile.avatarUrl ? <Image source={{ uri: imageUrl(profile.avatarUrl) }} style={{ width: 76, height: 76, borderRadius: 38 }} /> : null}
      <Text style={{ fontSize: 25, fontWeight: '700' }}>{profile.name}{profile.age !== null ? `, ${profile.age}` : ''}</Text>
      <Text>{profile.location}</Text><Text style={{ color: colors.textSecondary, lineHeight: 22 }}>{profile.bio}</Text>
      <Text>{profile.reputation?.average ? `★ ${profile.reputation.average.toFixed(1)} · ${profile.reputation.count} đánh giá` : 'Chưa có đánh giá'}</Text>
      <Text>{profile.reputation?.completedActivities ?? 0} hoạt động tổ chức đã hoàn tất</Text>
      <Text>Sở thích: {profile.interests.join(' · ')}</Text><Text>Ngôn ngữ: {profile.languages.join(' · ')}</Text>
      {profile.companionGoal ? <Text>{profile.companionGoal}</Text> : null}{profile.contribution ? <Text>{profile.contribution}</Text> : null}
      <FriendRequestButton userId={profile.id} /><BlockUserButton userId={profile.id} onBlocked={onBack} />
    </View>
    {profile.photos.map(photo => <Image key={photo.id} source={{ uri: imageUrl(photo.url) }} style={{ width: '100%', aspectRatio: 0.9, borderRadius: 22 }} />)}
  </>}</ScrollView></SafeAreaView>;
}
