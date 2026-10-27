import { JoinConfirmationProvider, useJoinConfirmation } from '../components/JoinConfirmation';
import { useFeedbackState } from '../services/feedback';
import { createConversation, getConversation } from '../services/chatService';
import { FriendsScreen } from './FriendsScreen';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav, MainTab } from '../components/BottomNav';
import { Activity } from '../data/activities';
import { PersonProfile } from '../data/people';
import { ProfileProvider, useProfile } from '../services/ProfileContext';
import { getMatchPreferences, matchFeedback, saveMatchFilters, setFavorite } from '../services/matchService';
import { FavoriteActivitiesScreen } from './FavoriteActivitiesScreen';
import { searchKey } from '../data/profileOptions';
import { activityQuery } from '../services/filterService';
import { Text } from '../components/LocalizedText';
import { getSession, logout } from '../services/api';
import { getActivity, cancelRequest, joinActivity, listActivities, listMyRequests, toActivity } from '../services/activityApi';
import { useRemote } from '../services/useRemote';
import { useWebNavigation } from '../services/webNavigation';
import { RemoteState } from '../components/RemoteState';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors } from '../theme';
import { ActivityDetailScreen } from './ActivityDetailScreen';
import { ActivityFilters, defaultActivityFilters, FilterScreen } from './FilterScreen';
import { ActivityProgressScreen } from './ActivityProgressScreen';
import { ActivitySummaryScreen } from './ActivitySummaryScreen';
import { ChatScreen } from './ChatScreen';
import { CreateActivityScreen } from './CreateActivityScreen';
import { EditProfileScreen } from './EditProfileScreen';
import { GroupChatEntry, GroupScreen } from './GroupScreen';
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
import { SettingsScreen, SettingsPage } from './SettingsScreen';
import { ProfilePreview } from './ProfileViews';
import { MyReviewsScreen, VerificationStatusScreen } from './ProfileAccountScreens';
import { UserProfileScreen } from './UserProfileScreen';
import { ActivitySearchScreen } from './ActivitySearchScreen';

type PeopleSource = { name: 'discover' } | { name: 'pending' } | { name: 'manage' } | { name: 'detail'; activity: Activity };

type FullScreenRoute =
  | { name: 'activityLink'; id: string; target: 'activityDetail' | 'group' | 'progress' | 'summary' | 'rating' }
  | { name: 'friends' }
  | { name: 'chatLink'; id: string }
  | { name: 'discover' }
  | { name: 'searchActivities' }
  | { name: 'filter' }
  | { name: 'favorites' }
  | { name: 'pending' }
  | { name: 'manage' }
  | { name: 'notifications' }
  | { name: 'myActivities' }
  | { name: 'editProfile'; source?: 'ownProfilePreview' }
  | { name: 'ownProfilePreview' }
  | { name: 'settings'; section?: SettingsPage }
  | { name: 'verification' }
  | { name: 'myReviews' }
  | { name: 'activityDetail'; activity: Activity; source: 'home' | 'discover' | 'pending' }
  | { name: 'group'; activity: Activity; source: 'home' | 'myActivities'; initialTab?: 'chat' | 'plan' | 'members' | 'manage' }
  | { name: 'progress'; activity: Activity }
  | { name: 'summary'; activity: Activity }
  | { name: 'rating'; activity: Activity }
  | { name: 'chat'; conversation: Conversation; returnTo?: 'discover' | 'group' | 'friends'; activity?: Activity }
  | { name: 'hostMembers'; activity: Activity; source: PeopleSource }
  | { name: 'memberProfile'; person: PersonProfile; source: 'manage' | 'hostMembers'; activity?: Activity; peopleSource?: PeopleSource }
  | null;

type Navigation = { activeTab: MainTab; route: FullScreenRoute };
const initialNavigation: Navigation = { activeTab: 'home', route: null };
function encodeNavigation({ activeTab, route }: Navigation) {
  if (!route) return `/app/${activeTab}`;
  if (route.name === 'settings') return `/app/${activeTab}/settings${route.section && route.section !== 'root' ? '/' + route.section : ''}`;
  const name = route.name === 'activityLink' ? route.target : route.name === 'chatLink' ? 'chat' : route.name;
  const id = route.name === 'chat' ? route.conversation.id : route.name === 'memberProfile' ? route.person.id : 'activity' in route && route.activity ? route.activity.id : 'id' in route ? route.id : '';
  return `/app/${activeTab}/${name}${id ? `/${encodeURIComponent(id)}` : ''}`;
}
function decodeNavigation(path: string): Navigation {
  const [, root, tab, name, id] = path.split('/');
  const activeTab = root === 'app' && ['home', 'match', 'create', 'messages', 'profile'].includes(tab) ? tab as MainTab : 'home';
  if (name === 'settings') return { activeTab, route: { name: 'settings', section: ['account','privacy','notifications','language','password','blocked','reports','help'].includes(id) ? id as SettingsPage : 'root' } };
  if (name === 'chat' && id) { try { return { activeTab, route: { name: 'chatLink', id: decodeURIComponent(id) } }; } catch { return { activeTab, route: null }; } }
  if (['activityDetail', 'group', 'progress', 'summary', 'rating'].includes(name) && id) {
    try { return { activeTab, route: { name: 'activityLink', id: decodeURIComponent(id), target: name as 'activityDetail' | 'group' | 'progress' | 'summary' | 'rating' } }; } catch { return { activeTab, route: null }; }
  }
  const route = ['friends', 'discover', 'searchActivities', 'filter', 'favorites', 'pending', 'manage', 'notifications', 'myActivities', 'editProfile', 'ownProfilePreview', 'settings', 'verification', 'myReviews'].includes(name) ? { name } as FullScreenRoute : null;
  return { activeTab, route };
}

const restoreNavigation = (value: Navigation): Navigation => value.route && 'activity' in value.route && ['activityDetail', 'group', 'progress', 'summary', 'rating'].includes(value.route.name) ? decodeNavigation(encodeNavigation(value)) : value;

const dayTokens: Record<string, string> = { 'Thứ Hai': 'T2', 'Thứ Ba': 'T3', 'Thứ Tư': 'T4', 'Thứ Năm': 'T5', 'Thứ Sáu': 'T6', 'Thứ Bảy': 'T7', 'Chủ Nhật': 'CN' };

function activityMatchesLocation(activity: Activity, province: string, district: string) {
  if (province === 'Tất cả') return true;
  const provinceAliases: Record<string, string[]> = { 'TP. Hồ Chí Minh': ['TP.HCM', 'Thủ Đức'], 'Hà Nội': ['Hà Nội'], 'Đà Nẵng': ['Đà Nẵng'], 'Lâm Đồng': ['Lâm Đồng', 'Đà Lạt', 'Bảo Lộc'] };
  const provinceMatch = [province, ...(provinceAliases[province] ?? [])].some((token) => activity.location.includes(token));
  return provinceMatch && (!district || district === 'Tất cả' || searchKey(activity.location).includes(searchKey(district.replace(/^(Quận|Huyện|Thị xã|Thành phố)\s+/i, ''))));
}

function activityMatchesTime(activity: Activity, availableDays: string[], timePeriods: string[]) {
  const localDate = activity.startsAt ? new Date(new Date(activity.startsAt).getTime() + 7 * 3600000) : undefined;
  const day = localDate ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][localDate.getUTCDay()] : Object.entries(dayTokens).find(([label]) => activity.time.includes(label))?.[1];
  const hour = localDate ? localDate.getUTCHours() : Number(activity.time.match(/(\d{1,2}):\d{2}/)?.[1] ?? 0);
  const period = hour < 12 ? 'Sáng' : hour < 18 ? 'Chiều' : 'Tối';
  return (availableDays.length === 0 || Boolean(day && availableDays.includes(day))) && (timePeriods.length === 0 || timePeriods.includes(period));
}

export function MainApp({ onLogout }: { onLogout: () => void }) {
  return <ProfileProvider><JoinConfirmationProvider><MainAppContent onLogout={onLogout} /></JoinConfirmationProvider></ProfileProvider>;
}

function MainAppContent({ onLogout }: { onLogout: () => void }) {
  const userProfile = useProfile();
  const confirmJoin = useJoinConfirmation();
  const [actionError, setActionError] = useFeedbackState('');

  const [navigation, navigate] = useWebNavigation(initialNavigation, encodeNavigation, decodeNavigation, getSession()?.user.id || 'guest', restoreNavigation);
  const { activeTab, route } = navigation;
  const navRef = useRef(navigation);
  useEffect(() => { navRef.current = navigation; }, [navigation]);
  const setActiveTab = (tab: MainTab) => { const next = { activeTab: tab, route: null }; navRef.current = next; navigate(next); };
  const setRoute = useCallback((next: FullScreenRoute, replace = false) => { const state = { ...navRef.current, route: next }; navRef.current = state; navigate(state, replace); }, [navigate]);
  useEffect(() => {
    if (route?.name !== 'chatLink') return;
    let alive = true;
    void getConversation(route.id).then(conversation => { if (alive) setRoute({ name: 'chat', conversation }, true); }).catch(reason => { if (alive) { setActionError(reason instanceof Error ? reason.message : 'Không mở được chat'); setRoute(null, true); } });
    return () => { alive = false; };
  }, [route, setRoute, setActionError]);
  useEffect(() => {
    if (route?.name !== 'activityLink') return;
    let alive = true;
    void Promise.all([getActivity(route.id), listMyRequests()]).then(([row, requests]) => {
      if (!alive) return;
      const activity = toActivity(row, requests.find(request => request.activityId === row.id)?.status);
      const target = ['progress', 'summary', 'rating'].includes(route.target) ? row.status === 'published' ? 'group' : row.status === 'completed' ? route.target === 'rating' ? 'rating' : 'summary' : 'progress' : route.target;
      setRoute(target === 'activityDetail' ? { name: 'activityDetail', activity, source: 'home' } : target === 'group' ? { name: 'group', activity, source: 'myActivities' } : { name: target, activity }, true);
    }).catch(reason => { if (alive) { setActionError(reason instanceof Error ? reason.message : 'Không tải được hoạt động'); setRoute(null, true); } });
    return () => { alive = false; };
  }, [route, setRoute, setActionError]);
  const preferences = useRemote(getMatchPreferences, { filters: null, favoriteIds: [] });
  const [sessionFilters, setFilters] = useState<ActivityFilters | null>(null);
  const filters = useMemo(() => sessionFilters ?? { ...defaultActivityFilters, province: 'Tất cả', ...preferences.data.filters, minBudget: 0, maxBudget: 2000000, coordinates: null }, [sessionFilters, preferences.data.filters]);
  const [filterSaving, setFilterSaving] = useState(false);
  const applyFilters = async (next: ActivityFilters) => {
    if (mutation.current) return;
    mutation.current = true; setFilterSaving(true); setActionError('');
    try { await saveMatchFilters(next); setFilters(next); preferences.setData(current => ({ ...current, filters: next })); setRoute({ name: 'discover' }); }
    catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Không lưu được bộ lọc'); }
    finally { mutation.current = false; setFilterSaving(false); }
  };
  const favoriteMutation = useRef(false);
  const toggleFavorite = async (activity: Activity) => {
    if (favoriteMutation.current) return;
    favoriteMutation.current = true; setActionError('');
    const saved = !preferences.data.favoriteIds.includes(activity.id);
    try {
      await setFavorite(activity.id, saved);
      preferences.setData(current => ({ ...current, favoriteIds: saved ? [...current.favoriteIds, activity.id] : current.favoriteIds.filter(id => id !== activity.id) }));
      if (saved) void matchFeedback(activity.id, 'favorite').catch(() => {});
    } catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Không lưu được yêu thích'); }
    finally { favoriteMutation.current = false; }
  };
  const loadDiscovery = useCallback(async () => {
    if ((filters.radiusEnabled || filters.sort === 'nearest') && !filters.coordinates) return [];
    const [rows, requests] = await Promise.all([listActivities(activityQuery(filters)), listMyRequests()]);
    return rows.map(row => toActivity(row, requests.find(request => request.activityId === row.id)?.status));
  }, [filters]);
  const discovery = useRemote(loadDiscovery, []);
  const refreshDiscovery = discovery.reload;
  useEffect(() => {
    if (route?.name !== 'discover') return;
    void refreshDiscovery(true);
    const timer = setInterval(() => void refreshDiscovery(true), 10000);
    return () => clearInterval(timer);
  }, [route?.name, refreshDiscovery]);
  const activities = discovery.data;
  const mutation = useRef(false);
  const submitJoin = async (activity: Activity) => {
    if (mutation.current) return false;
    mutation.current = true; setActionError('');
    try { if (!await confirmJoin(activity)) return false; await joinActivity(activity.id); void matchFeedback(activity.id, 'interested').catch(() => {}); return true; }
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
    if (!filters) return activities.filter(item => item.hostId !== getSession()?.user.id && !['pending', 'approved'].includes(item.requestStatus ?? ''));
    return activities.filter(item => !['pending', 'approved'].includes(item.requestStatus ?? '')).filter((activity) => {
      const estimatedCost = Number(activity.estimatedCost.replace(/\D/g, ''));
      const capacity = Number(activity.members.split('/')[1] ?? 0);
      return (!filters.radiusEnabled || (Number.isFinite(Number.parseFloat(activity.distance)) && Number.parseFloat(activity.distance) <= filters.distance))
        && activityMatchesLocation(activity, filters.province, filters.district)
        && (!filters.ward || searchKey(activity.location).includes(searchKey(filters.ward)))
        && (filters.categories.length === 0 || filters.categories.includes(activity.category))
        && activityMatchesTime(activity, filters.availableDays, filters.timePeriods)
        && estimatedCost >= filters.minBudget
        && (filters.maxBudget === 2000000 || estimatedCost <= filters.maxBudget)
        && (activity.minParticipants ?? 2) >= filters.minimumCapacity
        && (!filters.maximumCapacity || capacity <= filters.maximumCapacity);
    });
  }, [filters, activities]);

  if (userProfile.loading || userProfile.error) return <SafeAreaView style={styles.safeArea}><RemoteState loading={userProfile.loading} error={userProfile.error} onRetry={userProfile.reload} /></SafeAreaView>;
  if (userProfile.profile && !userProfile.profile.profileComplete) return <EditProfileScreen required onBack={handleLogout} onSaved={() => { void userProfile.reload(); }} />;

  if (route?.name === 'activityLink' || route?.name === 'chatLink') return <SafeAreaView style={styles.safeArea}><RemoteState loading error="" onRetry={() => {}} /></SafeAreaView>;
  if (route?.name === 'discover' && (discovery.loading || discovery.error || preferences.loading || preferences.error)) return <SafeAreaView style={styles.safeArea}><ScreenHeader title="Khám phá" onBack={() => setRoute(null)} /><RemoteState loading={discovery.loading || preferences.loading} error={discovery.error || preferences.error} onRetry={() => { void preferences.reload(); void discovery.reload(); }} /></SafeAreaView>;
  if (route?.name === 'searchActivities') return <ActivitySearchScreen onBack={() => setRoute({ name: 'discover' })} onOpen={activity => setRoute({ name: 'activityDetail', activity, source: 'discover' })} />;
  if (route?.name === 'discover') return <MatchScreen onSearch={() => setRoute({ name: 'searchActivities' })} state={(filters.radiusEnabled || filters.sort === 'nearest') && !filters.coordinates ? 'location-required' : 'ready'} error={actionError} onMatched={submitJoin} favoriteIds={preferences.data.favoriteIds} onFavorite={toggleFavorite} locationLabel={filters.coordinates ? filters.radiusEnabled ? `Trong ${filters.distance} km` : 'Đã chọn vị trí' : undefined} onFeedback={(activity, outcome) => { void matchFeedback(activity.id, outcome).catch(() => {}); }} activityItems={filteredActivities} onBack={() => { setRoute(null); void discovery.reload(); }} onFilterPress={() => setRoute({ name: 'filter' })} />;
  if (route?.name === 'filter') return <FilterScreen key={preferences.loading ? 'loading' : 'ready'} initialFilters={filters} saving={filterSaving || preferences.loading} saveError={actionError || preferences.error} onApply={next => void applyFilters(next)} onClose={() => setRoute({ name: 'discover' })} />;
  if (route?.name === 'favorites') return <FavoriteActivitiesScreen onChanged={() => void preferences.reload()} onBack={() => setRoute(null)} onOpen={activity => setRoute({ name: 'activityDetail', activity, source: 'discover' })} />;
  if (route?.name === 'pending') return <PendingActivitiesScreen onBack={() => setRoute(null)} onOpen={(activity) => setRoute({ name: 'activityDetail', activity, source: 'pending' })} />;
  if (route?.name === 'manage') return <ManageActivitiesScreen onProgress={(activity) => setRoute({ name: activity.backendStatus === 'completed' ? 'summary' : 'progress', activity })} onBack={() => setRoute(null)} onOpenGroup={(activity) => setRoute({ name: 'group', activity, source: 'myActivities' })} onOpenMembers={(activity) => setRoute({ name: 'hostMembers', activity, source: { name: 'manage' } })} />;
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
  if (route?.name === 'ownProfilePreview') return <SafeAreaView style={styles.safeArea}><ScreenHeader title="Xem trước hồ sơ" onBack={() => setRoute(null)} right={<Pressable accessibilityRole="button" onPress={() => setRoute({ name: 'editProfile', source: 'ownProfilePreview' })}><Text style={{ color: colors.primary }}>Chỉnh sửa</Text></Pressable>} /><ScrollView contentContainerStyle={{ width: '100%', maxWidth: 800, alignSelf: 'center', padding: 18 }}>{userProfile.profile && <ProfilePreview profile={userProfile.profile} />}</ScrollView></SafeAreaView>;
  if (route?.name === 'verification') return <VerificationStatusScreen onBack={() => setRoute(null)} />;
  if (route?.name === 'myReviews') return <MyReviewsScreen onBack={() => setRoute(null)} />;
  if (route?.name === 'notifications') return <NotificationsScreen onBack={() => setRoute(null)} onOpen={async notice => {
    if (notice.type === 'activity-invitation') { setRoute({ name: 'friends' }); return; }
    if (notice.conversationId) { setRoute({ name: 'chat', conversation: await getConversation(notice.conversationId) }); return; }
    if (notice.activityId) { const [row, requests] = await Promise.all([getActivity(notice.activityId), listMyRequests()]); const member = requests.some(request => request.activityId === row.id && request.status === 'approved'); setRoute(row.hostId === getSession()?.user.id || member ? { name: 'group', activity: toActivity(row), source: 'myActivities', initialTab: row.hostId === getSession()?.user.id ? 'manage' : 'chat' } : { name: 'activityDetail', activity: toActivity(row), source: 'home' }); return; }
    setRoute({ name: 'friends' });
  }} />;
  if (route?.name === 'myActivities') return <MyActivitiesScreen onOpenPending={() => setRoute({ name: 'pending' })} onBack={() => setRoute(null)} onOpenGroup={(activity) => setRoute({ name: 'group', activity, source: 'myActivities' })} />;
  if (route?.name === 'editProfile') {
    const returnRoute = route.source === 'ownProfilePreview' ? { name: 'ownProfilePreview' } as const : null;
    return <EditProfileScreen onBack={() => setRoute(returnRoute)} onSaved={() => setRoute(returnRoute)} />;
  }
  if (route?.name === 'settings') return <SettingsScreen page={route.section || 'root'} onNavigate={section => setRoute({ name: 'settings', section })} onBack={() => setRoute(null)} onLogout={handleLogout} />;
  if (route?.name === 'friends') return <FriendsScreen onBack={() => setRoute(null)} onChat={async userId => { const conversation = await createConversation({ type: 'direct', userId }); setRoute({ name: 'chat', conversation, returnTo: 'friends' }); }} />;
  if (route?.name === 'chat') {
    const current = route;
    const back = () => setRoute(current.returnTo === 'friends' ? { name: 'friends' } : current.returnTo === 'discover' ? { name: 'discover' } : null);
    if (current.conversation.activityId) return <GroupChatEntry key={current.conversation.id} activityId={current.conversation.activityId} onBack={back} onLeft={() => setRoute({ name: 'myActivities' })} onStart={(activity) => setRoute({ name: activity.backendStatus === 'completed' ? 'summary' : 'progress', activity })} />;
    return <ChatScreen error={actionError} key={current.conversation.id} conversation={current.conversation} onBack={back} />;
  }
  if (route?.name === 'group') { const current = route; return <GroupScreen key={current.activity.id + (current.initialTab || '')} initialTab={current.initialTab} onLeft={() => setRoute({ name: 'myActivities' })} activity={current.activity} onBack={() => setRoute(current.source === 'myActivities' ? { name: 'myActivities' } : null)} onStart={(activity) => setRoute({ name: activity.backendStatus === 'completed' ? 'summary' : 'progress', activity })} />; }
  if (route?.name === 'progress') return <ActivityProgressScreen activity={route.activity} onBack={() => setRoute({ name: 'group', activity: route.activity, source: 'myActivities' })} onEnd={(activity) => setRoute({ name: 'summary', activity })} />;
  if (route?.name === 'summary') return <ActivitySummaryScreen activity={route.activity} onBack={() => setRoute({ name: 'progress', activity: route.activity })} onRate={() => setRoute({ name: 'rating', activity: route.activity })} />;
  if (route?.name === 'rating') return <RatingScreen activity={route.activity} onBack={() => setRoute({ name: 'summary', activity: route.activity })} onComplete={() => { setActiveTab('home'); setRoute(null); }} />;

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safeArea}>
      {actionError ? <Text style={{ color: colors.danger, padding: 12 }}>{actionError}</Text> : null}
      <View style={styles.content}>
        {activeTab === 'home' && <HomeScreen onProfilePress={() => setActiveTab('profile')} onMatchPress={() => { setActiveTab('match'); setRoute({ name: 'discover' }); }} onMyActivitiesPress={() => setRoute({ name: 'myActivities' })} onNotificationsPress={() => setRoute({ name: 'notifications' })} onOpenActivity={(activity) => setRoute({ name: 'activityDetail', activity, source: 'home' })} onOpenGroup={(activity) => setRoute({ name: 'group', activity, source: 'home' })} onPendingPress={() => setRoute({ name: 'pending' })} />}
        {activeTab === 'match' && <MatchHubScreen onProfile={() => setActiveTab('profile')} onFavorites={() => setRoute({ name: 'favorites' })} onDiscover={() => setRoute({ name: 'discover' })} onManage={() => setRoute({ name: 'manage' })} onNotifications={() => setRoute({ name: 'notifications' })} onPending={() => setRoute({ name: 'pending' })} onPreviewProfile={() => setRoute({ name: 'ownProfilePreview' })} />}
        {activeTab === 'create' && <CreateActivityScreen onCreated={() => { void discovery.reload(); setRoute({ name: 'manage' }); }} />}
        {activeTab === 'messages' && <MessagesScreen onFriends={() => setRoute({ name: 'friends' })} onOpenChat={(conversation) => setRoute({ name: 'chat', conversation })} />}
        {activeTab === 'profile' && <UserProfileScreen onFriends={() => setRoute({ name: 'friends' })} onPreview={() => setRoute({ name: 'ownProfilePreview' })} onVerification={() => setRoute({ name: 'verification' })} onReviews={() => setRoute({ name: 'myReviews' })} onEdit={() => setRoute({ name: 'editProfile' })} onMyActivities={() => setRoute({ name: 'myActivities' })} onNotifications={() => setRoute({ name: 'notifications' })} onSettings={() => setRoute({ name: 'settings' })} />}
      </View>
      <BottomNav activeTab={activeTab} onChange={(tab) => { const next: Navigation = { activeTab: tab, route: tab === 'match' ? { name: 'discover' } : null }; navRef.current = next; navigate(next); }} />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safeArea: { backgroundColor: colors.background, flex: 1 }, content: { flex: 1 } });
