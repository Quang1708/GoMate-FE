import { useFeedbackState } from '../services/feedback';
import { GroupCompanions } from '../components/CompanionCards';
import { AddActivityFriends } from '../components/AddActivityFriends';
import { useCallback, useRef, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/LocalizedText';
import { RemoteState } from '../components/RemoteState';
import { ScreenHeader } from '../components/ScreenHeader';
import { Activity } from '../data/activities';
import { getSession } from '../services/api';
import { getActivity, Member, ActivityDto, cancelRequest, leaveActivity, listJoined, listMembers, listMyRequests, listOwned, removeMember, toActivity } from '../services/activityApi';
import { useRemote } from '../services/useRemote';
import { colors, layout } from '../theme';
import { imageUrl } from '../services/profileService';
import { MemberProfileModal } from '../components/MemberProfileModal';

function useAction() {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useFeedbackState('');
  const run = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await action(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Yêu cầu thất bại'); }
    finally { lock.current = false; setBusy(false); }
  };
  return { busy, error, run };
}

function Button({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={[styles.button, disabled && { opacity: 0.5 }]}><Text style={styles.buttonText}>{label}</Text></Pressable>;
}

function ActivityRow({ activity, onPress, children }: { activity: Activity; onPress: () => void; children?: React.ReactNode }) {
  return <View style={styles.card}><Pressable onPress={onPress} style={styles.row}>
    <Image source={activity.image} style={styles.image} /><View style={styles.copy}><Text style={styles.title}>{activity.title}</Text><Text>{activity.time}</Text><Text>{activity.location}</Text><Text>Host: {activity.host} · {activity.members}</Text></View>
  </Pressable>{children}</View>;
}

export function PendingActivitiesScreen({ onBack, onOpen }: { onBack: () => void; onOpen: (activity: Activity) => void }) {
  const loader = useCallback(() => listMyRequests('pending'), []);
  const remote = useRemote(loader, []);
  const action = useAction();
  return <SafeAreaView style={styles.safe}><ScreenHeader onBack={onBack} title="Yêu cầu tham gia" subtitle="Đang chờ host duyệt" />
    <ScrollView refreshControl={<RefreshControl refreshing={remote.loading} onRefresh={remote.reload} />} contentContainerStyle={styles.page}>
      <RemoteState {...remote} empty={!remote.data.length} onRetry={remote.reload} />
      {action.error ? <Text>{action.error}</Text> : null}
      {!remote.loading && !remote.error && remote.data.map(request => request.activity && <ActivityRow key={request.id} activity={toActivity(request.activity, request.status)} onPress={() => onOpen(toActivity(request.activity!, request.status))}>
        <Button disabled={action.busy} label="Hủy yêu cầu" onPress={() => void action.run(async () => { await cancelRequest(request.activityId!); await remote.reload(); })} />
      </ActivityRow>)}
    </ScrollView></SafeAreaView>;
}

export function MyActivitiesScreen({ onBack, onOpenGroup, onOpenPending }: { onBack: () => void; onOpenGroup: (activity: Activity) => void; onOpenPending?: () => void }) {
  const [now] = useState(Date.now);
  const [tab, setTab] = useState<'joined' | 'owned' | 'past'>('joined');
  const loader = useCallback(async () => { const [joined, owned] = await Promise.all([listJoined(), listOwned()]); return { joined, owned }; }, []);
  const remote = useRemote(loader, { joined: [], owned: [] });
  const isPast = (item: typeof remote.data.joined[number]) => item.status === 'completed' || Boolean(item.endsAt && new Date(item.endsAt).getTime() <= now);
  const rows = tab === 'past' ? [...remote.data.joined, ...remote.data.owned].filter(isPast) : remote.data[tab].filter(item => !isPast(item));
  return <SafeAreaView style={styles.safe}><ScreenHeader onBack={onBack} title="Hoạt động của tôi" />
    <ScrollView refreshControl={<RefreshControl refreshing={remote.loading} onRefresh={remote.reload} />} contentContainerStyle={styles.page}>
      <View style={styles.tabs}>{([['joined', 'Đã tham gia'], ['owned', 'Tôi tổ chức'], ['past', 'Đã qua']] as const).map(([key, label]) => <Button key={key} label={`${tab === key ? '✓ ' : ''}${label}`} onPress={() => setTab(key)} />)}</View>
      {onOpenPending && <Button label="Yêu cầu đang chờ duyệt" onPress={onOpenPending} />}
      <RemoteState {...remote} empty={!rows.length} onRetry={remote.reload} />
      {!remote.loading && !remote.error && rows.map(row => <ActivityRow key={row.id} activity={toActivity(row)} onPress={() => onOpenGroup(toActivity(row))} />)}
    </ScrollView></SafeAreaView>;
}

export function MembersPanel({ activity, onLeft }: { activity: Activity; onLeft: () => void }) {
  const [now] = useState(Date.now);
  const loader = useCallback(async () => { const [members, latest] = await Promise.all([listMembers(activity.id), getActivity(activity.id)]); return { members, latest }; }, [activity.id]);
  const snapshot = useRemote<{ members: Member[]; latest: ActivityDto | null }>(loader, { members: [], latest: null });
  const remote = { ...snapshot, data: snapshot.data.members };
  const reservedSeats = snapshot.data.latest?.reservedSeats ?? activity.reservedSeats ?? 0;
  const action = useAction();
  const isHost = activity.hostId === getSession()?.user.id;
  const latest = snapshot.data.latest;
  const canChange = (latest?.status ?? activity.backendStatus) === 'published' && Boolean((latest?.startsAt || activity.startsAt) && new Date(latest?.startsAt || activity.startsAt!).getTime() > now);
  const [target, setTarget] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  return <View><Text style={styles.title}>Thành viên ({remote.data.length + reservedSeats})</Text>
    {reservedSeats > 0 && <GroupCompanions key={`${activity.id}-${latest?.version ?? 0}`} activityId={activity.id} editable={canChange && isHost} onSaved={() => void remote.reload()} />}
    {canChange && isHost && activity.organizerType !== 'business' && <AddActivityFriends activityId={activity.id} onAdded={() => void remote.reload()} />}
    <RemoteState {...remote} onRetry={remote.reload} />
    {action.error ? <Text>{action.error}</Text> : null}
    {!remote.loading && !remote.error && remote.data.map(member => <View key={member.userId} style={styles.card}>
      <Pressable style={styles.row} onPress={() => setProfileId(member.userId)}>
        {member.avatarUrl ? <Image source={{ uri: imageUrl(member.avatarUrl) }} style={{ width: 48, height: 48, borderRadius: 24 }} /> : null}
        <View style={styles.copy}><Text style={styles.title}>{member.name}</Text><Text>{member.role === 'host' ? 'Host' : 'Thành viên'} · Xem hồ sơ</Text></View>
      </Pressable>
      {canChange && isHost && member.role !== 'host' && <Button disabled={action.busy} label="Loại thành viên" onPress={() => setTarget(member.userId)} />}
    </View>)}
    {canChange && !isHost && !remote.loading && !remote.error && <Button disabled={action.busy} label="Rời nhóm" onPress={() => setTarget('me')} />}
    {target && <View style={styles.card}><Text>{target === 'me' ? 'Bạn muốn rời nhóm?' : 'Loại thành viên này khỏi nhóm?'}</Text><View style={styles.tabs}>
      <Button disabled={action.busy} label="Giữ lại" onPress={() => setTarget(null)} />
      <Button disabled={action.busy} label="Xác nhận" onPress={() => void action.run(async () => {
        if (target === 'me') { await leaveActivity(activity.id); onLeft(); }
        else { await removeMember(activity.id, target); await remote.reload(); }
        setTarget(null);
      })} />
    </View></View>}
    {profileId && <MemberProfileModal userId={profileId} onClose={() => setProfileId(null)} />}
  </View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: { alignSelf: 'center', width: '100%', maxWidth: layout.maxWidth, padding: 18, gap: 12, paddingBottom: 30 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 14, gap: 8, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' }, image: { width: 80, height: 90, borderRadius: 12 }, copy: { flex: 1, gap: 4 },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' }, tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { borderColor: colors.primary, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: 'center' }, buttonText: { color: colors.primary, fontWeight: '700' },
});
