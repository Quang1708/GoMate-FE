import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { decideActivityInvitation, listActivityInvitations, ActivityInvitation } from '../services/activityApi';
import { useRemote } from '../services/useRemote';
import { colors } from '../theme';
import { Text } from './LocalizedText';
import { PreferencesSummary } from './ActivityChoices';

export function ActivityInvitations({ onAccepted }: { onAccepted?: (activityId: string) => Promise<void> }) {
  const remote = useRemote(listActivityInvitations, []);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const lock = useRef(false), reload = remote.reload;
  useEffect(() => { const timer = setInterval(() => void reload(true), 10000); return () => clearInterval(timer); }, [reload]);
  const decide = async (invitation: ActivityInvitation, accepted: boolean) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await decideActivityInvitation(invitation.activityId, invitation.id, accepted ? 'accepted' : 'declined'); await reload(true); if (accepted) await onAccepted?.(invitation.activityId); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Chưa xử lý được lời mời.'); }
    finally { lock.current = false; setBusy(false); }
  };
  return <View style={{ gap: 12 }}>
    {!!remote.data.length && <Text style={{ fontSize: 18, fontWeight: '700' }}>Lời mời hoạt động</Text>}
    {remote.data.map(invitation => <View key={invitation.id} style={{ padding: 16, backgroundColor: colors.primarySoft, borderRadius: 18, gap: 12 }}>
      <Text style={{ fontWeight: '700' }}>{invitation.activity.title}</Text><Text>{invitation.activity.hostName} mời bạn tham gia. Bạn chỉ vào nhóm sau khi đồng ý.</Text>
      <Text>{new Date(invitation.activity.startsAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} · {invitation.activity.location}</Text>
      <PreferencesSummary value={invitation.activity.participantPreferences} />
      <Text>Đồng ý là xác nhận tham gia đúng lịch và tuân thủ điều kiện hoạt động.</Text>
      <Text>Nhóm phải còn chỗ cho ít nhất một thành viên bên ngoài; nếu không đủ chỗ, hãy nhờ host tăng sức chứa.</Text>
      {invitation.activity.requirements?.map((item, index) => <Text key={index}>• {item}</Text>)}
      <View style={{ flexDirection: 'row', gap: 20 }}><Pressable accessibilityRole="button" accessibilityLabel={'Đồng ý tham gia ' + invitation.activity.title} disabled={busy} onPress={() => void decide(invitation, true)} style={{ padding: 10 }}><Text style={{ color: colors.primary, fontWeight: '700' }}>Đồng ý tham gia</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={'Từ chối tham gia ' + invitation.activity.title} disabled={busy} onPress={() => void decide(invitation, false)} style={{ padding: 10 }}><Text>Từ chối</Text></Pressable></View>
    </View>)}
    {error || remote.error ? <><Text accessibilityRole="alert" style={{ color: colors.danger }}>{error || remote.error}</Text><Pressable onPress={() => void reload()}><Text>Thử lại lời mời</Text></Pressable></> : null}
  </View>;
}
