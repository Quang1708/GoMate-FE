import { BlockUserButton } from './BlockUserButton';
import { FriendRequestButton } from './FriendRequestButton';
import { useCallback } from 'react';
import { Image, Modal, Pressable, ScrollView, View } from 'react-native';
import { Text } from './LocalizedText';
import { RemoteState } from './RemoteState';
import { getPublicProfile, imageUrl, PublicProfile } from '../services/profileService';
import { useRemote } from '../services/useRemote';
import { colors } from '../theme';

export function MemberProfileModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const loader = useCallback(() => getPublicProfile(userId), [userId]);
  const remote = useRemote<PublicProfile | null>(loader, null);
  const profile = remote.data;
  return <Modal transparent animationType="fade" visible onRequestClose={onClose}><View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 }}>
    <View style={{ alignSelf: 'center', width: '100%', maxWidth: 480, maxHeight: '90%', backgroundColor: colors.surface, borderRadius: 22, overflow: 'hidden' }}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 12 }}>
        <Pressable onPress={onClose}><Text style={{ color: colors.primary }}>Đóng hồ sơ</Text></Pressable>
        <RemoteState {...remote} onRetry={remote.reload} />
        {profile && !remote.loading && !remote.error && <>
          {profile.coverUrl ? <Image source={{ uri: imageUrl(profile.coverUrl) }} style={{ width: '100%', height: 140, borderRadius: 14 }} /> : null}
          {profile.avatarUrl ? <Image source={{ uri: imageUrl(profile.avatarUrl) }} style={{ width: 80, height: 80, borderRadius: 40 }} /> : null}
          <Text style={{ fontSize: 23, fontWeight: '700' }}>{profile.name}{profile.age !== null ? `, ${profile.age}` : ''}</Text><Text>{profile.location}</Text>
          {profile.occupation ? <Text>{profile.occupation}</Text> : null}<Text>{profile.bio}</Text>
          <Text>Sở thích: {profile.interests.join(', ')}</Text><Text>Ngôn ngữ: {profile.languages.join(', ')}</Text>
          {profile.companionGoal ? <Text>Đồng hành: {profile.companionGoal}</Text> : null}
          {profile.availableTimes?.length ? <Text>Thường rảnh: {profile.availableTimes.join(' · ')}</Text> : null}
          {profile.school || profile.education ? <Text>{[profile.school, profile.education].filter(Boolean).join(' · ')}</Text> : null}
          {profile.activityWish ? <Text>Muốn thử: {profile.activityWish}</Text> : null}
          {profile.contribution ? <Text>Có thể chia sẻ: {profile.contribution}</Text> : null}
          {(profile.photos || []).map(photo => <Image key={photo.id} source={{ uri: imageUrl(photo.url) }} style={{ width: '100%', aspectRatio: 0.9, borderRadius: 18 }} />)}
          <FriendRequestButton userId={profile.id} /><BlockUserButton userId={profile.id} onBlocked={onClose} />
          {profile.demo ? <Text style={{ color: colors.textMuted }}>Hồ sơ demo hư cấu · ảnh minh họa</Text> : null}
        </>}
      </ScrollView>
    </View>
  </View></Modal>;
}
