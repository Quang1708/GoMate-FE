import { imageUrl } from '../../services/profileService';
import { Image, ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RouteMap } from '../RouteMap';
import { Activity } from '../../data/activities';
import { useLanguage } from '../../i18n/LanguageContext';
import { colors, radii, shadows, typography } from '../../theme';
import { Text } from '../LocalizedText';
import { PreferencesSummary } from '../ActivityChoices';
import { BusinessIdentity } from '../BusinessIdentity';

export function MatchHeader({ distance = 'Chưa có vị trí', onBack, onFilter }: { onSearch?: () => void; distance?: string; onBack: () => void; onFilter: () => void }) {
  return (
    <View>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Quay lại" onPress={onBack} style={styles.headerButton}><Ionicons color={colors.text} name="chevron-back" size={24} /></Pressable>
        <Text style={styles.headerTitle}>Match</Text>
        <Pressable accessibilityLabel="Mở bộ lọc" onPress={onFilter} style={styles.headerButton}><Ionicons color={colors.primary} name="options-outline" size={23} /></Pressable>
      </View>
      <View style={styles.contextRow}>
        <ContextChip icon="location-outline" label="Khám phá hoạt động" />
        <Pressable accessibilityRole="button" accessibilityLabel="Chọn vị trí tìm kiếm" onPress={onFilter}><ContextChip icon="navigate" label={distance} /></Pressable>
      </View>
    </View>
  );
}

export function ActivityMatchCard({ preview = false, favorite = false, onFavorite, activity, canUndo, onMore, onUndo }: { preview?: boolean; favorite?: boolean; onFavorite?: () => void; activity: Activity; canUndo: boolean; onMore: () => void; onUndo: () => void }) {
  const { language } = useLanguage();
  return (
    <View style={[styles.cardShadow, activity.organizerType === 'business' && { borderWidth: 2, borderColor: '#44A58E', borderRadius: 24 }]}>
      <View style={styles.card}>
        <ImageBackground resizeMode="cover" source={activity.image} style={styles.cover}>
          <View style={styles.coverTop}>
            {!preview && <View style={styles.topActions}>
              <Pressable accessibilityLabel="Quay lại hoạt động trước" disabled={!canUndo} onPress={onUndo} style={[styles.coverAction, !canUndo && styles.coverActionDisabled]}><Ionicons color={colors.primary} name="arrow-undo" size={19} /></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={favorite ? 'Bỏ lưu hoạt động' : 'Lưu hoạt động yêu thích'} accessibilityState={{ selected: favorite }} onPress={onFavorite} style={styles.coverAction}><Ionicons color={colors.primary} name={favorite ? 'heart' : 'heart-outline'} size={22} /></Pressable>
              <Pressable accessibilityLabel="Tùy chọn và báo cáo hoạt động" onPress={onMore} style={styles.coverAction}><Ionicons color={colors.text} name="ellipsis-horizontal" size={22} /></Pressable>
            </View>}
          </View>
        </ImageBackground>

        <View style={styles.summary}>
          <View style={styles.badgeRow}>
            <View style={styles.category}><Text style={styles.categoryText}>{activity.category}</Text></View>
            <View style={styles.memberBadge}><Ionicons color={colors.textSecondary} name="people" size={16} /><Text style={styles.memberText}>{activity.members} {language === 'vi' ? 'thành viên' : 'members'}</Text></View>
          </View>
          {activity.organizerType === 'business' ? <BusinessIdentity activity={activity} showOffer /> : <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Cá nhân tổ chức</Text>}
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <View style={styles.metaList}>
            <Meta icon="calendar-outline" text={activity.time} />
            {activity.endsAt && <Meta icon="calendar-outline" text={'Kết thúc: ' + new Date(activity.endsAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })} />}
            <Meta icon="location-outline" text={`${activity.location} • ${activity.distance}`} />
            {activity.reservedSeats ? <Text style={styles.body}>Có {activity.reservedSeats} bạn đi cùng host trong số thành viên.</Text> : null}
          </View>
        </View>

        <View style={styles.details}>
          <DetailSection title="Giới thiệu"><Text style={styles.body}>{activity.description}</Text></DetailSection>
          <PreferencesSummary value={activity.participantPreferences} />
          <DetailSection title="Host hoạt động">
            <View style={styles.hostDetail}>
              <View style={styles.hostAvatarLarge}>{activity.hostAvatarUrl ? <Image source={{ uri: imageUrl(activity.hostAvatarUrl) }} style={{ width: 44, height: 44, borderRadius: 22 }} /> : <Text style={styles.hostInitialLarge}>{activity.host.charAt(0)}</Text>}</View>
              <View style={styles.hostDetailCopy}><View style={styles.hostNameRow}><Text style={styles.hostDetailName}>{activity.host}</Text></View><Text style={styles.hostDetailMeta}>{activity.hostRating > 0 ? `★ ${activity.hostRating.toFixed(1)}` : 'Chưa có đánh giá'} • {activity.hostCompletedActivities} hoạt động đã hoàn tất</Text></View>
              <Ionicons color={colors.textMuted} name="chevron-forward" size={19} />
            </View>
          </DetailSection>
          {activity.requirements.length > 0 && <DetailSection title="Lưu ý">{activity.requirements.map((item) => <Bullet key={item} text={item} />)}</DetailSection>}
          {activity.coordinates && <DetailSection title="Bản đồ địa điểm"><RouteMap point={activity.coordinates} /></DetailSection>}
          {(activity.images?.length ?? 0) > 1 && <DetailSection title="Ảnh hoạt động"><View style={[styles.photoRow, { flexWrap: 'wrap' }]}>{activity.images!.map((source, index) => <ImageBackground accessibilityLabel={`Ảnh hoạt động ${index + 1}`} imageStyle={styles.photoImage} key={index} resizeMode="cover" source={source} style={[styles.photo, { flex: undefined, flexGrow: 0, flexShrink: 0, flexBasis: '31%', width: '31%' }]} />)}</View></DetailSection>}
        </View>
      </View>
    </View>
  );
}

export function MatchActions({ onInterested, onSkip }: { onInterested: () => void; onSkip: () => void }) {
  return (
    <View style={styles.actionBar}>
      <Pressable accessibilityLabel="Bỏ qua hoạt động" onPress={onSkip} style={({ pressed }) => [styles.skipAction, pressed && styles.pressed]}><Ionicons color={colors.match} name="close" size={34} /></Pressable>
      <Pressable accessibilityLabel="Gửi yêu cầu tham gia" onPress={onInterested} style={({ pressed }) => [styles.interestedAction, pressed && styles.pressed]}><Ionicons color={colors.white} name="checkmark" size={38} /></Pressable>
    </View>
  );
}

export function MatchState({ action, icon, message, onAction, title }: { action?: string; icon: 'options-outline' | 'cloud-offline-outline' | 'location-outline' | 'calendar-outline'; message: string; onAction?: () => void; title: string }) {
  return (
    <View style={styles.state}>
      <View style={styles.stateIcon}><Ionicons color={colors.primary} name={icon} size={30} /></View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateMessage}>{message}</Text>
      {action && onAction && <Pressable onPress={onAction} style={styles.stateButton}><Text style={styles.stateButtonText}>{action}</Text></Pressable>}
    </View>
  );
}

function ContextChip({ icon, label }: { icon: 'location-outline' | 'navigate'; label: string }) {
  return <View style={styles.contextChip}><Ionicons color={colors.textSecondary} name={icon} size={14} /><Text style={styles.contextText}>{label}</Text></View>;
}

function Meta({ icon, text }: { icon: 'calendar-outline' | 'location-outline' | 'people-outline' | 'briefcase-outline'; text: string }) {
  return <View style={styles.meta}><Ionicons color={colors.textSecondary} name={icon} size={17} /><Text style={styles.metaText}>{text}</Text></View>;
}

function DetailSection({ children, title }: { children: React.ReactNode; title: string }) {
  return <View style={styles.detailSection}><Text style={styles.detailTitle}>{title}</Text>{children}</View>;
}

function Bullet({ text, timeline = false }: { text: string; timeline?: boolean }) {
  return <View style={styles.bulletRow}><View style={[styles.bullet, timeline && styles.timelineBullet]} /><Text style={styles.bulletText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', flexDirection: 'row', height: 54, paddingHorizontal: 12 },
  headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  headerTitle: { color: colors.text, flex: 1, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  contextRow: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10, paddingHorizontal: 16 },
  contextChip: { alignItems: 'center', backgroundColor: colors.surfaceStrong, borderRadius: radii.pill, flexDirection: 'row', gap: 5, paddingHorizontal: 10, paddingVertical: 7 },
  contextText: { color: colors.textSecondary, fontSize: 11 },
  cardShadow: { backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, ...shadows.card },
  card: { backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden' },
  cover: { height: 322, padding: 12 },
  coverTop: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  topActions: { flexDirection: 'row', gap: 8 },
  coverAction: { alignItems: 'center', backgroundColor: colors.whiteStrong, borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  coverActionDisabled: { opacity: 0.42 },
  badgeRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', marginBottom: 10 },
  category: { backgroundColor: colors.primarySoft, borderRadius: radii.pill, flexShrink: 1, paddingHorizontal: 13, paddingVertical: 7 },
  categoryText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  memberBadge: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 7 },
  memberText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  summary: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -22, paddingBottom: 18, paddingHorizontal: 18, paddingTop: 14 },
  activityTitle: { color: colors.text, ...typography.title },
  hostNameRow: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  metaList: { gap: 9, marginTop: 15 },
  meta: { alignItems: 'center', flexDirection: 'row' },
  metaText: { color: colors.textSecondary, flex: 1, fontSize: 12.5, marginLeft: 10 },
  details: { borderTopColor: colors.border, borderTopWidth: 1, paddingHorizontal: 18 },
  detailSection: { borderBottomColor: colors.border, borderBottomWidth: 1, paddingVertical: 17 },
  detailTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 8 },
  body: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  hostDetail: { alignItems: 'center', flexDirection: 'row' },
  hostAvatarLarge: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  hostInitialLarge: { color: colors.primary, fontSize: 17, fontWeight: '800' },
  hostDetailCopy: { flex: 1, marginLeft: 10 },
  hostDetailName: { color: colors.text, fontSize: 13, fontWeight: '700' },
  hostDetailMeta: { color: colors.textSecondary, fontSize: 10.5, marginTop: 4 },
  bulletRow: { alignItems: 'center', flexDirection: 'row', marginTop: 7 },
  bullet: { backgroundColor: colors.success, borderRadius: 4, height: 7, width: 7 },
  timelineBullet: { backgroundColor: colors.primary },
  bulletText: { color: colors.textSecondary, flex: 1, fontSize: 12.5, marginLeft: 9 },
  photoRow: { flexDirection: 'row', gap: 7, width: '100%' },
  photo: { borderRadius: 10, flex: 1, height: 82, overflow: 'hidden' },
  photoImage: { borderRadius: 10, height: '100%', width: '100%' },
  photoMore: { alignItems: 'center', backgroundColor: colors.surfaceStrong, borderRadius: 10, flex: 1, height: 82, justifyContent: 'center' },
  photoMoreText: { color: colors.textSecondary, fontSize: 14, fontWeight: '700' },
  actionBar: { alignItems: 'center', flexDirection: 'row', gap: 46, justifyContent: 'center', paddingBottom: 10, paddingTop: 8 },
  skipAction: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 32, borderWidth: 1, height: 64, justifyContent: 'center', width: 64, ...shadows.card },
  interestedAction: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 36, height: 72, justifyContent: 'center', width: 72, ...shadows.floating },
  pressed: { opacity: 0.78, transform: [{ scale: 0.96 }] },
  state: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  stateIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 30, height: 68, justifyContent: 'center', width: 68 },
  stateTitle: { color: colors.text, fontSize: 21, fontWeight: '800', marginTop: 18, textAlign: 'center' },
  stateMessage: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 7, maxWidth: 320, textAlign: 'center' },
  stateButton: { backgroundColor: colors.primary, borderRadius: radii.pill, marginTop: 20, paddingHorizontal: 20, paddingVertical: 13 },
  stateButtonText: { color: colors.white, fontSize: 13, fontWeight: '700' },
});
