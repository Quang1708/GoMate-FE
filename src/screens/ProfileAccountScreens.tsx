import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../components/LocalizedText';
import { ScreenHeader } from '../components/ScreenHeader';
import { RemoteState } from '../components/RemoteState';
import { useProfile } from '../services/ProfileContext';
import { getMyReviews } from '../services/profileService';
import { useRemote } from '../services/useRemote';
import { colors, layout } from '../theme';
export function VerificationStatusScreen({ onBack }: { onBack: () => void }) {
  const { profile } = useProfile();
  return <SafeAreaView style={styles.safe}><ScreenHeader title="Xác minh tài khoản" onBack={onBack} /><ScrollView contentContainerStyle={styles.page}>
    <View style={styles.card}><Ionicons name={profile?.emailVerified ? 'checkmark-circle' : 'mail-outline'} size={42} color={colors.success} /><Text style={styles.title}>{profile?.emailVerified ? 'Email đã xác minh' : 'Email chưa xác minh'}</Text><Text>{profile?.email}</Text><Text style={styles.note}>Email được xác minh khi bạn đăng ký hoặc đăng nhập bằng Google.</Text></View>
    <View style={styles.card}><Text style={styles.title}>Hồ sơ GoMate</Text><Text>{profile?.profileComplete ? 'Bạn đã hoàn thiện thông tin hồ sơ.' : 'Hãy hoàn thiện thông tin để người đồng hành hiểu bạn hơn.'}</Text><Text style={styles.note}>Xác minh email xác nhận quyền truy cập email của bạn. GoMate chưa cung cấp xác minh giấy tờ tùy thân.</Text></View>
  </ScrollView></SafeAreaView>;
}
export function MyReviewsScreen({ onBack }: { onBack: () => void }) {
  const remote = useRemote(getMyReviews, null);
  return <SafeAreaView style={styles.safe}><ScreenHeader title="Điểm đánh giá của tôi" onBack={onBack} /><ScrollView contentContainerStyle={styles.page}><RemoteState {...remote} onRetry={remote.reload} />
    {remote.data && !remote.loading && !remote.error && <><View style={styles.card}><Ionicons name="star" size={38} color={colors.primary} /><Text style={styles.score}>{remote.data.average === null ? 'Chưa có đánh giá' : `${remote.data.average.toFixed(1)} / 5`}</Text><Text style={styles.note}>{remote.data.count ? `${remote.data.count} đánh giá từ các hoạt động` : 'Đánh giá từ người đồng hành sẽ xuất hiện tại đây sau những hoạt động cùng nhau.'}</Text></View>
      {remote.data.items.map(item => <View key={item.id} style={styles.card}><Text style={styles.title}>{item.score} / 5 ★</Text>{item.activityTitle ? <Text>{item.activityTitle}</Text> : null}{item.comment ? <Text>{item.comment}</Text> : null}<Text style={styles.note}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text></View>)}</>}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, page: { alignSelf: 'center', width: '100%', maxWidth: Math.min(layout.maxWidth, 800), padding: 18, gap: 16 }, card: { borderRadius: 22, padding: 22, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, gap: 14 }, title: { fontSize: 20, color: colors.text, fontWeight: '700' }, note: { fontSize: 13, lineHeight: 20, color: colors.textSecondary }, score: { fontSize: 28, fontWeight: '700', color: colors.text } });
