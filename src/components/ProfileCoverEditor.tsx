import { useFeedbackState } from '../services/feedback';
import { useRef, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './LocalizedText';
import { imageUrl, removeCover, uploadCover } from '../services/profileService';
import { useProfile } from '../services/ProfileContext';
import { colors } from '../theme';
export function ProfileCoverEditor({ onBusyChange }: { onBusyChange: (busy: boolean) => void }) {
  const { profile, update } = useProfile();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false), [error, setError] = useFeedbackState(''), [confirm, setConfirm] = useState(false);
  const run = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); onBusyChange(true); setError('');
    try { await action(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không lưu được ảnh bìa'); }
    finally { lock.current = false; setBusy(false); onBusyChange(false); }
  };
  const pick = () => void run(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [8, 3], mediaTypes: ['images'], quality: 0.9, base64: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64 || (asset.fileSize ?? 0) > 10 * 1024 * 1024 || asset.base64.length > 13981016) throw new Error('Ảnh bìa tối đa 10 MB.');
    update(await uploadCover(asset.base64));
  });
  return <View style={{ gap: 12 }}><Text style={{ fontSize: 18, fontWeight: '700' }}>Ảnh bìa hồ sơ</Text>
    {profile?.coverUrl ? <Image source={{ uri: imageUrl(profile.coverUrl) }} style={{ width: '100%', aspectRatio: 8 / 3, borderRadius: 16 }} /> : <View style={{ height: 130, backgroundColor: colors.primarySoft, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="image-outline" size={36} color={colors.primary} /></View>}
    <View style={{ flexDirection: 'row', gap: 24 }}><Pressable accessibilityRole="button" disabled={busy} onPress={pick}><Text style={{ color: colors.primary }}>{busy ? 'Đang lưu...' : profile?.coverUrl ? 'Đổi ảnh bìa' : 'Thêm ảnh bìa'}</Text></Pressable>{profile?.coverUrl && <Pressable accessibilityRole="button" disabled={busy} onPress={() => setConfirm(true)}><Text style={{ color: colors.danger }}>Xóa ảnh bìa</Text></Pressable>}</View>
    {confirm && <View style={{ gap: 12 }}><Text>Xóa ảnh bìa khỏi hồ sơ?</Text><Pressable accessibilityRole="button" disabled={busy} onPress={() => void run(async () => { update(await removeCover()); setConfirm(false); })}><Text style={{ color: colors.danger }}>Xác nhận xóa ảnh bìa</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setConfirm(false)}><Text>Giữ lại</Text></Pressable></View>}
    {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
  </View>;
}
