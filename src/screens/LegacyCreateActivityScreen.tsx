import { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { Text } from '../components/LocalizedText';
import { FormField } from '../components/FormField';
import { GradientButton } from '../components/GradientButton';
import { ActivityDraft, ActivityRecord, publishActivityDraft, recordDraft, updateActivity } from '../services/legacyActivityService';
import { colors, layout, radii } from '../theme';

const categories = ['Ăn uống', 'Thể thao', 'Du lịch', 'Giải trí', 'Học tập', 'Gaming', 'Khác'];
const initialDraft: ActivityDraft = { name: '', category: categories[0], description: '', date: '', startTime: '09:00', endTime: '11:00', location: '', maxParticipants: '6', estimatedCost: '0', requirements: '' };

export function LegacyCreateActivityScreen({ onCreated, editing, onCancel }: { onCreated: () => void; editing?: ActivityRecord; onCancel?: () => void }) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(() => editing ? recordDraft(editing) : initialDraft);
  const [photoUri, setPhotoUri] = useState<string | undefined>(editing?.imageUrl);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const setField = <K extends keyof ActivityDraft>(key: K, value: ActivityDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const pickPhoto = async () => {
    try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) throw new Error('Cần cho phép truy cập ảnh.');
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], mediaTypes: ['images'], quality: 0.7, base64: true });
    if (!result.canceled) {
      const image = result.assets[0];
      if (!image.base64 || image.base64.length > 2796204) throw new Error('Chọn ảnh tối đa 2 MB.');
      setPhotoUri(image.uri); setField('coverBase64', image.base64); setError('');
    }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không chọn được ảnh.'); }
  };

  const next = async () => {
    if (saving.current) return;
    if (step < 4) { setStep((current) => current + 1); return; }
    saving.current = true; setBusy(true); setError('');
    try {
    if (editing) await updateActivity(editing.id, draft);
    else await publishActivityDraft(draft);
    onCreated();
    setStep(1);
    setDraft(initialDraft);
    setPhotoUri(undefined);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không lưu được hoạt động.'); }
    finally { saving.current = false; setBusy(false); }
  };

  return (
    <View pointerEvents={busy ? 'none' : 'auto'} style={styles.screen}>
      {onCancel && <Pressable onPress={onCancel} style={{ padding: 12 }}><Text>Hủy / Quay lại</Text></Pressable>}
      {!!error && <Text accessibilityRole="alert" style={{ padding: 12 }}>{error}</Text>}
      <View style={styles.header}>
        <View><Text style={styles.title}>{editing ? 'Sửa hoạt động' : 'Tạo hoạt động'}</Text><Text style={styles.subtitle}>Bước {step}/4 · {['Thông tin cơ bản', 'Thời gian & địa điểm', 'Nhóm', 'Xem lại'][step - 1]}</Text></View>
        <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>{step}</Text></View>
      </View>
      <View style={styles.progress}><View style={[styles.progressFill, { width: `${step * 25}%` }]} /></View>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.page}>
          {step === 1 && <BasicStep draft={draft} photoUri={photoUri} onPickPhoto={pickPhoto} setField={setField} />}
          {step === 2 && <WhenWhereStep draft={draft} setField={setField} />}
          {step === 2 && <View style={styles.card}><Text>Giờ Việt Nam (UTC+7). Tọa độ tùy chọn giúp tìm theo khoảng cách.</Text><FormField label="Ngày kết thúc (bỏ trống nếu cùng ngày)" placeholder="DD/MM/YYYY" value={draft.endDate ?? ''} onChangeText={value => setField('endDate', value)} /><FormField label="Vĩ độ" value={draft.latitude ?? ''} onChangeText={value => setField('latitude', value)} /><FormField label="Kinh độ" value={draft.longitude ?? ''} onChangeText={value => setField('longitude', value)} /></View>}
          {step === 3 && <Text>Chi phí nhập số VND nguyên, không có dấu chấm; 0 là miễn phí. Sức chứa đã bao gồm host.</Text>}
          {step === 4 && !!draft.endDate && <Text>Kết thúc: {draft.endDate} · {draft.endTime}</Text>}
          {step === 3 && <GroupStep draft={draft} setField={setField} />}
          {step === 4 && <ReviewStep draft={draft} photoUri={photoUri} />}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        {step > 1 && <Pressable onPress={() => setStep((current) => current - 1)} style={styles.backButton}><Text style={styles.backText}>Quay lại</Text></Pressable>}
        <GradientButton label={busy ? 'Đang lưu…' : step === 4 ? (editing ? 'Lưu thay đổi' : 'Đăng hoạt động') : 'Tiếp tục'} onPress={next} style={styles.nextButton} trailing={<Ionicons color={colors.white} name={step === 4 ? 'checkmark' : 'arrow-forward'} size={19} />} />
      </View>
    </View>
  );
}

type StepProps = { draft: ActivityDraft; setField: <K extends keyof ActivityDraft>(key: K, value: ActivityDraft[K]) => void };

function BasicStep({ draft, photoUri, onPickPhoto, setField }: StepProps & { photoUri?: string; onPickPhoto: () => void }) {
  return <View><StepHeading icon="sparkles-outline" title="Thông tin cơ bản" note="Giúp mọi người hiểu ngay hoạt động của bạn." />{photoUri ? <Pressable onPress={onPickPhoto} style={styles.photoWrap}><Image source={{ uri: photoUri }} style={styles.photo} /><View style={styles.photoEdit}><Ionicons color={colors.white} name="camera" size={18} /></View></Pressable> : <Pressable onPress={onPickPhoto} style={styles.photoPlaceholder}><Ionicons color={colors.primary} name="image-outline" size={29} /><Text style={styles.photoTitle}>Thêm ảnh bìa</Text><Text style={styles.photoHint}>Tỉ lệ đề xuất 4:3</Text></Pressable>}<View style={styles.card}><FormField icon="text-outline" label="Tên hoạt động" onChangeText={(value) => setField('name', value)} placeholder="Ví dụ: Cà phê cuối tuần" value={draft.name} /><ChoiceGroup label="Danh mục" options={categories} selected={draft.category} onSelect={(value) => setField('category', value)} /><FormField icon="reader-outline" label="Mô tả" multiline onChangeText={(value) => setField('description', value)} placeholder="Hoạt động sẽ diễn ra như thế nào?" value={draft.description} /></View></View>;
}

function WhenWhereStep({ draft, setField }: StepProps) {
  return <View><StepHeading icon="calendar-outline" title="Khi nào & ở đâu?" note="Thành viên sẽ dùng thông tin này để sắp xếp lịch." /><View style={styles.card}><FormField icon="calendar-outline" label="Ngày" onChangeText={(value) => setField('date', value)} placeholder="DD/MM/YYYY" value={draft.date} /><View style={styles.twoColumns}><View style={styles.column}><FormField icon="time-outline" label="Bắt đầu" onChangeText={(value) => setField('startTime', value)} placeholder="09:00" value={draft.startTime} /></View><View style={styles.column}><FormField icon="time-outline" label="Kết thúc" onChangeText={(value) => setField('endTime', value)} placeholder="11:00" value={draft.endTime} /></View></View><FormField icon="location-outline" label="Địa điểm" onChangeText={(value) => setField('location', value)} placeholder="Khu vực hoặc địa chỉ cụ thể" value={draft.location} /></View><View style={styles.note}><Text style={styles.noteText}>Location is visible to people viewing this activity.</Text></View></View>;
}

function GroupStep({ draft, setField }: StepProps) {
  return <View><StepHeading icon="people-outline" title="Thiết lập nhóm" note="Đặt kỳ vọng rõ ràng để có một nhóm phù hợp." /><View style={styles.card}><FormField icon="people-outline" keyboardType="number-pad" label="Số người tối đa" onChangeText={(value) => setField('maxParticipants', value)} placeholder="6" value={draft.maxParticipants} /><FormField icon="wallet-outline" label="Chi phí dự kiến" onChangeText={(value) => setField('estimatedCost', value)} placeholder="Ví dụ: 120000đ/người" value={draft.estimatedCost} /><FormField icon="checkmark-circle-outline" label="Yêu cầu" multiline onChangeText={(value) => setField('requirements', value)} placeholder="Trang phục, kinh nghiệm, vật dụng cần mang..." value={draft.requirements} /></View><View style={styles.note}><Text style={styles.noteText}>Cost: enter whole VND, 0 for free. Host is included in capacity.</Text></View></View>;
}

function ReviewStep({ draft, photoUri }: { draft: ActivityDraft; photoUri?: string }) {
  return <View><StepHeading icon="checkmark-done-outline" title="Xem lại trước khi đăng" note="Bạn vẫn có thể chỉnh sửa sau khi hoạt động được tạo." />{photoUri ? <Image source={{ uri: photoUri }} style={styles.reviewImage} /> : <View style={styles.reviewImagePlaceholder}><Ionicons color={colors.primary} name="image-outline" size={30} /></View>}<View style={styles.reviewCard}><Text style={styles.reviewCategory}>{draft.category}</Text><Text style={styles.reviewTitle}>{draft.name || 'Tên hoạt động của bạn'}</Text><Text style={styles.reviewDescription}>{draft.description || 'Chưa có mô tả.'}</Text><ReviewRow icon="calendar-outline" value={`${draft.date} · ${draft.startTime}–${draft.endTime}`} /><ReviewRow icon="location-outline" value={draft.location || 'Chưa chọn địa điểm'} /><ReviewRow icon="people-outline" value={`Tối đa ${draft.maxParticipants} người`} /><ReviewRow icon="wallet-outline" value={draft.estimatedCost || 'Chưa nhập chi phí'} /></View></View>;
}

function StepHeading({ icon, title, note }: { icon: 'sparkles-outline' | 'calendar-outline' | 'people-outline' | 'checkmark-done-outline'; title: string; note: string }) { return <View style={styles.stepHeading}><View style={styles.stepIcon}><Ionicons color={colors.primary} name={icon} size={23} /></View><View style={styles.stepCopy}><Text style={styles.stepTitle}>{title}</Text><Text style={styles.stepNote}>{note}</Text></View></View>; }
function ChoiceGroup({ label, options, selected, onSelect }: { label: string; options: string[]; selected: string; onSelect: (value: string) => void }) { return <View style={styles.choiceGroup}><Text style={styles.choiceLabel}>{label}</Text><View style={styles.choiceRow}>{options.map((option) => <Pressable key={option} onPress={() => onSelect(option)} style={[styles.choice, selected === option && styles.selectedChoice]}><Text style={[styles.choiceText, selected === option && styles.selectedChoiceText]}>{option}</Text></Pressable>)}</View></View>; }
function ReviewRow({ icon, value }: { icon: 'calendar-outline' | 'location-outline' | 'people-outline' | 'wallet-outline'; value: string }) { return <View style={styles.reviewRow}><View style={styles.reviewIcon}><Ionicons color={colors.primary} name={icon} size={17} /></View><Text style={styles.reviewValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  header: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', maxWidth: layout.maxWidth, paddingHorizontal: 18, paddingTop: 18, width: '100%' },
  title: { color: colors.text, fontSize: 25, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { color: colors.textSecondary, fontSize: 11.5, marginTop: 4 },
  stepBadge: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 18, height: 38, justifyContent: 'center', width: 38 },
  stepBadgeText: { color: colors.primary, fontSize: 15, fontWeight: '900' },
  progress: { alignSelf: 'center', backgroundColor: colors.border, borderRadius: 3, height: 4, marginTop: 15, maxWidth: layout.maxWidth - 36, overflow: 'hidden', width: '90%' },
  progressFill: { backgroundColor: colors.primary, borderRadius: 3, height: '100%' },
  scrollContent: { paddingBottom: 18 },
  page: { alignSelf: 'center', maxWidth: layout.maxWidth, padding: 18, width: '100%' },
  stepHeading: { alignItems: 'center', flexDirection: 'row', marginBottom: 17 },
  stepIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 16, height: 44, justifyContent: 'center', width: 44 },
  stepCopy: { flex: 1, marginLeft: 11 },
  stepTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  stepNote: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 3 },
  photoPlaceholder: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.primaryLight, borderRadius: radii.largeCard, borderStyle: 'dashed', borderWidth: 1.3, padding: 24 },
  photoTitle: { color: colors.text, fontSize: 13, fontWeight: '800', marginTop: 9 },
  photoHint: { color: colors.textMuted, fontSize: 10, marginTop: 3 },
  photoWrap: { borderRadius: radii.largeCard, height: 190, overflow: 'hidden' },
  photo: { height: '100%', width: '100%' },
  photoEdit: { alignItems: 'center', backgroundColor: colors.overlay, borderRadius: 18, bottom: 12, height: 38, justifyContent: 'center', position: 'absolute', right: 12, width: 38 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.largeCard, borderWidth: 1, gap: 15, marginTop: 14, padding: 16 },
  choiceGroup: { gap: 9 },
  choiceLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  selectedChoice: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  choiceText: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  selectedChoiceText: { color: colors.primary, fontWeight: '800' },
  twoColumns: { flexDirection: 'row', gap: 10 },
  column: { flex: 1 },
  note: { alignItems: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: radii.input, flexDirection: 'row', marginTop: 14, padding: 13 },
  noteText: { color: colors.textSecondary, flex: 1, fontSize: 11, lineHeight: 16, marginLeft: 8 },
  reviewImage: { borderRadius: radii.largeCard, height: 210, width: '100%' },
  reviewImagePlaceholder: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.largeCard, height: 150, justifyContent: 'center' },
  reviewCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.largeCard, borderWidth: 1, marginTop: 13, padding: 17 },
  reviewCategory: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  reviewTitle: { color: colors.text, fontSize: 21, fontWeight: '900', marginTop: 6 },
  reviewDescription: { color: colors.textSecondary, fontSize: 12.5, lineHeight: 19, marginBottom: 10, marginTop: 7 },
  reviewRow: { alignItems: 'center', flexDirection: 'row', marginTop: 10 },
  reviewIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 11, height: 31, justifyContent: 'center', width: 31 },
  reviewValue: { color: colors.textSecondary, flex: 1, fontSize: 11.5, marginLeft: 9 },
  footer: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', gap: 10, maxWidth: layout.maxWidth, padding: 12, width: '100%' },
  backButton: { alignItems: 'center', borderColor: colors.border, borderRadius: radii.button, borderWidth: 1, justifyContent: 'center', minHeight: 58, paddingHorizontal: 17 },
  backText: { color: colors.textSecondary, fontSize: 13, fontWeight: '800' },
  nextButton: { flex: 1 },
});
