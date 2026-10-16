import { useState } from 'react';
import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { imageUrl } from '../services/profileService';
export function ProfileAvatar({ uri, size = 36, name = 'Thành viên' }: { uri?: string | null; size?: number; name?: string }) {
  const [failed, setFailed] = useState('');
  return uri && failed !== uri ? <Image accessibilityLabel={`Ảnh đại diện ${name}`} source={{ uri: imageUrl(uri) }} onError={() => setFailed(uri)} style={{ width: size, height: size, borderRadius: size / 2 }} /> : <View accessibilityLabel={`Ảnh đại diện mặc định ${name}`} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#E4E6EB', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}><Ionicons name="person" size={size * 0.8} color="#9DA3AE" style={{ marginTop: size * 0.16 }} /></View>;
}
