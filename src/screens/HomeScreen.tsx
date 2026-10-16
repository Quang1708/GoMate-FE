import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { HomeHeader, HomeEmptyState, NextActivityCard, ActivityScheduleItem } from '../components/home/HomeComponents';
import { Text } from '../components/LocalizedText';
import { RemoteState } from '../components/RemoteState';
import { Activity } from '../data/activities';
import { listJoined, listOwned, toActivity } from '../services/activityApi';
import { useRemote } from '../services/useRemote';
import { colors, layout } from '../theme';
type HomeScreenProps = {
  onMatchPress: () => void; onMyActivitiesPress: () => void; onNotificationsPress: () => void; onProfilePress: () => void;
  onPendingPress: () => void; onOpenActivity: (activity: Activity) => void; onOpenGroup: (activity: Activity) => void;
};
export function HomeScreen({ onMatchPress, onMyActivitiesPress, onNotificationsPress, onProfilePress, onPendingPress, onOpenActivity, onOpenGroup }: HomeScreenProps) {
  const { width } = useWindowDimensions();
  const wide = width >= 768;
  const loader = useCallback(async () => {
    const [joined, owned] = await Promise.all([listJoined(), listOwned()]);
    return [...joined, ...owned].filter(row => row.status !== 'completed' && (!row.endsAt || new Date(row.endsAt).getTime() > Date.now()))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt)).map(row => toActivity(row, joined.some(item => item.id === row.id) ? 'approved' : undefined));
  }, []);
  const remote = useRemote(loader, []);
  const next = remote.data[0];
  return <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={remote.loading} onRefresh={remote.reload} />}>
    <View style={styles.page}>
      <HomeHeader activityCount={remote.data.length} onCalendarPress={onMyActivitiesPress} onNotificationsPress={onNotificationsPress} onProfilePress={onProfilePress} />
      <RemoteState {...remote} onRetry={remote.reload} />
      {!remote.loading && !remote.error && (next ? <NextActivityCard activity={next} onGroup={() => onOpenGroup(next)} onPlan={() => onOpenActivity(next)} /> : <HomeEmptyState onMatch={onMatchPress} />)}
      <Pressable onPress={onPendingPress} style={styles.sectionHeading}><Text style={styles.switchLink}>Yêu cầu đang chờ duyệt →</Text></Pressable>
      <Pressable onPress={onMyActivitiesPress} style={styles.sectionHeading}><Text style={styles.sectionTitle}>Hoạt động của tôi →</Text></Pressable>
      <View style={{ flexDirection: wide ? 'row' : 'column', flexWrap: 'wrap', gap: 12 }}>{!remote.loading && !remote.error && remote.data.slice(1).map(item => <View key={item.id} style={{ width: wide ? '48%' : '100%' }}><ActivityScheduleItem key={item.id} activity={item} onPress={() => onOpenGroup(item)} status={item.requestStatus === 'approved' ? 'Đã tham gia' : 'Bạn tổ chức'} /></View>)}</View>
    </View>
  </ScrollView>;
}
const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 28 },
  emptyScroll: { flexGrow: 1, paddingBottom: 24 },
  page: { alignSelf: 'center', flex: 1, maxWidth: layout.maxWidth, paddingHorizontal: 16, width: '100%' },
  calendarHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  pageTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  switchLink: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2, marginTop: 24 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
});
