import { useFeedbackState } from '../services/feedback';
import { ComponentProps, useCallback, useEffect, useRef, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './LocalizedText';
import { RemoteState } from './RemoteState';
import { GradientButton } from './GradientButton';
import { ActivityLifecyclePanel } from './ActivityLifecyclePanel';
import { BusinessIdentity } from './BusinessIdentity';
import { Activity } from '../data/activities';
import { ActivityDto, decideRequest, deleteActivity, getActivity, listRequests, toActivity } from '../services/activityApi';
import { getSession } from '../services/api';
import { useRemote } from '../services/useRemote';
import { CreateActivityScreen } from '../screens/CreateActivityScreen';
import { colors } from '../theme';

type Icon = ComponentProps<typeof Ionicons>['name'];
type Props = { activityId: string; onPlan?: () => void; onOpenGroup?: (activity: Activity) => void; onMembers?: (activity: Activity) => void; onProgress?: (activity: Activity) => void; onDeleted: () => void; onChanged?: (activity: ActivityDto) => void };

export function ActivityManagementPanel({ activityId, onPlan, onOpenGroup, onMembers, onProgress, onDeleted, onChanged }: Props) {
  const load = useCallback(async () => {
    const activity = await getActivity(activityId);
    if (activity.hostId !== getSession()?.user.id) throw new Error('Chỉ host có quyền quản lý hoạt động.');
    return { activity, requests: await listRequests(activityId) };
  }, [activityId]);
  const remote = useRemote(load, null);
  const [editing, setEditing] = useState(false), [error, setError] = useFeedbackState(''), [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 10000); return () => clearInterval(timer); }, []);
  const [confirmation, setConfirmation] = useState<'delete' | null>(null);
  const locked = useRef(false);
  const row = remote.data?.activity;
  const run = async (action: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try { await action(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không lưu được thay đổi.'); }
    finally { locked.current = false; setBusy(false); }
  };
  const refresh = async () => { await remote.reload(); const fresh = await getActivity(activityId); onChanged?.(fresh); };
  const editable = row?.status === 'published' && new Date(row.startsAt).getTime() > now;
  const decide = (requestId: string, status: 'approved' | 'rejected') => void run(async () => { await decideRequest(activityId, requestId, status); await refresh(); });
  const confirm = () => void run(async () => {
    if (!row || !confirmation) return;
    if (confirmation === 'delete') { await deleteActivity(activityId); setConfirmation(null); onDeleted(); return; }
  });
  const dialog = confirmation && {
    delete: ['Xóa hoạt động?', 'Thành viên sẽ không còn truy cập được hoạt động và chat nhóm. Hành động này không thể hoàn tác.'],
  }[confirmation];
  return <View style={styles.panel}>
    <RemoteState {...remote} onRetry={remote.reload} />
    {row && <>
      <ActivityLifecyclePanel activity={row} onPlan={onPlan} onChanged={fresh => { remote.setData(data => data ? { ...data, activity: fresh } : data); onChanged?.(fresh); }} onProgress={fresh => onProgress?.(toActivity(fresh))} />
      {row.organizerType === 'business' && <View style={styles.card}><BusinessIdentity activity={toActivity(row)} details /><Text style={styles.body}>Lịch và ưu đãi đã công bố. Người tham gia cần tự đăng ký và được doanh nghiệp xác nhận; không thêm bạn bè hoặc giữ chỗ ngoài danh sách đăng ký.</Text></View>}
      <View style={styles.overview}><View style={styles.headingRow}><View style={styles.statusDot} /><Text style={styles.eyebrow}>{row.status === 'expired' ? 'ĐÃ HẾT HẠN' : row.status === 'completed' ? 'ĐÃ KẾT THÚC' : row.status === 'in-progress' ? 'ĐANG DIỄN RA' : 'SẮP DIỄN RA'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Làm mới quản lý" onPress={() => void remote.reload()}><Ionicons name="refresh-outline" size={19} color={colors.primary} /></Pressable></View><Text style={styles.title}>Cùng nhóm sẵn sàng lên đường</Text><View style={styles.stats}><View style={styles.stat}><Text style={styles.statValue}>{row.memberCount}/{row.maxParticipants}</Text><Text style={styles.muted}>Thành viên</Text></View><View style={styles.stat}><Text style={styles.statValue}>{remote.data?.requests.length || 0}</Text><Text style={styles.muted}>Chờ duyệt</Text></View><View style={styles.stat}><Ionicons name={row.scheduleConfirmedAt ? 'calendar' : 'calendar-outline'} size={23} color={colors.primary} /><Text style={styles.muted}>{row.scheduleConfirmedAt ? 'Đã chốt lịch' : 'Chưa chốt lịch'}</Text></View></View></View>
      <View style={styles.card}>
        {onOpenGroup && <ManagementRow icon="chatbubbles-outline" title="Mở chat nhóm" detail="Trao đổi cùng thành viên ngay từ bây giờ" onPress={() => onOpenGroup(toActivity(row))} />}
        {onMembers && <ManagementRow icon="people-outline" title="Quản lý thành viên" detail="Thêm bạn bè, xem hồ sơ và quản lý nhóm" onPress={() => onMembers(toActivity(row))} />}
        {editable && row.organizerType !== 'business' && <ManagementRow icon="create-outline" title="Chỉnh sửa hoạt động" detail="Cập nhật bài đăng, thời gian và kế hoạch" disabled={busy} onPress={() => setEditing(true)} />}
      </View>
      <View style={styles.headingRow}><Text style={styles.sectionTitle}>Yêu cầu tham gia</Text><View style={styles.count}><Text style={{ color: colors.primary, fontWeight: '700' }}>{remote.data?.requests.length || 0}</Text></View></View>
      {!remote.data?.requests.length ? <View style={[styles.card, styles.empty]}><View style={styles.emptyIcon}><Ionicons name="people-outline" size={26} color={colors.primary} /></View><Text style={styles.sectionTitle}>Chưa có yêu cầu mới</Text><Text style={[styles.muted, { textAlign: 'center' }]}>Khi có người muốn đồng hành, bạn có thể xem và duyệt tại đây.</Text></View> : remote.data.requests.map(request => <View style={styles.request} key={request.id}><View style={styles.initial}><Text style={{ color: colors.primary, fontWeight: '800' }}>{request.name.slice(0, 1).toUpperCase()}</Text></View><View style={{ flex: 1, gap: 4 }}><Text style={styles.sectionTitle}>{request.name}</Text><Text style={styles.muted}>Muốn tham gia nhóm</Text><View style={styles.requestActions}><Pressable accessibilityRole="button" disabled={busy || !editable} onPress={() => decide(request.id, 'rejected')} style={styles.secondary}><Text style={{ color: colors.textSecondary }}>Từ chối</Text></Pressable><Pressable accessibilityRole="button" disabled={busy || !editable || row.memberCount >= row.maxParticipants} onPress={() => decide(request.id, 'approved')} style={styles.approve}><Text style={{ color: colors.white, fontWeight: '700' }}>Duyệt</Text></Pressable></View>{!editable || row.memberCount >= row.maxParticipants ? <Text style={styles.muted}>{!editable ? 'Hoạt động không còn nhận thành viên.' : 'Nhóm đã đủ chỗ.'}</Text> : null}</View></View>)}
      <View style={styles.card}><ManagementRow icon="trash-outline" title="Xóa hoạt động" detail="Gỡ bài đăng và đóng quyền truy cập nhóm" destructive disabled={busy} onPress={() => setConfirmation('delete')} /></View>
    </>}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <Modal visible={Boolean(confirmation)} transparent animationType="fade" onRequestClose={() => { if (!busy) setConfirmation(null); }}><View style={styles.overlay}><View style={styles.dialog}><Ionicons name={confirmation === 'delete' ? 'trash-outline' : 'calendar-outline'} size={30} color={confirmation === 'delete' ? colors.danger : colors.primary} /><Text style={styles.title}>{dialog?.[0]}</Text><Text style={styles.body}>{dialog?.[1]}</Text>{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}<GradientButton disabled={busy} label={busy ? 'Đang xử lý...' : 'Xác nhận'} onPress={confirm} /><Pressable accessibilityRole="button" disabled={busy} onPress={() => { setConfirmation(null); setError(''); }} style={styles.cancel}><Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Để sau</Text></Pressable></View></View></Modal>
    <Modal visible={editing} animationType="slide" onRequestClose={() => setEditing(false)}><SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>{row && <CreateActivityScreen key={row.id} initialActivity={row} onCancel={() => setEditing(false)} onCreated={() => { setEditing(false); void refresh(); }} />}</SafeAreaView></Modal>
  </View>;
}

function ManagementRow({ icon, title, detail, onPress, destructive, disabled }: { icon: Icon; title: string; detail: string; onPress: () => void; destructive?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.action, disabled && { opacity: 0.5 }]}><View style={[styles.actionIcon, destructive && { backgroundColor: colors.matchSoft }]}><Ionicons name={icon} size={22} color={destructive ? colors.danger : colors.primary} /></View><View style={{ flex: 1, gap: 5 }}><Text style={[styles.sectionTitle, destructive && { color: colors.danger }]}>{title}</Text><Text style={styles.muted}>{detail}</Text></View><Ionicons name="chevron-forward" color={colors.textMuted} size={18} /></Pressable>;
}

export function ManagedActivityThumbnail({ activity, selected, onPress }: { activity: Activity; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.thumbnail, selected && { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}><Image source={activity.image} style={styles.thumbnailImage} /><View style={{ flex: 1, gap: 5 }}><Text numberOfLines={2} style={styles.sectionTitle}>{activity.title}</Text><Text style={styles.muted}>{activity.members} thành viên</Text></View>{selected && <Ionicons name="checkmark-circle" color={colors.primary} size={20} />}</Pressable>;
}

const styles = StyleSheet.create({
  panel: { gap: 18 }, overview: { padding: 20, gap: 16, backgroundColor: colors.primarySoft, borderRadius: 24 }, headingRow: { flexDirection: 'row', alignItems: 'center', gap: 9 }, statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary }, eyebrow: { flex: 1, color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1 }, title: { color: colors.text, fontSize: 22, fontWeight: '800', lineHeight: 29 }, stats: { flexDirection: 'row', gap: 8 }, stat: { flex: 1, gap: 7 }, statValue: { fontSize: 22, fontWeight: '800', color: colors.text }, muted: { color: colors.textMuted, fontSize: 12, lineHeight: 18 }, body: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 }, card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 16, gap: 14 }, sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '700' }, action: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, minHeight: 64 }, actionIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }, success: { padding: 12, borderRadius: 12, backgroundColor: '#ECF9F2', flexDirection: 'row', alignItems: 'center', gap: 8 }, count: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4, backgroundColor: colors.primarySoft }, empty: { alignItems: 'center', paddingVertical: 28 }, emptyIcon: { padding: 16, borderRadius: 30, backgroundColor: colors.primarySoft }, initial: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }, request: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, requestActions: { flexDirection: 'row', gap: 10, marginTop: 8 }, secondary: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: colors.background, borderRadius: 12 }, approve: { paddingVertical: 10, paddingHorizontal: 24, backgroundColor: colors.primary, borderRadius: 12 }, error: { padding: 12, color: colors.danger, backgroundColor: colors.matchSoft, borderRadius: 12 }, overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#19152B66', padding: 24 }, dialog: { width: '100%', maxWidth: 430, padding: 24, gap: 18, borderRadius: 26, backgroundColor: colors.surface }, cancel: { alignItems: 'center', padding: 10 }, thumbnail: { width: 265, flexDirection: 'row', gap: 12, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center' }, thumbnailImage: { width: 52, height: 64, borderRadius: 12 },
});
