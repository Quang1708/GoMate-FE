import { ProfileAvatar } from '../ProfileAvatar';
import { UnreadDot } from '../UnreadDot';
import { ComponentProps } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../../services/ProfileContext';
import { LinearGradient } from 'expo-linear-gradient';

import { Activity } from '../../data/activities';
import { colors, radii, shadows, typography } from '../../theme';
import { UserAvatar } from '../UserAvatar';
import { BrandLogo } from '../BrandLogo';
import { Text } from '../LocalizedText';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type HomeAction = {
  id: string;
  icon: IconName;
  color: string;
  background: string;
  title: string;
  subtitle: string;
  time: string;
  onPress: () => void;
};

export function HomeHeader({ activityCount, onCalendarPress, onNotificationsPress, onProfilePress, showGreeting = true }: { activityCount: number; onCalendarPress: () => void; onNotificationsPress: () => void; onProfilePress: () => void; showGreeting?: boolean }) {
  const { profile } = useProfile();
  return (
    <View>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><UserAvatar onPress={onProfilePress} /><BrandLogo compact /></View>
        <View style={styles.headerActions}>
          <Pressable accessibilityLabel="Thông báo" onPress={onNotificationsPress} style={styles.notificationButton}><Ionicons color={colors.text} name="notifications-outline" size={23} /><UnreadDot kind="notifications" style={styles.notificationDot} /></Pressable>
        </View>
      </View>
      {showGreeting && <><Text style={styles.greetingLabel}>Xin chào,</Text><Text style={styles.greetingName}>{profile?.name || 'Bạn'} 👋</Text><View style={styles.greetingMetaRow}><Text style={styles.greetingMeta}>{activityCount > 0 ? `Bạn có ${activityCount} hoạt động sắp tới` : 'Bạn chưa có hoạt động nào'}</Text>{activityCount > 0 && <Pressable onPress={onCalendarPress}><Text style={styles.calendarLink}>Xem lịch</Text></Pressable>}</View></>}
    </View>
  );
}

export function NextActivityCard({ activity, onGroup, onPlan }: { activity: Activity; onGroup: () => void; onPlan: () => void }) {
  return (
    <ImageBackground resizeMode="cover" source={activity.image} style={styles.nextCard}>
      <LinearGradient colors={[colors.overlaySubtle, colors.overlayMedium, colors.overlayHeavy]} locations={[0, 0.52, 1]} style={styles.nextOverlay}>
        <View style={styles.nextTopRow}><View style={styles.nextPill}><Ionicons color={colors.primary} name="time-outline" size={15} /><Text style={styles.nextPillText}>Hoạt động tiếp theo</Text></View><Text style={styles.countdown}>◷ Còn 5 giờ</Text></View>
        <View>
          <Text style={styles.nextTitle}>{activity.title}</Text>
          <ActivityMeta icon="calendar-outline" text={`${activity.time} – 21:00`} />
          <ActivityMeta icon="location" text={`${activity.location} • ${activity.distance}`} />
          <View style={styles.memberRow}><AvatarStack activity={activity} /><Text style={styles.memberText}>{activity.members} thành viên</Text></View>
          <View style={styles.nextActions}>
            <Pressable onPress={onPlan} style={styles.secondaryAction}><Ionicons color={colors.primary} name="calendar-clear-outline" size={20} /><Text style={styles.secondaryActionText}>Xem kế hoạch</Text></Pressable>
            <Pressable onPress={onGroup} style={styles.primaryAction}><Ionicons color={colors.white} name="chatbubble-ellipses-outline" size={19} /><Text style={styles.primaryActionText}>Vào nhóm</Text></Pressable>
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

export function ActionRequiredSection({ actions }: { actions: HomeAction[] }) {
  if (actions.length === 0) return null;
  return (
    <View>
      <View style={styles.sectionHeading}><View style={styles.sectionTitleRow}><Text style={styles.sectionTitle}>Cần bạn xử lý</Text><View style={styles.countBadge}><Text style={styles.countBadgeText}>{actions.length}</Text></View></View><Text style={styles.viewAll}>Xem tất cả</Text></View>
      <View style={styles.actionList}>{actions.map((action) => <Pressable key={action.id} onPress={action.onPress} style={styles.actionItem}><View style={[styles.actionIcon, { backgroundColor: action.background }]}><Ionicons color={action.color} name={action.icon} size={23} /></View><View style={styles.actionCopy}><Text style={styles.actionTitle}>{action.title}</Text><Text style={styles.actionSubtitle}>{action.subtitle}</Text></View><Text style={styles.actionTime}>{action.time}</Text><Ionicons color={colors.textMuted} name="chevron-forward" size={19} /></Pressable>)}</View>
    </View>
  );
}

export function ActivityCalendar({ onSelect, selectedDay }: { onSelect: (day: number) => void; selectedDay: number }) {
  const days = [{ label: 'T2', date: 15 }, { label: 'T3', date: 16 }, { label: 'T4', date: 17 }, { label: 'T5', date: 18 }, { label: 'T6', date: 19 }, { label: 'T7', date: 20 }, { label: 'CN', date: 21 }];
  return <View style={styles.calendar}>{days.map((day) => <Pressable key={day.date} onPress={() => onSelect(day.date)} style={[styles.day, selectedDay === day.date && styles.selectedDay]}><Text style={[styles.dayLabel, selectedDay === day.date && styles.selectedDayText]}>{day.label}</Text><Text style={[styles.dayDate, selectedDay === day.date && styles.selectedDayText]}>{day.date}</Text>{day.date === 19 && <View style={[styles.dayDot, selectedDay === day.date && styles.dayDotSelected]} />}</Pressable>)}</View>;
}

export function ActivityScheduleItem({ activity, status, time, onPress }: { activity: Activity; status: string; time?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.scheduleItem}>
      {time && <View style={styles.scheduleTime}><Text style={styles.scheduleTimeText}>{time}</Text></View>}
      <Image resizeMode="cover" source={activity.image} style={styles.scheduleImage} />
      <View style={styles.scheduleCopy}><Text numberOfLines={1} style={styles.scheduleTitle}>{activity.title}</Text><View style={styles.scheduleMeta}><Ionicons color={colors.textMuted} name="location" size={13} /><Text numberOfLines={1} style={styles.scheduleMetaText}>{activity.location}</Text></View><View style={styles.scheduleBottom}><AvatarStack activity={activity} compact /><Text style={styles.scheduleMembers}>{activity.members}</Text><View style={styles.statusPill}><Text style={styles.statusText}>{status}</Text></View></View></View>
      <Ionicons color={colors.textMuted} name="chevron-forward" size={19} />
    </Pressable>
  );
}

export function HomeEmptyState({ onMatch }: { onMatch: () => void }) {
  const benefits: { icon: IconName; label: string; color: string; background: string }[] = [
    { icon: 'people', label: 'Gặp gỡ\nngười mới', color: colors.primary, background: colors.primarySoft },
    { icon: 'flash', label: 'Tham gia\nhoạt động thú vị', color: colors.warning, background: colors.warningSoft },
    { icon: 'calendar', label: 'Mở rộng\ntrải nghiệm', color: colors.primary, background: colors.primarySoft },
  ];
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIllustration}><View style={styles.emptyMap}><Ionicons color={colors.primary} name="map" size={86} /></View><View style={styles.emptyPin}><Ionicons color={colors.white} name="location" size={42} /></View></View>
      <Text style={styles.emptyTitle}>Chưa có kế hoạch nào</Text>
      <Text style={styles.emptyText}>Bắt đầu Match để khám phá hoạt động và tìm người đồng hành phù hợp với bạn.</Text>
      <Pressable onPress={onMatch} style={styles.matchButton}><Text style={styles.matchButtonText}>Bắt đầu Match</Text><Ionicons color={colors.white} name="arrow-forward" size={20} /></Pressable>
      <View style={styles.benefitCard}>{benefits.map((benefit) => <View key={benefit.label} style={styles.benefit}><View style={[styles.benefitIcon, { backgroundColor: benefit.background }]}><Ionicons color={benefit.color} name={benefit.icon} size={23} /></View><Text style={styles.benefitText}>{benefit.label}</Text></View>)}</View>
    </View>
  );
}

function ActivityMeta({ icon, text }: { icon: IconName; text: string }) {
  return <View style={styles.nextMeta}><Ionicons color={colors.white} name={icon} size={17} /><Text style={styles.nextMetaText}>{text}</Text></View>;
}

function AvatarStack({ activity, compact = false }: { activity: Activity; compact?: boolean }) {
  const size = compact ? 22 : 34, count = Math.min(4, Math.max(0, Number(activity.members.split('/')[0]) || 0));
  return <View style={styles.avatarStack}>{Array.from({ length: count }, (_, index) => <View key={activity.memberAvatars?.[index]?.userId || index} style={{ marginLeft: index === 0 ? 0 : compact ? -7 : -10, borderWidth: 1.5, borderColor: 'white', borderRadius: size }}><ProfileAvatar size={size} uri={activity.memberAvatars?.[index]?.avatarUrl} name={activity.memberAvatars?.[index]?.name || 'Người đi cùng'} /></View>)}</View>;
}

const styles = StyleSheet.create({
  headerRow: { alignItems: 'center', flexDirection: 'row', height: 60, justifyContent: 'space-between' },
  headerActions: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  notificationButton: { alignItems: 'center', height: 42, justifyContent: 'center', position: 'relative', width: 42 },
  notificationDot: { backgroundColor: colors.danger, borderColor: colors.background, borderRadius: 5, borderWidth: 2, height: 10, position: 'absolute', right: 7, top: 6, width: 10 },
  avatar: { borderRadius: 23, height: 46, width: 46 },
  greetingLabel: { color: colors.textSecondary, fontSize: 16, lineHeight: 22, marginTop: 4 },
  greetingName: { color: colors.text, ...typography.display },
  greetingMetaRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  greetingMeta: { color: colors.textSecondary, fontSize: 13 },
  calendarLink: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  nextCard: { borderRadius: radii.card, height: 374, marginTop: 14, overflow: 'hidden' },
  nextOverlay: { flex: 1, justifyContent: 'space-between', padding: 16 },
  nextTopRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  nextPill: { alignItems: 'center', backgroundColor: colors.whiteStrong, borderRadius: radii.pill, flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 7 },
  nextPillText: { color: colors.primary, fontSize: 11.5, fontWeight: '700' },
  countdown: { color: colors.white, fontSize: 12.5, fontWeight: '600' },
  nextTitle: { color: colors.white, fontSize: 26, fontWeight: '800', lineHeight: 32 },
  nextMeta: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 8 },
  nextMetaText: { color: colors.white, fontSize: 13 },
  memberRow: { alignItems: 'center', flexDirection: 'row', marginTop: 13 },
  avatarStack: { alignItems: 'center', flexDirection: 'row' },
  memberAvatar: { borderColor: colors.white, borderRadius: 18, borderWidth: 2 },
  memberText: { color: colors.white, fontSize: 12, marginLeft: 10 },
  nextActions: { flexDirection: 'row', gap: 9, marginTop: 16 },
  secondaryAction: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 14, flex: 1, flexDirection: 'row', gap: 8, height: 52, justifyContent: 'center' },
  secondaryActionText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  primaryAction: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 14, flex: 1, flexDirection: 'row', gap: 8, height: 52, justifyContent: 'center' },
  primaryActionText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, marginTop: 22 },
  sectionTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '800' },
  countBadge: { alignItems: 'center', backgroundColor: colors.danger, borderRadius: 11, height: 22, justifyContent: 'center', minWidth: 22, paddingHorizontal: 6 },
  countBadgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  viewAll: { color: colors.primary, fontSize: 12.5 },
  actionList: { gap: 9 },
  actionItem: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', minHeight: 68, padding: 10, ...shadows.card },
  actionIcon: { alignItems: 'center', borderRadius: 12, height: 42, justifyContent: 'center', width: 42 },
  actionCopy: { flex: 1, marginLeft: 10 },
  actionTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  actionSubtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  actionTime: { color: colors.textMuted, fontSize: 10, marginRight: 5 },
  calendar: { backgroundColor: colors.surface, borderRadius: 18, flexDirection: 'row', marginTop: 10, padding: 8, ...shadows.card },
  day: { alignItems: 'center', borderRadius: 13, flex: 1, height: 62, justifyContent: 'center' },
  selectedDay: { backgroundColor: colors.primary },
  dayLabel: { color: colors.textSecondary, fontSize: 10.5 },
  dayDate: { color: colors.text, fontSize: 14, fontWeight: '600', marginTop: 5 },
  selectedDayText: { color: colors.white },
  dayDot: { backgroundColor: colors.primary, borderRadius: 3, bottom: 4, height: 5, position: 'absolute', width: 5 },
  dayDotSelected: { backgroundColor: colors.white },
  scheduleItem: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 17, borderWidth: 1, flexDirection: 'row', marginTop: 9, minHeight: 96, padding: 9 },
  scheduleTime: { alignItems: 'center', width: 48 },
  scheduleTimeText: { color: colors.textSecondary, fontSize: 10.5, lineHeight: 16, textAlign: 'center' },
  scheduleImage: { borderRadius: 13, height: 74, width: 78 },
  scheduleCopy: { flex: 1, marginLeft: 10 },
  scheduleTitle: { color: colors.text, fontSize: 13.5, fontWeight: '700' },
  scheduleMeta: { alignItems: 'center', flexDirection: 'row', marginTop: 5 },
  scheduleMetaText: { color: colors.textSecondary, flex: 1, fontSize: 10.5, marginLeft: 4 },
  scheduleBottom: { alignItems: 'center', flexDirection: 'row', marginTop: 7 },
  scheduleMembers: { color: colors.textSecondary, fontSize: 10.5, marginLeft: 5 },
  statusPill: { backgroundColor: colors.primarySoft, borderRadius: radii.pill, marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 5 },
  statusText: { color: colors.primary, fontSize: 9.5, fontWeight: '600' },
  emptyWrap: { alignItems: 'center', flex: 1, paddingTop: 46 },
  emptyIllustration: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 110, height: 210, justifyContent: 'center', width: 300 },
  emptyMap: { opacity: 0.44 },
  emptyPin: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 36, height: 72, justifyContent: 'center', position: 'absolute', top: 46, width: 72 },
  emptyTitle: { color: colors.text, fontSize: 23, fontWeight: '800', marginTop: 28 },
  emptyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 8, maxWidth: 340, textAlign: 'center' },
  matchButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radii.pill, flexDirection: 'row', gap: 10, height: 56, justifyContent: 'center', marginTop: 22, width: 250, ...shadows.floating },
  matchButtonText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  benefitCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, flexDirection: 'row', marginTop: 28, paddingVertical: 18, width: '100%' },
  benefit: { alignItems: 'center', flex: 1 },
  benefitIcon: { alignItems: 'center', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  benefitText: { color: colors.textSecondary, fontSize: 10.5, lineHeight: 15, marginTop: 8, textAlign: 'center' },
});
