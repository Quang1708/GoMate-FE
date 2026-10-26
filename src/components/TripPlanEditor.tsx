import { useFeedbackState } from '../services/feedback';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './LocalizedText';
import { FormField } from './FormField';
import { DateField, dateToIso, isoToDate, TimeField } from './DateTimeField';
import { ItineraryStep, pickPlanFile, PlanDraft } from '../services/planService';
import { colors } from '../theme';

export function TripPlanEditor({ value, onChange, startDate, endDate, startTime = '09:00', endTime = '18:00', onBusyChange }: { value: PlanDraft; onChange: (patch: Partial<PlanDraft>) => void; startDate: string; endDate: string; startTime?: string; endTime?: string; onBusyChange?: (busy: boolean) => void }) {
  const [expanded, setExpanded] = useState(''), [error, setError] = useFeedbackState(''), [busy, setBusy] = useState(false);
  const fileLock = useRef(false);
  const patch = (id: string, fields: Partial<ItineraryStep>) => onChange({ itinerary: value.itinerary.map(step => step.id === id ? { ...step, ...fields } : step) });
  const add = () => {
    if (value.itinerary.length >= 60) return;
    const id = 'step-' + Date.now() + '-' + value.itinerary.length;
    onChange({ itinerary: [...value.itinerary, { id, date: dateToIso(startDate), time: startTime, title: '', place: '', note: '' }] });
    setExpanded(id);
  };
  const template = () => {
    const start = new Date(dateToIso(startDate) + 'T' + startTime + ':00+07:00'), end = new Date(dateToIso(endDate || startDate) + 'T' + endTime + ':00+07:00');
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) { setError('Chọn khoảng ngày và giờ trước khi tạo gợi ý.'); return; }
    let middle = new Date(dateToIso(startDate) + 'T14:00:00+07:00');
    if (middle <= start || middle >= end) middle = new Date(start.getTime() + Math.min(2 * 3600000, (end.getTime() - start.getTime()) / 2));
    const times = [start, middle, end];
    onChange({ itinerary: ['Tập trung và làm quen', 'Trải nghiệm cùng nhóm', 'Kết thúc và tổng kết'].map((title, index) => {
      const local = new Date(times[index].getTime() + 7 * 3600000).toISOString();
      return { id: 'template-' + Date.now() + '-' + index, date: local.slice(0, 10), time: local.slice(11, 16), title, place: '', note: '' };
    }) });
    setError('');
  };
  const chooseFile = async () => {
    if (fileLock.current) return;
    fileLock.current = true; setBusy(true); onBusyChange?.(true); setError('');
    try { const file = await pickPlanFile(); if (file) onChange({ planAttachment: file }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không đọc được tệp'); }
    finally { fileLock.current = false; setBusy(false); onBusyChange?.(false); }
  };
  const fileName = value.planAttachment === null ? '' : value.planAttachment?.name || value.planFile?.name;
  return <View style={{ gap: 14 }}>
    <Text style={{ fontSize: 20, fontWeight: '700' }}>Kế hoạch chuyến đi</Text>
    <Text style={{ color: colors.textSecondary }}>Thêm mốc theo ngày, giờ và địa điểm; hoặc chia sẻ kế hoạch có sẵn.</Text>
    {!value.itinerary.length && <Pressable accessibilityRole="button" onPress={template} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, backgroundColor: colors.primarySoft }}><Ionicons name="sparkles-outline" size={22} color={colors.primary} /><Text style={{ color: colors.primary, fontWeight: '700' }}>Tạo gợi ý 3 mốc</Text></Pressable>}
    {value.itinerary.map((step, index) => <View key={step.id} style={{ padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 16, gap: 10 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={'Sửa mốc ' + (index + 1)} onPress={() => setExpanded(expanded === step.id ? '' : step.id)}>
        <Text style={{ fontWeight: '600' }}>{index + 1}. {step.time} · {step.title || 'Mốc mới'}</Text><Text style={{ color: colors.textMuted }}>{isoToDate(step.date)}{step.place ? ' · ' + step.place : ''}</Text>
      </Pressable>
      {expanded === step.id && <>
        <FormField label={'Nội dung mốc ' + (index + 1)} value={step.title} onChangeText={title => patch(step.id, { title })} placeholder="Ví dụ: ăn trưa, nhận phòng, trekking" />
        <DateField label={'Ngày mốc ' + (index + 1)} value={isoToDate(step.date)} onChange={date => patch(step.id, { date: dateToIso(date) })} allowPast />
        <TimeField label={'Giờ mốc ' + (index + 1)} value={step.time} onChange={time => patch(step.id, { time })} />
        <FormField label={'Địa điểm mốc ' + (index + 1)} value={step.place} onChangeText={place => patch(step.id, { place })} placeholder="Địa điểm cụ thể" />
        <FormField label={'Ghi chú mốc ' + (index + 1)} value={step.note} onChangeText={note => patch(step.id, { note })} multiline placeholder="Chuẩn bị, cách di chuyển..." />
        <Pressable accessibilityRole="button" accessibilityLabel={'Xóa mốc ' + (index + 1)} onPress={() => onChange({ itinerary: value.itinerary.filter(item => item.id !== step.id) })}><Text style={{ color: colors.danger }}>Xóa mốc này</Text></Pressable>
      </>}
    </View>)}
    <View style={{ flexDirection: 'row', gap: 20, flexWrap: 'wrap' }}>
      <Pressable accessibilityRole="button" disabled={value.itinerary.length >= 60} onPress={add} style={{ padding: 13, borderRadius: 12, backgroundColor: colors.primary }}><Text style={{ color: colors.white, fontWeight: '700' }}>+ Thêm mốc</Text></Pressable>
      {value.itinerary.length > 1 && <Pressable accessibilityRole="button" style={{ padding: 13 }} onPress={() => onChange({ itinerary: [...value.itinerary].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)) })}><Text style={{ color: colors.primary }}>Sắp theo thời gian</Text></Pressable>}
    </View>
    <FormField label="Link Google Sheets / kế hoạch online" value={value.planLink} onChangeText={planLink => onChange({ planLink })} placeholder="https://docs.google.com/spreadsheets/..." />
    <Text style={{ color: colors.textMuted, fontSize: 12 }}>Đặt quyền xem phù hợp cho người tham gia. GoMate không tự đọc nội dung link.</Text>
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => void chooseFile()} style={{ padding: 18, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.primaryLight, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', gap: 12 }}><Ionicons name="document-attach-outline" size={26} color={colors.primary} /><Text style={{ color: colors.primary, fontWeight: '700' }}>{busy ? 'Đang đọc tệp...' : fileName ? 'Đổi tệp Excel' : 'Đính kèm tệp Excel'}</Text></Pressable>
    <Text style={{ color: colors.textMuted, fontSize: 12 }}>Tệp .xlsx/.xls tối đa 3 MB, mở/tải từ kế hoạch. Các mốc nhập ở trên được lưu riêng.</Text>
    {fileName ? <View style={{ flexDirection: 'row', gap: 16 }}><Text style={{ flex: 1 }}>{fileName}</Text><Pressable accessibilityRole="button" onPress={() => onChange({ planAttachment: null })}><Text style={{ color: colors.danger }}>Bỏ tệp Excel</Text></Pressable></View> : null}
    {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
  </View>;
}
