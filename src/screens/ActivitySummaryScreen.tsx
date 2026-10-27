import { FriendRequestButton } from '../components/FriendRequestButton';
import { getSession } from '../services/api';
import { useCallback } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '../components/LocalizedText';
import { GradientButton } from '../components/GradientButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { Activity } from '../data/activities';
import { getActivity, listAttendance, listUpdates, listMembers } from '../services/activityApi';
import { useRemote } from '../services/useRemote';
import { RemoteState } from '../components/RemoteState';
import { colors, layout, radii } from '../theme';

export function ActivitySummaryScreen({ activity, onBack, onRate }: { activity: Activity; onBack: () => void; onRate: () => void }) {
  const loader = useCallback(async () => { const [current, attendance, updates, members] = await Promise.all([getActivity(activity.id), listAttendance(activity.id), listUpdates(activity.id), listMembers(activity.id)]); return { current, attendance, updates, members }; }, [activity.id]);
  const remote = useRemote(loader, null);
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader onBack={onBack} title="Tổng kết hoạt động" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.page}>
          <Image source={activity.image} style={styles.image} />
          <View style={styles.success}><Ionicons color={colors.success} name="checkmark-circle" size={28} /><View style={styles.successCopy}><Text style={styles.successTitle}>Hoạt động đã hoàn thành</Text><Text style={styles.successText}>{activity.title} · {activity.members} thành viên</Text></View></View>
          <RemoteState {...remote} onRetry={remote.reload} />
          {remote.data && <>
            <View style={styles.stats}><Stat label="Có mặt / đến muộn" value={String(remote.data.attendance.filter(item => ['present', 'late'].includes(item.status)).length)} /><View style={styles.divider} /><Stat label="Cập nhật" value={String(remote.data.updates.length)} /><View style={styles.divider} /><Stat label="Ảnh" value={String(activity.images?.length || 0)} /></View>
            {Boolean(activity.images?.length) && <View style={styles.card}><Text style={styles.cardTitle}>Ảnh hoạt động</Text><ScrollView horizontal contentContainerStyle={{ gap: 8 }}>{activity.images!.map((source, index) => <Image key={index} source={source} style={{ width: 140, height: 100, borderRadius: 14 }} />)}</ScrollView></View>}
            <View style={styles.card}><Text style={styles.cardTitle}>Kết bạn với người đồng hành</Text>{remote.data.members.filter(member => member.userId !== getSession()?.user.id && remote.data!.attendance.some(item => item.userId === member.userId && ['present', 'late'].includes(item.status))).map(member => <View key={member.userId} style={{ gap: 10, paddingVertical: 12 }}><Text>{member.name}</Text><FriendRequestButton userId={member.userId} /></View>)}</View>
          </>}
          <GradientButton label="Đánh giá trải nghiệm" onPress={onRate} trailing={<Ionicons color={colors.white} name="star" size={18} />} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { paddingBottom: 28 },
  page: { alignSelf: 'center', maxWidth: layout.maxWidth, padding: 18, width: '100%' },
  image: { borderRadius: radii.largeCard, height: 210, width: '100%' },
  success: { alignItems: 'center', backgroundColor: colors.successSoft, borderRadius: radii.card, flexDirection: 'row', marginTop: 13, padding: 15 },
  successCopy: { flex: 1, marginLeft: 10 },
  successTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  successText: { color: colors.textSecondary, fontSize: 10.5, marginTop: 4 },
  stats: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.card, borderWidth: 1, flexDirection: 'row', marginTop: 13, paddingVertical: 16 },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '900' },
  statLabel: { color: colors.textMuted, fontSize: 9.5, marginTop: 4 },
  divider: { backgroundColor: colors.border, height: 30, width: 1 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.card, borderWidth: 1, marginBottom: 13, marginTop: 13, padding: 16 },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  summaryLabel: { color: colors.textSecondary, fontSize: 12 },
  summaryValue: { color: colors.text, fontSize: 12, fontWeight: '800' },
  summarySuccess: { color: colors.success },
  photoGrid: { flexDirection: 'row', gap: 8 },
  photo: { borderRadius: 14, height: 88, width: '31.8%' },
});
