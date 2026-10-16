import { Image, Pressable, View } from 'react-native';
import { Text } from './LocalizedText';
import { useProfile } from '../services/ProfileContext';
import { imageUrl } from '../services/profileService';
import { colors } from '../theme';
export function UserAvatar({ onPress, size = 44 }: { onPress?: () => void; size?: number }) {
  const { profile } = useProfile();
  const content = profile?.avatarUrl ? <Image source={{ uri: imageUrl(profile.avatarUrl) }} style={{ width: size, height: size, borderRadius: size / 2 }} /> : <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: colors.primary, fontSize: size * 0.4, fontWeight: '700' }}>{profile?.name?.charAt(0) || '?'}</Text></View>;
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel="Avatar của tôi" onPress={onPress}>{content}</Pressable> : content;
}
