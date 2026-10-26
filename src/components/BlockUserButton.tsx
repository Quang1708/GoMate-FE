import { useFeedbackState } from '../services/feedback';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './LocalizedText';
import { blockUser } from '../services/communityService';
import { getSession } from '../services/api';
import { colors } from '../theme';
export function BlockUserButton({ userId, onBlocked }: { userId: string; onBlocked: () => void }) {
  const [confirm, setConfirm] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useFeedbackState('');
  const locked = useRef(false);
  if (getSession()?.user.id === userId) return null;
  const block = async () => { if (locked.current) return; locked.current = true; setBusy(true); setError(''); try { await blockUser(userId); onBlocked(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không chặn được tài khoản'); } finally { locked.current = false; setBusy(false); } };
  return <View style={{ gap: 12 }}><Pressable accessibilityRole="button" onPress={() => setConfirm(true)} style={{ paddingVertical: 12 }}><Text style={{ color: colors.danger }}>Chặn tài khoản này</Text></Pressable>{confirm && <View style={{ gap: 12, backgroundColor: colors.matchSoft, borderRadius: 16, padding: 16 }}><Text>Bạn sẽ không nhận tin nhắn riêng, lời mời kết bạn hoặc gợi ý hoạt động từ người này. Nhóm đã tham gia vẫn được giữ.</Text><Pressable accessibilityRole="button" disabled={busy} onPress={() => void block()}><Text style={{ color: colors.danger, fontWeight: '700' }}>{busy ? 'Đang chặn...' : 'Xác nhận chặn'}</Text></Pressable><Pressable accessibilityRole="button" disabled={busy} onPress={() => setConfirm(false)}><Text>Hủy</Text></Pressable></View>}{error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}</View>;
}
