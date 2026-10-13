import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { Activity } from '../data/activities';
import { PersonProfile } from '../data/people';
import { MembersPanel } from './MembershipViews';
import { colors, layout } from '../theme';
export function HostMembersScreen({ activity, onBack, onLeft }: { activity: Activity; onBack: () => void; onLeft: () => void; onViewProfile: (person: PersonProfile) => void }) {
  return <SafeAreaView style={styles.safeArea}><ScreenHeader onBack={onBack} subtitle={activity.title} title="Host & thành viên" /><ScrollView contentContainerStyle={styles.page}><MembersPanel activity={activity} onLeft={onLeft} /></ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { paddingBottom: 24 },
  page: { alignSelf: 'center', maxWidth: layout.maxWidth, padding: 18, width: '100%' },
  sectionLabel: { color: colors.textMuted, fontSize: 9.5, fontWeight: '900', letterSpacing: 1.1, marginBottom: 9, marginTop: 10 },
  hostCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 21, borderWidth: 1, flexDirection: 'row', padding: 14 },
  hostAvatar: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 23, height: 52, justifyContent: 'center', width: 52 },
  hostInitial: { color: colors.primary, fontSize: 18, fontWeight: '900' },
  copy: { flex: 1, marginLeft: 11 },
  nameLine: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  hostName: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  note: { color: colors.body, fontSize: 10.5, marginTop: 4 },
  viewProfile: { color: colors.primary, fontSize: 9.5, fontWeight: '800', marginTop: 5 },
  trustCard: { alignItems: 'center', backgroundColor: colors.successSoft, borderRadius: 15, flexDirection: 'row', marginTop: 10, padding: 12 },
  trustText: { color: colors.successText, fontSize: 10.5, marginLeft: 8 },
  memberRow: { alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', padding: 14 },
  memberAvatar: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 20, height: 42, justifyContent: 'center', width: 42 },
  memberInitial: { color: colors.primary, fontSize: 14, fontWeight: '900' },
  memberName: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  pressed: { opacity: 0.68 },
});
