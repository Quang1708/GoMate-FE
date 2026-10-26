import { useFeedbackState } from '../../services/feedback';
import { ComponentProps, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, control, layout, radii } from '../../theme';
import { Text } from '../LocalizedText';
import { reportActivity } from '../../services/communityService';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function MatchMoreMenu({ category, onClose, onHide, onNotInterested, onReport, onSafety, visible }: { category: string; onClose: () => void; onHide: () => void; onNotInterested: () => void; onReport: () => void; onSafety: () => void; visible: boolean }) {
  return (
    <BottomSheet onClose={onClose} visible={visible}>
      <SheetHandle />
      <SheetMenuRow icon="eye-off-outline" label="Ẩn hoạt động này" onPress={onHide} />
      <SheetMenuRow icon="heart-dislike-outline" label={`Không quan tâm danh mục ${category}`} onPress={onNotInterested} />
      <SheetMenuRow danger icon="flag-outline" label="Báo cáo hoạt động" onPress={onReport} />
      <SheetMenuRow icon="shield-checkmark-outline" label="Trợ giúp & an toàn" onPress={onSafety} />
    </BottomSheet>
  );
}

export function ReportActivitySheet({ activityId, onClose, visible }: { activityId: string; onClose: () => void; visible: boolean }) {
  const [reason, setReason] = useState(''), [detail, setDetail] = useState(''), [error, setError] = useFeedbackState(''), [busy, setBusy] = useState(false), [sent, setSent] = useState(false);
  const submit = async () => { if (busy) return; setBusy(true); setError(''); try { await reportActivity(activityId, reason, detail); setSent(true); } catch (why) { setError(why instanceof Error ? why.message : 'Chưa gửi được báo cáo'); } finally { setBusy(false); } };
  const reasons = ['Nội dung không phù hợp', 'Thông tin sai sự thật', 'Quấy rối / thiếu an toàn', 'Hoạt động thương mại / quảng cáo', 'Trùng lặp nội dung', 'Lý do khác'];
  return (
    <BottomSheet onClose={onClose} visible={visible}>
      <SheetHeader icon="flag" onClose={onClose} title="Báo cáo hoạt động" />
      <Text style={styles.sheetHint}>Chọn lý do báo cáo</Text>
      <View style={styles.reasonList}>{reasons.map((item) => <Pressable key={item} onPress={() => setReason(item)} style={styles.reasonRow}><View style={[styles.radio, reason === item && styles.radioSelected]}>{reason === item && <View style={styles.radioDot} />}</View><Text style={styles.reasonText}>{item}</Text></Pressable>)}</View>
      <TextInput accessibilityLabel="Mô tả báo cáo" value={detail} onChangeText={setDetail} maxLength={1000} multiline placeholder="Mô tả thêm (tùy chọn)" placeholderTextColor={colors.textMuted} style={styles.reportInput} />
      <Text style={styles.counter}>{detail.length}/1000</Text>{error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}{sent && <Text accessibilityRole="alert" style={{ color: colors.successText }}>Đã tiếp nhận báo cáo. Bạn có thể theo dõi trong Cài đặt.</Text>}
      <PrimarySheetButton disabled={!reason || busy} label={sent ? "Đóng" : busy ? "Đang gửi..." : "Gửi báo cáo"} onPress={sent ? onClose : () => void submit()} />
    </BottomSheet>
  );
}

export function SafetySheet({ onClose, visible }: { onClose: () => void; visible: boolean }) {
  const rows: { icon: IconName; label: string; body: string }[] = [
    { icon: 'shield-checkmark-outline', label: 'Nguyên tắc cộng đồng', body: 'Tôn trọng người đồng hành, đăng thông tin trung thực và không quấy rối. Không chia sẻ dữ liệu riêng của người khác khi chưa được đồng ý.' },
    { icon: 'navigate-circle-outline', label: 'Gặp gỡ an toàn', body: 'Ưu tiên điểm hẹn công cộng, thống nhất lịch trình trong nhóm và cho người thân biết kế hoạch của bạn.' },
    { icon: 'flag-outline', label: 'Báo cáo hoạt động', body: 'Mở menu trên thẻ Match, chọn Báo cáo hoạt động, bổ sung lý do và gửi. Theo dõi trạng thái trong Cài đặt → Báo cáo của tôi.' },
    { icon: 'ban-outline', label: 'Chặn tài khoản', body: 'Mở hồ sơ người dùng hoặc chat riêng rồi chọn Chặn tài khoản này. Bỏ chặn trong Cài đặt → Quyền riêng tư & an toàn.' },
  ];
  return <BottomSheet onClose={onClose} visible={visible}><SheetHeader icon="shield-checkmark" onClose={onClose} title="Trợ giúp & an toàn" /><ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 18 }}>{rows.map(row => <View key={row.label} style={{ gap: 8 }}><View style={{ flexDirection: 'row', gap: 9, alignItems: 'center' }}><Ionicons name={row.icon} size={21} color={colors.primary} /><Text style={{ color: colors.text, fontWeight: '700' }}>{row.label}</Text></View><Text style={{ color: colors.textSecondary, lineHeight: 21 }}>{row.body}</Text></View>)}</ScrollView></BottomSheet>;
}

export function NotInterestedSheet({ category, onCancel, onConfirm, visible }: { category: string; onCancel: () => void; onConfirm: () => void; visible: boolean }) {
  return (
    <BottomSheet onClose={onCancel} visible={visible}>
      <View style={styles.centerSheet}>
        <View style={styles.notInterestedIcon}><Ionicons color={colors.match} name="eye-off-outline" size={34} /></View>
        <Text style={styles.confirmTitle}>Không quan tâm danh mục “{category}”?</Text>
        <Text style={styles.confirmText}>GoMate sẽ giảm ưu tiên các hoạt động tương tự trong thời gian tới.</Text>
      </View>
      <Pressable onPress={onConfirm} style={styles.dangerButton}><Text style={styles.primaryButtonText}>Không quan tâm</Text></Pressable>
      <SecondarySheetButton label="Hủy" onPress={onCancel} />
    </BottomSheet>
  );
}

export function AvailabilityPicker({ onClose, visible }: { onClose: () => void; visible: boolean }) {
  const [days, setDays] = useState(['T2', 'T3', 'T7']);
  const [period, setPeriod] = useState('Buổi tối');
  const periods = [
    { label: 'Buổi sáng', time: '06:00 – 12:00' },
    { label: 'Buổi chiều', time: '12:00 – 18:00' },
    { label: 'Buổi tối', time: '18:00 – 24:00' },
  ];
  const toggleDay = (day: string) => setDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day]);
  return (
    <BottomSheet onClose={onClose} scrollable visible={visible}>
      <SheetHeader back icon="time" onClose={onClose} title="Thời gian rảnh" />
      <Text style={styles.pickerTitle}>Chọn ngày rảnh</Text>
      <View style={styles.dayRow}>{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => <Pressable key={day} onPress={() => toggleDay(day)} style={[styles.dayChip, days.includes(day) && styles.dayChipActive]}><Text style={[styles.dayText, days.includes(day) && styles.dayTextActive]}>{day}</Text></Pressable>)}</View>
      <Text style={styles.pickerTitle}>Chọn khung giờ rảnh</Text>
      {periods.map((item) => <View key={item.label} style={styles.periodRow}><View><Text style={styles.periodLabel}>{item.label}</Text><Text style={styles.periodTime}>{item.time}</Text></View><Switch onValueChange={() => setPeriod(item.label)} trackColor={{ false: colors.border, true: colors.primary }} value={period === item.label} /></View>)}
      <Text style={styles.pickerTitle}>Hoặc tùy chỉnh khung giờ</Text>
      <View style={styles.customTimeRow}><TimeBox label="Từ 18:00" /><Ionicons color={colors.textMuted} name="arrow-forward" size={17} /><TimeBox label="Đến 22:00" /></View>
      <PrimarySheetButton label="Xong" onPress={onClose} />
    </BottomSheet>
  );
}

function BottomSheet({ children, onClose, scrollable = false, visible }: { children: React.ReactNode; onClose: () => void; scrollable?: boolean; visible: boolean }) {
  const content = <View style={styles.sheet}>{children}</View>;
  return <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}><View style={styles.overlay}><Pressable onPress={onClose} style={styles.backdrop} />{scrollable ? <ScrollView contentContainerStyle={styles.scrollSheet}>{content}</ScrollView> : content}</View></Modal>;
}

function SheetHandle() { return <View style={styles.handle} />; }

function SheetHeader({ back = false, icon, onClose, title }: { back?: boolean; icon: IconName; onClose: () => void; title: string }) {
  return <View style={styles.sheetHeader}><Pressable onPress={onClose} style={styles.sheetHeaderButton}><Ionicons color={colors.text} name={back ? 'chevron-back' : icon} size={back ? 24 : 0} /></Pressable><Text style={styles.sheetTitle}>{title}</Text><Pressable onPress={onClose} style={styles.sheetHeaderButton}><Ionicons color={colors.textMuted} name="close" size={22} /></Pressable></View>;
}

function SheetMenuRow({ danger = false, icon, label, onPress }: { danger?: boolean; icon: IconName; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.menuRow}><Ionicons color={danger ? colors.match : colors.textSecondary} name={icon} size={21} /><Text style={[styles.menuText, danger && styles.dangerText]}>{label}</Text><Ionicons color={colors.textMuted} name="chevron-forward" size={19} /></Pressable>;
}

function PrimarySheetButton({ disabled = false, label, onPress }: { disabled?: boolean; label: string; onPress: () => void }) {
  return <Pressable disabled={disabled} onPress={onPress} style={[styles.primaryButton, disabled && styles.disabledButton]}><Text style={styles.primaryButtonText}>{label}</Text></Pressable>;
}

function SecondarySheetButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{label}</Text></Pressable>;
}

function TimeBox({ label }: { label: string }) {
  return <Pressable style={styles.timeBox}><Ionicons color={colors.textSecondary} name="time-outline" size={17} /><Text style={styles.timeBoxText}>{label}</Text><Ionicons color={colors.textMuted} name="chevron-down" size={15} /></Pressable>;
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: colors.sheetOverlay, flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1 },
  scrollSheet: { flexGrow: 1, justifyContent: 'flex-end' },
  sheet: { alignSelf: 'center', backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', maxWidth: layout.maxWidth, paddingBottom: 18, paddingHorizontal: 16, width: '100%' },
  handle: { alignSelf: 'center', backgroundColor: colors.border, borderRadius: 3, height: 4, marginBottom: 12, marginTop: 8, width: 42 },
  sheetHeader: { alignItems: 'center', flexDirection: 'row', height: 58 },
  sheetHeaderButton: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  sheetTitle: { color: colors.text, flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  sheetHint: { color: colors.textSecondary, fontSize: 12, textAlign: 'center' },
  menuRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', minHeight: 56 },
  menuText: { color: colors.text, flex: 1, fontSize: 13, marginLeft: 12 },
  dangerText: { color: colors.match },
  reasonList: { marginTop: 10 },
  reasonRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', minHeight: 42 },
  radio: { alignItems: 'center', borderColor: colors.textMuted, borderRadius: 8, borderWidth: 1.5, height: 16, justifyContent: 'center', width: 16 },
  radioSelected: { borderColor: colors.primary },
  radioDot: { backgroundColor: colors.primary, borderRadius: 4, height: 8, width: 8 },
  reasonText: { color: colors.textSecondary, fontSize: 12, marginLeft: 10 },
  reportInput: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.text, fontSize: 12, height: 54, marginTop: 10, paddingHorizontal: 12, paddingTop: 10, textAlignVertical: 'top' },
  counter: { color: colors.textMuted, fontSize: 10, marginRight: 8, marginTop: -16, textAlign: 'right' },
  primaryButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radii.pill, height: control.buttonHeight, justifyContent: 'center', marginTop: 18 },
  dangerButton: { alignItems: 'center', backgroundColor: colors.match, borderRadius: radii.pill, height: control.buttonHeight, justifyContent: 'center', marginTop: 18 },
  disabledButton: { backgroundColor: colors.surfaceStrong },
  primaryButtonText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  secondaryButton: { alignItems: 'center', backgroundColor: colors.surfaceStrong, borderRadius: radii.pill, height: 48, justifyContent: 'center', marginTop: 10 },
  secondaryButtonText: { color: colors.textSecondary, fontSize: 13 },
  safetyList: { marginTop: 8 },
  centerSheet: { alignItems: 'center', paddingHorizontal: 18, paddingTop: 12 },
  undoIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 32, height: 64, justifyContent: 'center', width: 64 },
  notInterestedIcon: { alignItems: 'center', backgroundColor: colors.matchSoft, borderRadius: 32, height: 64, justifyContent: 'center', width: 64 },
  confirmTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 16, textAlign: 'center' },
  confirmText: { color: colors.textSecondary, fontSize: 12.5, lineHeight: 19, marginTop: 7, maxWidth: 330, textAlign: 'center' },
  pickerTitle: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 10, marginTop: 14 },
  dayRow: { flexDirection: 'row', gap: 7 },
  dayChip: { alignItems: 'center', backgroundColor: colors.surfaceStrong, borderRadius: 10, flex: 1, height: 39, justifyContent: 'center' },
  dayChipActive: { backgroundColor: colors.primary },
  dayText: { color: colors.textSecondary, fontSize: 11 },
  dayTextActive: { color: colors.white, fontWeight: '700' },
  periodRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 54 },
  periodLabel: { color: colors.text, fontSize: 12.5 },
  periodTime: { color: colors.textMuted, fontSize: 10.5, marginTop: 3 },
  customTimeRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  timeBox: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 11, borderWidth: 1, flex: 1, flexDirection: 'row', height: 44, paddingHorizontal: 10 },
  timeBoxText: { color: colors.textSecondary, flex: 1, fontSize: 11, marginLeft: 6 },
});
