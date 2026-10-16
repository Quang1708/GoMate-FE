import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useProfile } from '../services/ProfileContext';
import { UserAvatar } from '../components/UserAvatar';
import { BrandLogo } from '../components/BrandLogo';
import { Text } from '../components/LocalizedText';
import { colors, layout, shadows } from '../theme';


type MatchHubScreenProps = {
  onDiscover: () => void;
  onFavorites: () => void;
  onPending: () => void;
  onManage: () => void;
  onNotifications: () => void;
  onPreviewProfile: () => void;
  onProfile: () => void;
  pendingCount?: number;
  hostRequestCount?: number;
};

export function MatchHubScreen({
  onDiscover,
  onFavorites,
  onPending,
  onManage,
  onNotifications,
  onPreviewProfile,
  onProfile,
  pendingCount = 2,
  hostRequestCount = 3,
}: MatchHubScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.page}>
        <MatchHubHeader onNotifications={onNotifications} onProfile={onProfile} />
        <Text style={styles.title}>Match</Text>

        <MatchHero onPress={onDiscover} />
        <Pressable accessibilityRole="button" onPress={onFavorites} style={styles.profileAction}><Ionicons name="heart-outline" size={22} color={colors.primary} /><Text style={styles.profileActionText}>Hoạt động yêu thích</Text><Ionicons name="chevron-forward" size={18} color={colors.primary} /></Pressable>

        <Text style={styles.sectionTitle}>Hoạt động của bạn</Text>
        <View style={styles.managementCard}>
          <ManagementRow
            badgeCount={pendingCount}
            icon="time-outline"
            onPress={onPending}
            subtitle={pendingCount > 0 ? 'Đang chờ' : 'Không có yêu cầu'}
            title="Yêu cầu tham gia"
          />
          <View style={styles.rowDivider} />
          <ManagementRow
            badgeCount={hostRequestCount}
            icon="people-outline"
            onPress={onManage}
            subtitle={hostRequestCount > 0 ? 'Yêu cầu mới' : 'Không có yêu cầu'}
            title="Tôi tổ chức"
          />
        </View>

        <Text style={styles.profileSectionTitle}>Hồ sơ của bạn</Text>
        <ProfilePreviewCard onPress={onPreviewProfile} />
      </View>
    </ScrollView>
  );
}

function MatchHubHeader({ onNotifications, onProfile }: { onNotifications: () => void; onProfile: () => void }) {
  return (
    <View style={styles.header}>
      <BrandLogo compact />
      <View style={styles.headerActions}>
        <Pressable accessibilityLabel="Thông báo" onPress={onNotifications} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Ionicons color={colors.textSecondary} name="notifications-outline" size={23} />
          <View style={styles.notificationDot} />
        </Pressable>
        <UserAvatar onPress={onProfile} />
      </View>
    </View>
  );
}

function MatchHero({ onPress }: { onPress: () => void }) {
  const [motion] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, { duration: 2200, easing: Easing.inOut(Easing.sin), toValue: 1, useNativeDriver: true }),
        Animated.timing(motion, { duration: 2200, easing: Easing.inOut(Easing.sin), toValue: 0, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [motion]);

  const rippleStyle = {
    opacity: motion.interpolate({ inputRange: [0, 1], outputRange: [0.34, 0.8] }),
    transform: [{ scale: motion.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.04] }) }],
  };
  const floatUp = motion.interpolate({ inputRange: [0, 1], outputRange: [5, -7] });
  const floatDown = motion.interpolate({ inputRange: [0, 1], outputRange: [-4, 7] });

  return (
    <View style={styles.heroArea}>
      <Animated.View style={[styles.rippleOuter, rippleStyle]} />
      <View style={styles.rippleInner} />
      <Animated.View style={[styles.bubble, styles.bubbleOne, { transform: [{ translateY: floatUp }] }]} />
      <Animated.View style={[styles.bubble, styles.bubbleTwo, { transform: [{ translateY: floatDown }] }]} />
      <Animated.View style={[styles.bubble, styles.bubbleThree, { opacity: rippleStyle.opacity, transform: [{ translateY: floatUp }] }]} />
      <Pressable accessibilityHint="Mở màn hình Match" accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.orbPressable, pressed && styles.orbPressed]}>
        <LinearGradient colors={[colors.discoveryStart, colors.discoveryMiddle, colors.discoveryEnd]} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={styles.discoveryOrb}>
          <View style={styles.matchIcon}><Ionicons color={colors.primary} name="search" size={25} /></View>
          <View style={styles.heroLabelRow}>
            <Text style={styles.heroTitle}>Tìm hoạt động</Text>
            <Ionicons color={colors.primary} name="arrow-forward" size={18} />
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

type ManagementRowProps = {
  badgeCount: number;
  icon: 'time-outline' | 'people-outline';
  onPress: () => void;
  subtitle: string;
  title: string;
};

function ManagementRow({ badgeCount, icon, onPress, subtitle, title }: ManagementRowProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.managementRow, pressed && styles.rowPressed]}>
      <View style={styles.managementIcon}><Ionicons color={colors.primary} name={icon} size={20} /></View>
      <View style={styles.managementCopy}>
        <Text style={styles.managementTitle}>{title}</Text>
        <Text style={styles.managementSubtitle}>{subtitle}</Text>
      </View>
      {badgeCount > 0 && <View style={styles.countBadge}><Text style={styles.countBadgeText}>{badgeCount}</Text></View>}
      <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
    </Pressable>
  );
}

function ProfilePreviewCard({ onPress }: { onPress: () => void }) {
  const { profile } = useProfile();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.profileCard, pressed && styles.pressed]}>
      <View style={styles.profileIdentity}>
        <UserAvatar size={58} />
        <View style={styles.profileCopy}>
          <View style={styles.profileNameRow}>
            <Text style={styles.profileName}>{profile?.name}</Text>
            <Ionicons color={colors.success} name="checkmark-circle" size={16} />
          </View>
          <View style={styles.profileStats}>
            <Ionicons color={colors.warning} name="star" size={13} />
            <Text style={styles.profileMeta}>{profile?.location}</Text>
            <View style={styles.metaDot} />
            <Text style={styles.profileMeta}>{profile?.interests.length || 0} sở thích</Text>
          </View>
        </View>
      </View>
      <View style={styles.profileAction}>
        <Text style={styles.profileActionText}>Xem như người khác</Text>
        <Ionicons color={colors.primary} name="arrow-forward" size={17} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 24 },
  page: { alignSelf: 'center', maxWidth: layout.maxWidth, paddingHorizontal: 20, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10 },
  headerActions: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  iconButton: { alignItems: 'center', borderRadius: 19, height: 40, justifyContent: 'center', width: 40 },
  notificationDot: { backgroundColor: colors.match, borderColor: colors.background, borderRadius: 5, borderWidth: 2, height: 9, position: 'absolute', right: 7, top: 6, width: 9 },
  headerAvatar: { borderColor: colors.surface, borderRadius: 20, borderWidth: 2, height: 40, width: 40 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800', letterSpacing: -0.8, marginTop: 8 },
  heroArea: { alignItems: 'center', height: 280, justifyContent: 'center', marginTop: 0 },
  rippleOuter: { borderColor: colors.discoveryRipple, borderRadius: 140, borderWidth: 1, height: 280, position: 'absolute', width: 280 },
  rippleInner: { borderColor: colors.discoveryRippleStrong, borderRadius: 126, borderWidth: 1, height: 252, position: 'absolute', width: 252 },
  orbPressable: { borderRadius: 114 },
  discoveryOrb: { alignItems: 'center', borderRadius: 114, height: 228, justifyContent: 'center', width: 228 },
  matchIcon: { alignItems: 'center', backgroundColor: colors.whiteStrong, borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  heroLabelRow: { alignItems: 'center', flexDirection: 'row', gap: 7, marginTop: 14 },
  heroTitle: { color: colors.ink, fontSize: 20, fontWeight: '700', letterSpacing: -0.25 },
  bubble: { backgroundColor: colors.primaryLight, borderColor: colors.whiteStrong, borderRadius: 10, borderWidth: 2, position: 'absolute' },
  bubbleOne: { height: 14, left: 35, top: 59, width: 14 },
  bubbleTwo: { bottom: 43, height: 10, right: 45, width: 10 },
  bubbleThree: { height: 7, right: 27, top: 91, width: 7 },
  orbPressed: { opacity: 0.82, transform: [{ scale: 0.97 }] },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '700', marginBottom: 10, marginTop: 4 },
  managementCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, overflow: 'hidden', ...shadows.card },
  managementRow: { alignItems: 'center', flexDirection: 'row', minHeight: 68, paddingHorizontal: 14 },
  managementIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 13, height: 40, justifyContent: 'center', width: 40 },
  managementCopy: { flex: 1, marginLeft: 12 },
  managementTitle: { color: colors.ink, fontSize: 13.5, fontWeight: '700' },
  managementSubtitle: { color: colors.textMuted, fontSize: 10.5, marginTop: 3 },
  countBadge: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 11, height: 22, justifyContent: 'center', marginRight: 7, minWidth: 22, paddingHorizontal: 6 },
  countBadgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  rowDivider: { backgroundColor: colors.border, height: StyleSheet.hairlineWidth, marginLeft: 66 },
  rowPressed: { backgroundColor: colors.surfaceMuted },
  profileSectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '700', marginBottom: 10, marginTop: 18 },
  profileCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, padding: 14, ...shadows.card },
  profileIdentity: { alignItems: 'center', flexDirection: 'row' },
  profileAvatar: { borderRadius: 25, height: 50, width: 50 },
  profileCopy: { flex: 1, marginLeft: 12 },
  profileNameRow: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  profileName: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  profileStats: { alignItems: 'center', flexDirection: 'row', marginTop: 5 },
  profileMeta: { color: colors.textSecondary, fontSize: 11, marginLeft: 4 },
  metaDot: { backgroundColor: colors.textMuted, borderRadius: 2, height: 3, marginLeft: 8, width: 3 },
  profileAction: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 11 },
  profileActionText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  pressed: { opacity: 0.74, transform: [{ scale: 0.99 }] },
});
