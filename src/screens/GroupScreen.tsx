import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityPlanPanel } from '../components/ActivityPlanPanel';
import { ActivityManagementPanel } from '../components/ActivityManagementPanel';
import { Text } from '../components/LocalizedText';
import { RemoteState } from '../components/RemoteState';
import { Activity } from '../data/activities';
import { MembersPanel } from './MembershipViews';
import { ChatScreen } from './ChatScreen';
import { createConversation } from '../services/chatService';
import { getActivity, toActivity } from '../services/activityApi';
import { getSession } from '../services/api';
import { useRemote } from '../services/useRemote';
import { colors, layout } from '../theme';

type GroupTab = 'chat' | 'plan' | 'members' | 'manage';
type Props = { activity: Activity; onBack: () => void; onStart: (activity: Activity) => void; onLeft: () => void; initialTab?: GroupTab };
const tabs = [
  { id: 'chat', label: 'Chat', icon: 'chatbubble-ellipses-outline' },
  { id: 'plan', label: 'Kế hoạch', icon: 'calendar-outline' },
  { id: 'members', label: 'Thành viên', icon: 'people-outline' },
  { id: 'manage', label: 'Quản lý', icon: 'options-outline' },
] as const;

export function GroupScreen({ activity, onBack, onStart, onLeft, initialTab = 'chat' }: Props) {
  const [tab, setTab] = useState<GroupTab>(initialTab);
  const load = useCallback(() => getActivity(activity.id), [activity.id]);
  const remote = useRemote(load, null);
  const reload = remote.reload;
  useEffect(() => { const timer = setInterval(() => void reload(), 10000); return () => clearInterval(timer); }, [reload]);
  const current = remote.data ? toActivity(remote.data) : activity;
  const isHost = current.hostId === getSession()?.user.id;
  const activeTab = tab === 'manage' && !isHost ? 'chat' : tab;
  const noticeTitle = current.backendStatus === 'completed' ? 'Hoạt động đã kết thúc' : current.backendStatus === 'in-progress' ? 'Hoạt động đã bắt đầu' : remote.data?.scheduleConfirmedAt ? 'Host đã chốt lịch đi' : 'Nhóm đang lên kế hoạch';
  const noticeBody = current.backendStatus === 'completed' ? 'Bạn có thể xem tổng kết và đánh giá trong mục Kế hoạch.' : current.backendStatus === 'in-progress' ? 'Host đang điều hành và điểm danh cho nhóm.' : remote.data?.scheduleConfirmedAt ? `${current.time} · ${current.meetingPoint || current.location}` : 'Cùng trao đổi trong chat và chuẩn bị kế hoạch trước ngày gặp.';
  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
    <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Quay lại" hitSlop={12} onPress={onBack}><Ionicons name="chevron-back" size={27} color={colors.text} /></Pressable><Image source={current.image} style={styles.avatar} /><View style={{ flex: 1, gap: 4 }}><Text numberOfLines={1} style={styles.title}>{current.title}</Text><Text style={styles.subtitle}>{current.members} thành viên · {current.backendStatus === 'completed' ? 'Đã kết thúc' : current.backendStatus === 'in-progress' ? 'Đang diễn ra' : remote.data?.scheduleConfirmedAt ? 'Đã chốt lịch đi' : 'Đang lên kế hoạch'}</Text></View></View>
    <View style={styles.tabBar}>{tabs.filter(item => item.id !== 'manage' || isHost).map(item => <Pressable key={item.id} accessibilityRole="tab" accessibilityState={{ selected: activeTab === item.id }} accessibilityLabel={item.label} onPress={() => setTab(item.id)} style={[styles.tab, activeTab === item.id && styles.activeTab]}><Ionicons name={item.icon} size={19} color={activeTab === item.id ? colors.primary : colors.textMuted} /><Text style={[styles.tabText, activeTab === item.id && { color: colors.primary }]}>{item.label}</Text></Pressable>)}</View>
    {activeTab === 'chat' ? <><View style={styles.notice}><Ionicons name="information-circle-outline" size={20} color={colors.primary} /><View style={{ flex: 1, gap: 3 }}><Text accessibilityLiveRegion="polite" style={styles.noticeTitle}>{noticeTitle}</Text><Text style={styles.noticeBody}>{noticeBody}</Text></View></View><ActivityChat activityId={activity.id} onBack={onBack} /></> : <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      {activeTab === 'plan' && <ActivityPlanPanel activityId={activity.id} onChanged={remote.setData} onManage={isHost ? () => setTab('manage') : undefined} onProgress={row => onStart(toActivity(row))} />}
      {activeTab === 'members' && <MembersPanel activity={current} onLeft={onLeft} />}
      {activeTab === 'manage' && isHost && <ActivityManagementPanel activityId={activity.id} onPlan={() => setTab('plan')} onProgress={onStart} onDeleted={onLeft} onChanged={remote.setData} />}
    </ScrollView>}
    {remote.error ? <Text accessibilityRole="alert" style={{ color: colors.danger, padding: 10 }}>{remote.error}</Text> : null}
  </SafeAreaView>;
}

function ActivityChat({ activityId, onBack }: { activityId: string; onBack: () => void }) {
  const load = useCallback(() => createConversation({ type: 'group', activityId }), [activityId]);
  const remote = useRemote(load, null);
  if (!remote.data || remote.error) return <View style={{ flex: 1, justifyContent: 'center' }}><RemoteState {...remote} onRetry={remote.reload} /></View>;
  return <ChatScreen key={remote.data.id} embedded conversation={remote.data} onBack={onBack} />;
}

export function GroupChatEntry({ activityId, ...props }: Omit<Props, 'activity'> & { activityId: string }) {
  const load = useCallback(() => getActivity(activityId), [activityId]);
  const remote = useRemote(load, null);
  if (!remote.data || remote.error) return <SafeAreaView style={styles.safe}><Pressable onPress={props.onBack} style={{ padding: 20 }}><Text style={{ color: colors.primary }}>Quay lại</Text></Pressable><RemoteState {...remote} onRetry={remote.reload} /></SafeAreaView>;
  return <GroupScreen {...props} activity={toActivity(remote.data)} />;
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', gap: 9, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: colors.primarySoft }, noticeTitle: { color: colors.primary, fontSize: 12, fontWeight: '700', lineHeight: 18 }, noticeBody: { color: colors.textSecondary, fontSize: 11, lineHeight: 17 },
  safe: { flex: 1, backgroundColor: colors.background }, header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: colors.surface }, avatar: { width: 43, height: 43, borderRadius: 16 }, title: { fontSize: 17, fontWeight: '800', color: colors.text }, subtitle: { fontSize: 12, color: colors.textMuted }, tabBar: { flexDirection: 'row', paddingHorizontal: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border }, tab: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: 5, paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: 'transparent' }, activeTab: { borderBottomColor: colors.primary }, tabText: { fontSize: 12, fontWeight: '700', color: colors.textMuted }, page: { padding: 18, paddingBottom: 36, maxWidth: layout.maxWidth, width: '100%', alignSelf: 'center' },
});
