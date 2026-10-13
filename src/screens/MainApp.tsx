import { useCallback, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav, MainTab } from '../components/BottomNav';
import { Activity } from '../data/activities';
import { PersonProfile } from '../data/people';
import { ProfileProvider, useProfile } from '../services/ProfileContext';
import { activityQuery } from '../services/filterService';
import { Text } from '../components/LocalizedText';
import { getSession, logout } from '../services/api';
import { cancelRequest, joinActivity, listActivities, listMyRequests, toActivity } from '../services/activityApi';
import { useRemote } from '../services/useRemote';
import { RemoteState } from '../components/RemoteState';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors } from '../theme';
import { ActivityDetailScreen } from './ActivityDetailScreen';
import { ActivityFilters, FilterScreen } from './FilterScreen';
import { ActivityProgressScreen } from './ActivityProgressScreen';
import { ActivitySummaryScreen } from './ActivitySummaryScreen';
import { ChatScreen } from './ChatScreen';
import { CreateActivityScreen } from './CreateActivityScreen';
import { EditProfileScreen } from './EditProfileScreen';
import { GroupScreen } from './GroupScreen';
import { HomeScreen } from './HomeScreen';
import { HostMembersScreen } from './HostMembersScreen';
import { ManageActivitiesScreen } from './ManageActivitiesScreen';
import { MatchHubScreen } from './MatchHubScreen';
import { MatchScreen } from './MatchScreen';
import { MemberProfileScreen } from './MemberProfileScreen';
import { Conversation, MessagesScreen } from './MessagesScreen';
import { MyActivitiesScreen } from './MyActivitiesScreen';
import { NotificationsScreen } from './NotificationsScreen';
import { PendingActivitiesScreen } from './PendingActivitiesScreen';
import { RatingScreen } from './RatingScreen';
import { SettingsScreen } from './SettingsScreen';
import { UserProfileScreen } from './UserProfileScreen';

type PeopleSource = { name: 'discover' } | { name: 'pending' } | { name: 'manage' } | { name: 'detail'; activity: Activity };

type FullScreenRoute =
  | { name: 'discover' }
  | { name: 'filter' }
  | { name: 'pending' }
  | { name: 'manage' }
  | { name: 'notifications' }
  | { name: 'myActivities' }
  | { name: 'editProfile'; source?: 'ownProfilePreview' }
  | { name: 'ownProfilePreview' }
  | { name: 'settings' }
  | { name: 'activityDetail'; activity: Activity; source: 'home' | 'discover' | 'pending' }
  | { name: 'group'; activity: Activity; source: 'home' | 'myActivities' }
  | { name: 'progress'; activity: Activity }
  | { name: 'summary'; activity: Activity }
  | { name: 'rating'; activity: Activity }
  | { name: 'chat'; conversation: Conversation; returnTo?: 'discover' }
  | { name: 'hostMembers'; activity: Activity; source: PeopleSource }
  | { name: 'memberProfile'; person: PersonProfile; source: 'manage' | 'hostMembers'; activity?: Activity; peopleSource?: PeopleSource }
  | null;

const dayTokens: Record<string, string> = { 'Thứ Hai': 'T2', 'Thứ Ba': 'T3', 'Thứ Tư': 'T4', 'Thứ Năm': 'T5', 'Thứ Sáu': 'T6', 'Thứ Bảy': 'T7', 'Chủ Nhật': 'CN' };

function activityMatchesLocation(activity: Activity, province: string, district: string) {
  if (province === 'Tất cả') return true;
  const provinceAliases: Record<string, string[]> = { 'TP. Hồ Chí Minh': ['TP.HCM', 'Thủ Đức'], 'Hà Nội': ['Hà Nội'], 'Đà Nẵng': ['Đà Nẵng'], 'Lâm Đồng': ['Lâm Đồng', 'Đà Lạt', 'Bảo Lộc'] };
  const provinceMatch = (provinceAliases[province] ?? [province]).some((token) => activity.location.includes(token));
  return provinceMatch && (district === 'Tất cả' || activity.location.includes(district));
}

function activityMatchesTime(activity: Activity, availableDays: string[], timePeriods: string[]) {
  const localDate = activity.startsAt ? new Date(new Date(activity.startsAt).getTime() + 7 * 3600000) : undefined;
  const day = localDate ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][localDate.getUTCDay()] : Object.entries(dayTokens).find(([label]) => activity.time.includes(label))?.[1];
  const hour = localDate ? localDate.getUTCHours() : Number(activity.time.match(/(\d{1,2}):\d{2}/)?.[1] ?? 0);
  const period = hour < 12 ? 'Sáng' : hour < 18 ? 'Chiều' : 'Tối';
  return (availableDays.length === 0 || Boolean(day && availableDays.includes(day))) && (timePeriods.length === 0 || timePeriods.includes(period));
}

export function MainApp({ onLogout }: { onLogout: () => void }) {
  return <ProfileProvider><MainAppContent onLogout={onLogout} /></ProfileProvider>;
}

function MainAppContent({ onLogout }: { onLogout: () => void }) {
  const userProfile = useProfile();
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [route, setRoute] = useState<FullScreenRoute>(null);
  const [filters, setFilters] = useState<ActivityFilters>();
  const [actionError, setActionError] = useState('');
  const loadDiscovery = useCallback(async () => {
    const [rows, requests] = await Promise.all([listActivities(activityQuery(filters)), listMyRequests()]);
    return rows.map(row => toActivity(row, requests.find(request => request.activityId === row.id)?.status));
  }, [filters]);
  const discovery = useRemote(loadDiscovery, []);
  const activities = discovery.data;
  const mutation = useRef(false);
  const submitJoin = async (activity: Activity) => {
    if (mutation.current) return false;
    mutation.current = true; setActionError('');
    try { await joinActivity(activity.id); return true; }
    catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Không gửi được yêu cầu. Vui lòng thử lại.'); return false; }
    finally { mutation.current = false; }
  };
  const handlePrimary = async (activity: Activity) => {
    if (activity.hostId === getSession()?.user.id) { setRoute({ name: 'manage' }); return; }
    if (activity.requestStatus === 'approved') { setRoute({ name: 'group', activity, source: 'myActivities' }); return; }
    if (activity.requestStatus === 'pending') {
      if (mutation.current) return;
      mutation.current = true; setActionError('');
      try { await cancelRequest(activity.id); setRoute({ name: 'pending' }); }
      catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Không hủy được yêu cầu. Vui lòng thử lại.'); }
      finally { mutation.current = false; }
    } else if (await submitJoin(activity)) { setRoute({ name: 'pending' }); }
    void discovery.reload();
  };
  const handleLogout = async () => { try { await logout(); } catch { /* Local session is cleared even when offline. */ } onLogout(); };
  const filteredActivities = useMemo(() => {
    if (!filters) return activities.filter(item => !['pending', 'approved'].includes(item.requestStatus ?? ''));
    return activities.filter(item => !['pending', 'approved'].includes(item.requestStatus ?? '')).filter((activity) => {
      const estimatedCost = Number(activity.estimatedCost.replace(/\D/g, ''));
      const capacity = Number(activity.members.split('/')[1] ?? 0);
      return (!Number.isFinite(Number.parseFloat(activity.distance)) || Number.parseFloat(activity.distance) <= filters.distance)
        && activityMatchesLocation(activity, filters.province, filters.district)
        && (filters.categories.length === 0 || filters.categories.includes(activity.category))
        && activityMatchesTime(activity, filters.availableDays, filters.timePeriods)
        && estimatedCost >= filters.minBudget
        && (filters.maxBudget === 2000000 || estimatedCost <= filters.maxBudget)
        && (activity.minParticipants ?? 2) >= filters.minimumCapacity
        && (!filters.maximumCapacity || capacity <= filters.maximumCapacity);
    });
  }, [filters, activities]);

  if (route?.name === 'discover' && (discovery.loading || discovery.error)) return <SafeAreaView style={styles.safeArea}><ScreenHeader title="Khám phá" onBack={() => setRoute(null)} /><RemoteState {...discovery} onRetry={discovery.reload} /></SafeAreaView>;
  if (route?.name === 'discover') return <MatchScreen error={actionError} onMatched={submitJoin} activityItems={filteredActivities} onBack={() => { setRoute(null); void discovery.reload(); }} onFilterPress={() => setRoute({ name: 'filter' })} />;
  if (route?.name === 'filter') return <FilterScreen initialFilters={filters} onApply={(next) => { setFilters(next); setRoute({ name: 'discover' }); }} onClose={() => setRoute({ name: 'discover' })} />;
  if (route?.name === 'pending') return <PendingActivitiesScreen onBack={() => setRoute(null)} onOpen={(activity) => setRoute({ name: 'activityDetail', activity, source: 'pending' })} />;
  if (route?.name === 'manage') return <ManageActivitiesScreen onBack={() => setRoute(null)} onOpenMembers={(activity) => setRoute({ name: 'hostMembers', activity, source: { name: 'manage' } })} />;
  if (route?.name === 'activityDetail') {
    const current = route;
    return <ActivityDetailScreen error={actionError} activity={current.activity} onBack={() => setRoute(current.source === 'discover' ? { name: 'discover' } : current.source === 'pending' ? { name: 'pending' } : null)} isHost={current.activity.hostId === getSession()?.user.id} onPrimary={() => void handlePrimary(current.activity)} onViewPeople={() => setRoute({ name: 'hostMembers', activity: current.activity, source: { name: 'detail', activity: current.activity } })} />;
  }
  if (route?.name === 'hostMembers') {
    const { activity, source } = route;
    return <HostMembersScreen onLeft={() => setRoute({ name: 'myActivities' })} activity={activity} onBack={() => setRoute(source.name === 'detail' ? { name: 'activityDetail', activity: source.activity, source: 'discover' } : source)} onViewProfile={(person) => setRoute({ name: 'memberProfile', person, source: 'hostMembers', activity, peopleSource: source })} />;
  }
  if (route?.name === 'memberProfile') {
    const current = route;
    return <MemberProfileScreen person={current.person} onBack={() => current.source === 'manage' ? setRoute({ name: 'manage' }) : current.activity && current.peopleSource ? setRoute({ name: 'hostMembers', activity: current.activity, source: current.peopleSource }) : setRoute(null)} />;
  }
  if (route?.name === 'ownProfilePreview') return <SafeAreaView style={styles.safeArea}><ScreenHeader title="Hồ sơ" onBack={() => setRoute(null)} /><UserProfileScreen onEdit={() => setRoute({ name: 'editProfile', source: 'ownProfilePreview' })} onMyActivities={() => setRoute({ name: 'myActivities' })} onNotifications={() => setRoute({ name: 'notifications' })} onSettings={() => setRoute({ name: 'settings' })} /></SafeAreaView>;
  if (route?.name === 'notifications') return <NotificationsScreen onBack={() => setRoute(null)} />;
  if (route?.name === 'myActivities') return <MyActivitiesScreen onOpenPending={() => setRoute({ name: 'pending' })} onBack={() => setRoute(null)} onOpenGroup={(activity) => setRoute({ name: 'group', activity, source: 'myActivities' })} />;
  if (route?.name === 'editProfile') {
    const returnRoute = route.source === 'ownProfilePreview' ? { name: 'ownProfilePreview' } as const : null;
    return <EditProfileScreen onBack={() => setRoute(returnRoute)} onSaved={() => setRoute(returnRoute)} />;
  }
  if (route?.name === 'settings') return <SettingsScreen onBack={() => setRoute(null)} onLogout={handleLogout} />;
  if (route?.name === 'chat') { const current = route; return <ChatScreen conversation={current.conversation} onBack={() => setRoute(current.returnTo === 'discover' ? { name: 'discover' } : null)} />; }
  if (route?.name === 'group') { const current = route; return <GroupScreen onLeft={() => setRoute({ name: 'myActivities' })} activity={current.activity} onBack={() => setRoute(current.source === 'myActivities' ? { name: 'myActivities' } : null)} onStart={() => setRoute({ name: 'progress', activity: current.activity })} />; }
  if (route?.name === 'progress') return <ActivityProgressScreen activity={route.activity} onBack={() => setRoute({ name: 'group', activity: route.activity, source: 'myActivities' })} onEnd={() => setRoute({ name: 'summary', activity: route.activity })} />;
  if (route?.name === 'summary') return <ActivitySummaryScreen activity={route.activity} onBack={() => setRoute({ name: 'progress', activity: route.activity })} onRate={() => setRoute({ name: 'rating', activity: route.activity })} />;
  if (route?.name === 'rating') return <RatingScreen activity={route.activity} onBack={() => setRoute({ name: 'summary', activity: route.activity })} onComplete={() => { setActiveTab('home'); setRoute(null); }} />;

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.content}>
        {activeTab === 'home' && <HomeScreen onMatchPress={() => { setActiveTab('match'); setRoute({ name: 'discover' }); }} onMyActivitiesPress={() => setRoute({ name: 'myActivities' })} onNotificationsPress={() => setRoute({ name: 'notifications' })} onOpenActivity={(activity) => setRoute({ name: 'activityDetail', activity, source: 'home' })} onOpenGroup={(activity) => setRoute({ name: 'group', activity, source: 'home' })} onPendingPress={() => setRoute({ name: 'pending' })} />}
        {activeTab === 'match' && <MatchHubScreen onDiscover={() => setRoute({ name: 'discover' })} onManage={() => setRoute({ name: 'manage' })} onNotifications={() => setRoute({ name: 'notifications' })} onPending={() => setRoute({ name: 'pending' })} onPreviewProfile={() => setRoute({ name: 'ownProfilePreview' })} />}
        {activeTab === 'create' && <CreateActivityScreen onCreated={() => { void discovery.reload(); setRoute({ name: 'manage' }); }} />}
        {activeTab === 'messages' && <MessagesScreen onOpenChat={(conversation) => setRoute({ name: 'chat', conversation })} />}
        {activeTab === 'profile' && <UserProfileScreen onEdit={() => setRoute({ name: 'editProfile' })} onMyActivities={() => setRoute({ name: 'myActivities' })} onNotifications={() => setRoute({ name: 'notifications' })} onSettings={() => setRoute({ name: 'settings' })} />}
      </View>
      <BottomNav activeTab={activeTab} onChange={(tab) => { setActiveTab(tab); if (tab === 'match') setRoute({ name: 'discover' }); }} />
      <Modal transparent animationType="fade" visible={!userProfile.loading && Boolean(userProfile.profile && !userProfile.profile.profileComplete) && !reminderDismissed} onRequestClose={() => setReminderDismissed(true)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 }}><View style={{ alignSelf: 'center', maxWidth: 440, width: '100%', backgroundColor: colors.surface, borderRadius: 22, padding: 24, gap: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: '700' }}>Hoàn thiện hồ sơ của bạn</Text><Text>Thêm khu vực, giới thiệu, sở thích và ngôn ngữ để host hiểu bạn hơn và tìm được nhóm phù hợp.</Text>
          <Pressable onPress={() => { setReminderDismissed(true); setRoute({ name: 'editProfile' }); }}><Text style={{ color: colors.primary, fontWeight: '700' }}>Hoàn thiện ngay</Text></Pressable>
          <Pressable onPress={() => setReminderDismissed(true)}><Text>Để sau</Text></Pressable>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safeArea: { backgroundColor: colors.background, flex: 1 }, content: { flex: 1 } });
