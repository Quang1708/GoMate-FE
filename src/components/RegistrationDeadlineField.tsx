import { Pressable, View } from 'react-native';
import { Text } from './LocalizedText';
import { DateTimeField } from './DateTimeField';
import { ActivityDraft, draftDeadline } from '../services/activityService';
import { colors } from '../theme';

export function RegistrationDeadlineField({ draft, onChange }: { draft: ActivityDraft; onChange: (patch: Partial<ActivityDraft>) => void }) {
  const mode = draft.deadlineHoursBefore === undefined ? (draft.deadlineCustom || draft.registrationDeadline ? 'custom' : 'none') : String(draft.deadlineHoursBefore);
  let display = '';
  try { const iso = draftDeadline(draft); if (iso) display = new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { /* Choose activity dates first. */ }
  return <View style={{ gap: 10 }}><Text style={{ fontWeight: '700', color: colors.text }}>Hạn nhận yêu cầu tham gia</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{[['none', 'Đến giờ bắt đầu'], ['6', 'Trước 6 tiếng'], ['12', 'Trước 12 tiếng'], ['24', 'Trước 1 ngày'], ['custom', 'Tùy chỉnh']].map(([key, label]) => <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: mode === key }} onPress={() => onChange({ deadlineHoursBefore: key === 'none' || key === 'custom' ? undefined : Number(key), deadlineCustom: key === 'custom', registrationDeadline: key === 'custom' ? draft.registrationDeadline : '' })} style={{ borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: mode === key ? colors.primarySoft : colors.background, borderWidth: 1, borderColor: mode === key ? colors.primary : colors.border }}><Text style={{ color: mode === key ? colors.primary : colors.textSecondary, fontSize: 12 }}>{label}</Text></Pressable>)}</View>
    {mode === 'custom' && <DateTimeField label="Chọn hạn nhận yêu cầu" value={draft.registrationDeadline.trim()} onChange={value => onChange({ registrationDeadline: value, deadlineCustom: true, deadlineHoursBefore: undefined })} />}
    <Text style={{ color: colors.textMuted, fontSize: 12, lineHeight: 18 }}>{display ? `Nhận yêu cầu đến ${display}` : mode === 'none' ? 'Nhận yêu cầu cho đến khi hoạt động bắt đầu hoặc đủ chỗ.' : mode === 'custom' ? 'Chọn ngày và giờ kết thúc nhận yêu cầu.' : 'Hạn nhận yêu cầu sẽ được tính từ giờ bắt đầu bạn chọn.'}</Text>
  </View>;
}
