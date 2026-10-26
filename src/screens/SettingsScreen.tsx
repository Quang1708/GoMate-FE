import { useFeedbackState } from '../services/feedback';
import { ComponentProps, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/LocalizedText';
import { ScreenHeader } from '../components/ScreenHeader';
import { FormField } from '../components/FormField';
import { GradientButton } from '../components/GradientButton';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { RemoteState } from '../components/RemoteState';
import { useProfile } from '../services/ProfileContext';
import { imageUrl } from '../services/profileService';
import { post, persistSession } from '../services/api';
import { AccountSettings, getAccountSettings, listBlockedUsers, listReports, saveAccountSettings, unblockUser } from '../services/communityService';
import { useRemote } from '../services/useRemote';
import { colors, layout } from '../theme';
export type SettingsPage = 'root' | 'account' | 'privacy' | 'notifications' | 'language' | 'password' | 'blocked' | 'reports' | 'help';
type Icon = ComponentProps<typeof Ionicons>['name'];
const titles: Record<SettingsPage, string> = { root: 'Cài đặt', account: 'Tài khoản', privacy: 'Quyền riêng tư & an toàn', notifications: 'Thông báo', language: 'Ngôn ngữ', password: 'Đổi mật khẩu', blocked: 'Tài khoản đã chặn', reports: 'Báo cáo của tôi', help: 'Trung tâm trợ giúp' };

export function SettingsScreen({ onBack, onLogout, page = 'root', onNavigate }: { onBack: () => void; onLogout: () => void; page?: SettingsPage; onNavigate: (page: SettingsPage) => void }) {
  const setPage = onNavigate;
  const [error, setError] = useFeedbackState(''), [saving, setSaving] = useState(false);
  const remote = useRemote(getAccountSettings, null);
  const locked = useRef(false), { profile } = useProfile();
  const save = async (patch: Partial<AccountSettings>) => {
    if (locked.current) return; locked.current = true; setSaving(true); setError('');
    try { remote.setData(await saveAccountSettings(patch)); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Chưa lưu được cài đặt'); }
    finally { locked.current = false; setSaving(false); }
  };
  const pref = remote.data;
  const toggle = (key: Exclude<keyof AccountSettings, 'directMessages'>, label: string, detail: string) => <View style={styles.setting}><View style={{ flex: 1, gap: 5 }}><Text style={styles.rowTitle}>{label}</Text><Text style={styles.note}>{detail}</Text></View><Switch accessibilityLabel={label} disabled={saving || !pref} value={pref?.[key] ?? false} onValueChange={value => void save({ [key]: value })} trackColor={{ false: colors.border, true: colors.primary }} /></View>;
  return <SafeAreaView style={styles.safe}><ScreenHeader title={titles[page]} onBack={page === 'root' ? onBack : () => { setError(''); setPage('root'); }} /><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    {page === 'root' && <>
      <View style={[styles.card, styles.profile]}>{profile?.avatarUrl ? <Image source={{ uri: imageUrl(profile.avatarUrl) }} style={styles.avatar} /> : <Ionicons name="person-circle-outline" size={48} color={colors.primary} />}<View style={{ flex: 1, gap: 5 }}><Text style={styles.heading}>{profile?.name}</Text><Text style={styles.note}>{profile?.email}</Text></View></View>
      <View style={styles.card}><Row icon="person-outline" title="Tài khoản" onPress={() => setPage('account')} /><Row icon="lock-closed-outline" title="Quyền riêng tư & an toàn" onPress={() => setPage('privacy')} /><Row icon="notifications-outline" title="Thông báo" onPress={() => setPage('notifications')} /></View>
      <View style={styles.card}><Row icon="globe-outline" title="Ngôn ngữ" onPress={() => setPage('language')} /><Row icon="flag-outline" title="Báo cáo của tôi" onPress={() => setPage('reports')} /><Row icon="help-circle-outline" title="Trung tâm trợ giúp" onPress={() => setPage('help')} /></View>
      <Pressable accessibilityRole="button" onPress={onLogout} style={styles.logout}><Ionicons name="log-out-outline" size={21} color={colors.danger} /><Text style={{ color: colors.danger, fontWeight: '700' }}>Đăng xuất</Text></Pressable>
    </>}
    {page === 'account' && <View style={styles.card}><Text style={styles.heading}>{profile?.name}</Text><Text style={styles.note}>Nickname</Text><Text>{profile?.username ? '@' + profile.username : 'Chưa đặt Nickname'}</Text><Text>{profile?.email}</Text><Text style={styles.note}>{profile?.emailVerified ? 'Email đã xác minh' : 'Email chưa xác minh'}</Text><Row icon="key-outline" title="Đổi mật khẩu" onPress={() => setPage('password')} /><Text style={styles.note}>Đổi mật khẩu sẽ đăng xuất tất cả thiết bị. Tài khoản Google chưa đặt mật khẩu tiếp tục dùng Google để đăng nhập.</Text></View>}
    {page === 'password' && <PasswordForm onDone={onLogout} />}
    {(page === 'privacy' || page === 'notifications') && <><RemoteState {...remote} onRetry={remote.reload} />{pref && <View style={styles.card}>{page === 'privacy' ? <>
      {toggle('allowFriendRequests', 'Nhận lời mời kết bạn', 'Cho phép người khác gửi lời mời mới.')}
      {toggle('discoverable', 'Hiển thị trong tìm kiếm bạn bè', 'Tắt để hồ sơ không xuất hiện khi tìm theo tên hoặc Nickname.')}
      <View style={styles.setting}><View style={{ flex: 1, gap: 5 }}><Text style={styles.rowTitle}>Chỉ nhận tin nhắn riêng từ bạn bè</Text><Text style={styles.note}>Áp dụng cả tin nhắn mới trong cuộc trò chuyện đã có.</Text></View><Switch accessibilityLabel="Chỉ nhận tin nhắn riêng từ bạn bè" disabled={saving} value={pref.directMessages === 'friends'} onValueChange={value => void save({ directMessages: value ? 'friends' : 'everyone' })} trackColor={{ false: colors.border, true: colors.primary }} /></View>
      <Row icon="ban-outline" title="Tài khoản đã chặn" onPress={() => setPage('blocked')} />
    </> : <>{toggle('notifyActivity', 'Cập nhật hoạt động', 'Yêu cầu tham gia, duyệt thành viên, chốt lịch và thay đổi từ host.')}{toggle('notifyMessages', 'Tin nhắn mới', 'Lưu thông báo khi có tin nhắn mới.')}{toggle('notifyFriends', 'Kết bạn', 'Lời mời mới và thông báo chấp nhận kết bạn.')}<Text style={styles.note}>Các lựa chọn này áp dụng cho hộp thông báo GoMate. Tin nhắn trong cuộc trò chuyện vẫn được lưu.</Text></>}</View>}{saving && <Text style={styles.note}>Đang lưu...</Text>}</>}
    {page === 'language' && <View style={styles.card}><Text style={styles.note}>Ngôn ngữ hiển thị của ứng dụng</Text><LanguageSwitcher /></View>}
    {page === 'blocked' && <BlockedAccounts />}
    {page === 'reports' && <MyReports />}
    {page === 'help' && <><FAQ question="Làm sao chat trước giờ bắt đầu?" answer="Mở hoạt động đã tham gia hoặc do bạn tổ chức. Chat nhóm sẵn sàng ngay khi bạn là thành viên được duyệt; không cần bắt đầu hoạt động." /><FAQ question="Tôi muốn rời nhóm hoặc chặn ai đó" answer="Vào Thành viên để rời nhóm trước giờ bắt đầu. Mở hồ sơ người dùng để chặn; bạn có thể bỏ chặn trong Cài đặt. Nhóm chung vẫn được giữ." /><FAQ question="Báo cáo bài đăng như thế nào?" answer="Mở menu trên thẻ Match, chọn Báo cáo hoạt động và gửi lý do. Theo dõi trạng thái trong Báo cáo của tôi." /><FAQ question="Tôi quên mật khẩu" answer="Đăng xuất, chọn Quên mật khẩu, nhận OTP qua email rồi đặt mật khẩu mới. Thao tác này đăng xuất các phiên cũ." /></>}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
  </ScrollView></SafeAreaView>;
}

function PasswordForm({ onDone }: { onDone: () => void }) {
  const [current, setCurrent] = useState(''), [password, setPassword] = useState(''), [confirm, setConfirm] = useState(''), [error, setError] = useFeedbackState(''), [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const save = async () => { if (lock.current) return; setError(''); if (password.length < 6 || password.length > 128 || password !== confirm || !current || current === password) { setError('Nhập mật khẩu hiện tại và mật khẩu mới khác mật khẩu cũ, từ 6 đến 128 ký tự; xác nhận phải khớp.'); return; } lock.current = true; setBusy(true); try { await post('/auth/change-password', { currentPassword: current, newPassword: password }); await persistSession(null); onDone(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Chưa đổi được mật khẩu'); } finally { lock.current = false; setBusy(false); } };
  return <View style={styles.card}><Text style={styles.note}>Sau khi đổi, hãy đăng nhập lại bằng mật khẩu mới trên các thiết bị.</Text><FormField label="Mật khẩu hiện tại" value={current} onChangeText={setCurrent} secureTextEntry /><FormField label="Mật khẩu mới" value={password} onChangeText={setPassword} secureTextEntry /><FormField label="Xác nhận mật khẩu mới" value={confirm} onChangeText={setConfirm} secureTextEntry />{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}<GradientButton label={busy ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'} disabled={busy} onPress={() => void save()} /></View>;
}
function BlockedAccounts() {
  const remote = useRemote(listBlockedUsers, []); const [error, setError] = useFeedbackState(''), [busy, setBusy] = useState('');
  const unblock = async (id: string) => { if (busy) return; setBusy(id); setError(''); try { await unblockUser(id); await remote.reload(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không bỏ chặn được'); } finally { setBusy(''); } };
  return <><RemoteState {...remote} onRetry={remote.reload} />{!remote.loading && !remote.error && !remote.data.length && <Text style={styles.note}>Bạn chưa chặn tài khoản nào.</Text>}{remote.data.map(user => <View key={user.userId} style={styles.card}><Text style={styles.heading}>{user.name}</Text><Pressable accessibilityRole="button" accessibilityLabel={'Bỏ chặn ' + user.name} disabled={Boolean(busy)} onPress={() => void unblock(user.userId)}><Text style={{ color: colors.primary }}>{busy === user.userId ? 'Đang bỏ chặn...' : 'Bỏ chặn'}</Text></Pressable></View>)}{error ? <Text style={styles.error}>{error}</Text> : null}</>;
}
function MyReports() {
  const remote = useRemote(listReports, []);
  return <><RemoteState {...remote} onRetry={remote.reload} />{!remote.loading && !remote.error && !remote.data.length && <Text style={styles.note}>Bạn chưa gửi báo cáo nào.</Text>}{remote.data.map(report => <View key={report.id} style={styles.card}><Text style={styles.heading}>{report.reason}</Text><Text>{report.detail}</Text><Text style={{ color: colors.primary }}>{report.status === 'pending' ? 'Đã tiếp nhận · Chờ xử lý' : report.status === 'resolved' ? 'Đã xử lý' : 'Đã xem xét'}</Text><Text style={styles.note}>{new Date(report.createdAt).toLocaleString('vi-VN')}</Text></View>)}</>;
}
function Row({ icon, title, onPress }: { icon: Icon; title: string; onPress: () => void }) { return <Pressable accessibilityRole="button" style={styles.row} onPress={onPress}><View style={styles.icon}><Ionicons name={icon} size={21} color={colors.primary} /></View><Text style={[styles.rowTitle, { flex: 1 }]}>{title}</Text><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></Pressable>; }
function FAQ({ question, answer }: { question: string; answer: string }) { return <View style={styles.card}><Text style={styles.heading}>{question}</Text><Text style={styles.note}>{answer}</Text></View>; }
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, page: { maxWidth: Math.min(layout.maxWidth, 800), width: '100%', alignSelf: 'center', padding: 18, paddingBottom: 36, gap: 16 }, card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 18, gap: 15 }, profile: { flexDirection: 'row', alignItems: 'center', gap: 14 }, avatar: { width: 54, height: 54, borderRadius: 27 }, heading: { fontSize: 18, color: colors.text, fontWeight: '700', lineHeight: 25 }, note: { fontSize: 13, color: colors.textSecondary, lineHeight: 21 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54 }, rowTitle: { fontSize: 14, color: colors.text, fontWeight: '600' }, icon: { backgroundColor: colors.primarySoft, padding: 10, borderRadius: 13 }, setting: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }, logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 18, backgroundColor: colors.surface, borderRadius: 18 }, error: { color: colors.danger, padding: 12, backgroundColor: colors.matchSoft, borderRadius: 12, lineHeight: 20 } });
