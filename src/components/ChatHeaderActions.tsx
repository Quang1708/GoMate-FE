import { ComponentProps, useState } from 'react';
import { Modal, Platform, Pressable, Share, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './LocalizedText';
import { apiBaseUrl } from '../services/api';
import { colors } from '../theme';

type Props = { sharePath: string; onShared: () => void; onRefresh: () => void; onPlan?: () => void; onMembers?: () => void; onManage?: () => void };
export function ChatHeaderActions({ sharePath, onShared, onRefresh, onPlan, onMembers, onManage }: Props) {
  const [open, setOpen] = useState(false), [message, setMessage] = useState(''), [fallbackLink, setFallbackLink] = useState('');
  const action = (callback: () => void) => { setOpen(false); callback(); };
  const share = async () => {
    const origin = Platform.OS === 'web' ? window.location.origin : apiBaseUrl.replace(/\/api\/?$/, '');
    const url = `${origin}/#${sharePath}`;
    try {
      if (Platform.OS === 'web') { await navigator.clipboard.writeText(url); setMessage('Đã sao chép liên kết'); }
      else { await Share.share({ message: url }); setOpen(false); }
    } catch { setFallbackLink(url); setMessage('Chọn và sao chép liên kết bên dưới.'); }
  };
  const items: { label: string; icon: ComponentProps<typeof Ionicons>['name']; callback: () => void }[] = [
    { label: 'Nội dung đã chia sẻ', icon: 'albums-outline', callback: onShared },
    ...(onPlan ? [{ label: 'Kế hoạch của nhóm', icon: 'calendar-outline' as const, callback: onPlan }] : []),
    ...(onMembers ? [{ label: 'Thành viên trong nhóm', icon: 'people-outline' as const, callback: onMembers }] : []),
    ...(onManage ? [{ label: 'Quản lý hoạt động', icon: 'options-outline' as const, callback: onManage }] : []),
    { label: 'Làm mới cuộc trò chuyện', icon: 'refresh-outline', callback: onRefresh },
  ];
  return <View style={styles.actions}>
    <Pressable accessibilityRole="button" accessibilityLabel="Xem ảnh, tệp và liên kết đã gửi" onPress={onShared} style={styles.icon}><Ionicons name="albums-outline" color={colors.primary} size={22} /></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Tùy chọn cuộc trò chuyện" onPress={() => { setMessage(''); setFallbackLink(''); setOpen(true); }} style={styles.icon}><Ionicons name="options-outline" color={colors.text} size={23} /></Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}><Pressable style={styles.overlay} onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel="Đóng tùy chọn cuộc trò chuyện"><Pressable style={styles.sheet} onPress={event => event.stopPropagation()}>
      <View style={styles.heading}><Text style={styles.title}>Cuộc trò chuyện</Text><Pressable accessibilityRole="button" accessibilityLabel="Đóng menu" style={styles.icon} onPress={() => setOpen(false)}><Ionicons name="close" size={23} color={colors.textMuted} /></Pressable></View>
      {items.map(item => <Pressable accessibilityRole="button" key={item.label} style={styles.row} onPress={() => action(item.callback)}><View style={styles.tile}><Ionicons name={item.icon} size={21} color={colors.primary} /></View><Text style={styles.label}>{item.label}</Text><Ionicons name="chevron-forward" color={colors.textMuted} size={17} /></Pressable>)}
      <Pressable accessibilityRole="button" style={styles.row} onPress={() => void share()}><View style={styles.tile}><Ionicons name="share-outline" size={21} color={colors.primary} /></View><Text style={styles.label}>{Platform.OS === 'web' ? 'Sao chép liên kết' : 'Chia sẻ liên kết'}</Text></Pressable>
      {message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}{fallbackLink ? <Text selectable style={styles.message}>{fallbackLink}</Text> : null}
    </Pressable></Pressable></Modal>
  </View>;
}
const styles = StyleSheet.create({ actions: { flexDirection: 'row', gap: 2 }, icon: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' }, overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#171A2B55' }, sheet: { width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 30, gap: 4 }, heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }, title: { fontSize: 19, fontWeight: '800', color: colors.text }, row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, minHeight: 52 }, tile: { width: 37, height: 37, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, label: { fontSize: 14, color: colors.text, flex: 1 }, message: { fontSize: 12, color: colors.primary, padding: 10 } });
