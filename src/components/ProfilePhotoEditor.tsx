import { useFeedbackState } from '../services/feedback';
import { useRef, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './LocalizedText';
import { arrangeProfilePhotos, imageUrl, uploadProfilePhoto } from '../services/profileService';
import { useProfile } from '../services/ProfileContext';
import { colors } from '../theme';

export function ProfilePhotoEditor({ onBusyChange }: { onBusyChange: (busy: boolean) => void }) {
  const { profile, update } = useProfile();
  const photos = profile?.photos ?? [];
  const [busy, setBusy] = useState(false), [error, setError] = useFeedbackState('');
  const lock = useRef(false);
  const run = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); onBusyChange(true); setError('');
    try { await action(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không lưu được ảnh hồ sơ'); }
    finally { lock.current = false; setBusy(false); onBusyChange(false); }
  };
  const pick = () => void run(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, selectionLimit: 6 - photos.length, mediaTypes: ['images'], quality: 0.9, base64: true });
    if (result.canceled) return;
    if (result.assets.length + photos.length > 6) throw new Error('Chọn tối đa 6 ảnh hồ sơ.');
    for (const asset of result.assets) {
      const bytes = asset.base64 ? asset.base64.length * 3 / 4 - (asset.base64.endsWith('==') ? 2 : asset.base64.endsWith('=') ? 1 : 0) : Infinity;
      if (bytes > 10 * 1024 * 1024 || (asset.fileSize ?? 0) > 10 * 1024 * 1024) throw new Error('Mỗi ảnh tối đa 10 MB.');
    }
    for (const asset of result.assets) update(await uploadProfilePhoto(asset.base64!));
  });
  const move = (index: number, direction: number) => void run(async () => {
    const ordered = photos.map(photo => photo.id); [ordered[index], ordered[index + direction]] = [ordered[index + direction], ordered[index]];
    update(await arrangeProfilePhotos(ordered));
  });
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  return <View style={{ gap: 12 }}><Text style={styles.title}>Album ảnh của bạn</Text><Text style={styles.hint}>Chia sẻ những chuyến đi, hoạt động và khoảnh khắc yêu thích. Tối đa 6 ảnh, mỗi ảnh 10 MB.</Text>
    <View style={styles.grid}>{photos.map((photo, index) => <View key={photo.id} style={styles.tile}><Pressable accessibilityRole="button" accessibilityLabel={`Xem ảnh hồ sơ ${index + 1}`} onPress={() => setViewIndex(index)} style={{ flex: 1 }}><Image source={{ uri: imageUrl(photo.url) }} style={styles.photo} /></Pressable><Pressable disabled={busy} accessibilityRole="button" accessibilityLabel={`Xóa ảnh hồ sơ ${index + 1}`} style={styles.remove} onPress={() => setRemoveId(photo.id)}><Ionicons name="close" size={18} color={colors.text} /></Pressable>
      <View style={styles.order}>{index > 0 && <Pressable disabled={busy} accessibilityRole="button" accessibilityLabel={`Đưa ảnh ${index + 1} lên trước`} onPress={() => move(index, -1)}><Ionicons name="arrow-back" size={21} color={colors.white} /></Pressable>}<Text style={{ color: colors.white }}>{index + 1}</Text>{index < photos.length - 1 && <Pressable disabled={busy} accessibilityRole="button" accessibilityLabel={`Đưa ảnh ${index + 1} về sau`} onPress={() => move(index, 1)}><Ionicons name="arrow-forward" size={21} color={colors.white} /></Pressable>}</View>
    </View>)}{photos.length < 6 && <Pressable disabled={busy} accessibilityRole="button" accessibilityLabel="Thêm ảnh hồ sơ" onPress={pick} style={styles.add}><Ionicons name="add" size={28} color={colors.primary} /><Text style={{ color: colors.primary }}>Thêm ảnh</Text></Pressable>}</View>
    {viewIndex !== null && photos[viewIndex] && <Modal visible transparent animationType="fade" onRequestClose={() => setViewIndex(null)}><View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', justifyContent: 'center', padding: 24 }}><Pressable accessibilityRole="button" accessibilityLabel="Đóng ảnh" onPress={() => setViewIndex(null)} style={{ padding: 16 }}><Text style={{ color: colors.white }}>Đóng · {viewIndex + 1}/{photos.length}</Text></Pressable><Image resizeMode="contain" source={{ uri: imageUrl(photos[viewIndex].url) }} style={{ flex: 1, width: '100%' }} /><View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}><Pressable accessibilityRole="button" disabled={viewIndex === 0} onPress={() => setViewIndex(viewIndex - 1)}><Text style={{ color: viewIndex === 0 ? colors.textMuted : colors.white }}>Ảnh trước</Text></Pressable><Pressable accessibilityRole="button" disabled={viewIndex === photos.length - 1} onPress={() => setViewIndex(viewIndex + 1)}><Text style={{ color: viewIndex === photos.length - 1 ? colors.textMuted : colors.white }}>Ảnh sau</Text></Pressable></View></View></Modal>}
    {busy && <Text style={styles.hint}>Đang lưu ảnh...</Text>}{error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
    {removeId && <View style={{ gap: 12 }}><Text>Xóa ảnh này khỏi hồ sơ?</Text><View style={{ flexDirection: 'row', gap: 20 }}><Pressable disabled={busy} accessibilityRole="button" onPress={() => setRemoveId(null)}><Text>Giữ lại</Text></Pressable><Pressable disabled={busy} accessibilityRole="button" onPress={() => void run(async () => { update(await arrangeProfilePhotos(photos.filter(photo => photo.id !== removeId).map(photo => photo.id))); setRemoveId(null); })}><Text style={{ color: colors.danger }}>Xác nhận xóa ảnh</Text></Pressable></View></View>}
  </View>;
}
const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '700', color: colors.text }, hint: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, tile: { width: '30.5%', maxWidth: 190, aspectRatio: 0.8, borderRadius: 16, overflow: 'hidden' }, photo: { width: '100%', height: '100%' }, add: { width: '30.5%', maxWidth: 190, aspectRatio: 0.8, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', gap: 8 }, remove: { position: 'absolute', right: 5, top: 5, backgroundColor: colors.surface, borderRadius: 18, padding: 5 }, order: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.45)' },
});
