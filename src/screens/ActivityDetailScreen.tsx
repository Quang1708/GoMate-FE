import { useEffect, useState } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '../components/LocalizedText';
import { GradientButton } from '../components/GradientButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { RouteMap } from '../components/RouteMap';
import { BusinessIdentity } from '../components/BusinessIdentity';
import { Activity } from '../data/activities';
import { colors, layout, radii } from '../theme';
import { genderOptions, religionOptions } from '../components/ActivityChoices';

export function ActivityDetailScreen({ activity, error, isHost = false, onBack, onPrimary, onViewPeople }: { activity: Activity; error?: string; isHost?: boolean; onBack: () => void; onPrimary: () => void; onViewPeople: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer); }, []);
  const unavailable = activity.backendStatus === 'completed' || activity.backendStatus === 'in-progress' || Boolean(activity.startsAt && new Date(activity.startsAt).getTime() <= now) || Number(activity.members.split('/')[0]) >= Number(activity.members.split('/')[1]);
  const blocked = unavailable && !isHost && activity.requestStatus !== 'approved' && activity.requestStatus !== 'pending';
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader onBack={onBack} title="Chi tiết hoạt động" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.page}>
          {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
          <ImageBackground imageStyle={styles.heroImage} source={activity.image} style={styles.hero}>
            <LinearGradient colors={['transparent', colors.overlayStrong]} style={styles.heroGradient}>
              <View style={styles.category}><Text style={styles.categoryText}>{activity.category}</Text></View>
              <Text style={styles.title}>{activity.title}</Text>
            </LinearGradient>
          </ImageBackground>
          <BusinessIdentity activity={activity} details />
          {Boolean(activity.images?.length) && <ScrollView horizontal contentContainerStyle={{ gap: 10, paddingVertical: 12 }}>{activity.images!.map((source, index) => <Image key={index} source={source} style={{ width: 160, height: 120, borderRadius: 14 }} />)}</ScrollView>}

          <View style={styles.infoGrid}>
            <Info icon="calendar-outline" label="Thời gian" value={activity.time} />
            <Info icon="location-outline" label="Địa điểm" value={activity.location} />
            <Info icon="navigate-outline" label="Khoảng cách" value={activity.distance} />
          </View>

          {activity.coordinates && <RouteMap point={activity.coordinates} />}
          <Pressable onPress={onViewPeople} style={styles.hostCard}>
            <View style={styles.hostAvatar}><Text style={styles.hostInitial}>{activity.host.charAt(0)}</Text></View>
            <View style={styles.hostCopy}>
              <View style={styles.hostNameRow}><Text style={styles.hostName}>{activity.host}</Text><Ionicons color={colors.success} name="checkmark-circle" size={17} /></View>
              <Text style={styles.hostMeta}>★ {activity.hostRating} · {activity.hostCompletedActivities} hoạt động đã hoàn thành</Text>
            </View>
            <Ionicons color={colors.textMuted} name="chevron-forward" size={19} />
          </Pressable>

          <Section title="Thông tin hoạt động"><Text style={styles.body}>{activity.description}</Text></Section>
          <Section title={`Thành viên (${activity.members})`}><Text style={styles.body}>Tối thiểu {activity.minParticipants ?? 2} thành viên, tính cả host.</Text></Section>
          {activity.meetingPoint ? <Section title="Điểm tập trung"><Text style={styles.body}>{activity.meetingPoint}</Text></Section> : null}
          {activity.participantPreferences && <Section title="Tùy chọn nhóm">
            {(activity.participantPreferences.minAge || activity.participantPreferences.maxAge) ? <Bullet text={`Độ tuổi: ${activity.participantPreferences.minAge || 12}–${activity.participantPreferences.maxAge || 120}`} /> : null}
            {activity.participantPreferences.genders.length ? <Bullet text={`Giới tính: ${activity.participantPreferences.genders.map(value => genderOptions.find(([key]) => key === value)?.[1] || value).join(', ')}`} /> : null}
            {activity.participantPreferences.languages.length ? <Bullet text={`Ngôn ngữ: ${activity.participantPreferences.languages.join(', ')}`} /> : null}
            {activity.participantPreferences.religions.length ? <Bullet text={`Tôn giáo: ${activity.participantPreferences.religions.map(value => religionOptions.find(([key]) => key === value)?.[1] || value).join(', ')}`} /> : null}
            {activity.participantPreferences.alcohol !== 'any' ? <Bullet text={activity.participantPreferences.alcohol === 'yes' ? 'Có thể uống rượu' : 'Không uống rượu'} /> : null}
            {activity.participantPreferences.dressCode ? <Bullet text={`Dress code: ${activity.participantPreferences.dressCode}`} /> : null}
          </Section>}
          <Section title="Yêu cầu">
            {activity.requirements.map((item) => <Bullet key={item} text={item} />)}
          </Section>
          <GradientButton disabled={blocked} label={blocked ? 'Hoạt động không còn nhận thành viên' : activity.requestStatus === 'pending' ? 'Hủy yêu cầu tham gia' : activity.requestStatus === 'approved' ? 'Mở nhóm hoạt động' : isHost ? 'Quản lý hoạt động' : 'Gửi yêu cầu tham gia'} onPress={onPrimary} style={styles.cta} trailing={<Ionicons color={colors.white} name={isHost ? 'settings-outline' : 'heart'} size={19} />} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Info({ icon, label, value }: { icon: 'calendar-outline' | 'location-outline' | 'navigate-outline' | 'wallet-outline'; label: string; value: string }) {
  return <View style={styles.info}><View style={styles.infoIcon}><Ionicons color={colors.primary} name={icon} size={18} /></View><Text style={styles.infoLabel}>{label}</Text><Text numberOfLines={2} style={styles.infoValue}>{value}</Text></View>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

function Bullet({ text, timeline = false }: { text: string; timeline?: boolean }) {
  return <View style={styles.bulletRow}><View style={[styles.bullet, timeline && styles.timelineBullet]} /><Text style={styles.bulletText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  scrollContent: { paddingBottom: 26 },
  page: { alignSelf: 'center', maxWidth: layout.maxWidth, padding: 16, width: '100%' },
  hero: { height: 290, overflow: 'hidden' },
  heroImage: { borderRadius: radii.largeCard },
  heroGradient: { borderRadius: radii.largeCard, flex: 1, justifyContent: 'flex-end', padding: 18 },
  category: { alignSelf: 'flex-start', backgroundColor: colors.whiteGlass, borderRadius: 999, marginBottom: 9, paddingHorizontal: 10, paddingVertical: 6 },
  categoryText: { color: colors.white, fontSize: 11, fontWeight: '800' },
  title: { color: colors.white, fontSize: 27, fontWeight: '900' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  info: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.input, borderWidth: 1, minHeight: 105, padding: 12, width: '48.5%' },
  infoIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 11, height: 32, justifyContent: 'center', width: 32 },
  infoLabel: { color: colors.textMuted, fontSize: 10, marginTop: 9 },
  infoValue: { color: colors.text, fontSize: 12, fontWeight: '800', lineHeight: 17, marginTop: 3 },
  hostCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.card, borderWidth: 1, flexDirection: 'row', marginTop: 14, padding: 14 },
  hostAvatar: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 23, height: 48, justifyContent: 'center', width: 48 },
  hostInitial: { color: colors.primary, fontSize: 18, fontWeight: '900' },
  hostCopy: { flex: 1, marginLeft: 11 },
  hostNameRow: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  hostName: { color: colors.text, fontSize: 14, fontWeight: '900' },
  hostMeta: { color: colors.textSecondary, fontSize: 10.5, marginTop: 5 },
  section: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.card, borderWidth: 1, marginTop: 14, padding: 16 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginBottom: 9 },
  body: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  bulletRow: { alignItems: 'center', flexDirection: 'row', marginTop: 7 },
  bullet: { backgroundColor: colors.success, borderRadius: 4, height: 7, width: 7 },
  timelineBullet: { backgroundColor: colors.primary },
  bulletText: { color: colors.textSecondary, flex: 1, fontSize: 12.5, marginLeft: 9 },
  cta: { marginTop: 18 },
});
