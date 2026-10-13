import { ComponentProps, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { DateField, DateTimeField, TimeField } from '../components/DateTimeField';
import { CreateGroupFields } from '../components/CreateGroupFields';
import { emptyPreferences, PreferencesSummary } from '../components/ActivityChoices';
import { FormField } from '../components/FormField';
import { GradientButton } from '../components/GradientButton';
import { Text } from '../components/LocalizedText';
import { activityCategories, activityLocations, provinces } from '../data/activityOptions';
import { ActivityDraft, ApprovalRule, FundingMode, publishActivityDraft, validateActivityDraft } from '../services/activityService';
import { colors, layout, radii } from '../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];
type SetField = <K extends keyof ActivityDraft>(key: K, value: ActivityDraft[K]) => void;
type StepProps = { draft: ActivityDraft; setField: SetField };

const stepNames = ['Thông tin cơ bản', 'Thời gian & địa điểm', 'Nhóm', 'Quản lý chi phí', 'Xem lại'];
const approvalRules: { label: string; value: ApprovalRule }[] = [
  { label: 'Quá bán (>50%)', value: 'MAJORITY' },
  { label: '2/3 thành viên', value: 'TWO_THIRDS' },
  { label: 'Tất cả thành viên', value: 'ALL' },
];

function createInitialDraft(): ActivityDraft {
  return {
    name: '', category: activityCategories[0], description: '', photos: [],
    date: '', endDate: '', startTime: '09:00', endTime: '11:00', registrationDeadline: '', scheduleNote: '',
    province: provinces[0], district: activityLocations[provinces[0]][0], address: '', meetingPoint: '',
    minParticipants: '2', maxParticipants: '6', participantPreferences: emptyPreferences, requirements: '',
    financialConfig: {
      fundingMode: 'FULL_PREPAYMENT', paymentDeadline: '', treasurerUserId: 'current-user',
      estimatedCostPerMember: 0, approvalThreshold: 1000000, approvalRule: 'TWO_THIRDS',
    },
  };
}

function currency(value?: number) { return value ? `${value.toLocaleString('vi-VN')}đ` : '0đ'; }
function toAmount(value: string) { const amount = Number(value.replace(/\D/g, '')); return Number.isFinite(amount) ? amount : 0; }

export function CreateActivityScreen({ onCreated }: { onCreated: () => void }) {
  const publishing = useRef(false);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(createInitialDraft);
  const [customCategory, setCustomCategory] = useState(false);
  const [error, setError] = useState<string>();
  const setField: SetField = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  const pickPhoto = async () => {
    if (draft.photos.length >= 1) { setError('Hiện hỗ trợ một ảnh bìa, tối đa 2 MB.'); return; }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setError('GoMate cần quyền truy cập thư viện ảnh.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], mediaTypes: ['images'], quality: 0.75, base64: true });
    if (!result.canceled) { setField('photos', [...draft.photos, { uri: result.assets[0].uri, base64: result.assets[0].base64 ?? undefined }]); setError(undefined); }
  };

  const next = async () => {
    setError(undefined);
    try { validateActivityDraft(draft, Math.min(step, 4)); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Invalid input'); return; }
    if (step < 5) { setStep((current) => current + 1); return; }
    if (publishing.current) return;
    publishing.current = true; setBusy(true);
    try {
      await publishActivityDraft({ ...draft, cover: draft.photos[0] });
      onCreated(); setStep(1); setDraft(createInitialDraft()); setCustomCategory(false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không đăng được hoạt động'); }
    finally { publishing.current = false; setBusy(false); }
  };

  return <View style={styles.screen}>
    <View style={styles.header}><View><Text style={styles.title}>Tạo hoạt động</Text><Text style={styles.subtitle}>Bước {step}/5 · {stepNames[step - 1]}</Text></View><View style={styles.stepBadge}><Text style={styles.stepBadgeText}>{step}</Text></View></View>
    <View style={styles.progress}><View style={[styles.progressFill, { width: `${step * 20}%` }]} /></View>
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}><View style={styles.page}>
      {error && <View style={styles.errorBanner}><Ionicons color={colors.danger} name="alert-circle" size={18} /><Text style={styles.errorText}>{error}</Text></View>}
      {step === 1 && <BasicStep customCategory={customCategory} draft={draft} onCustomCategory={() => { setCustomCategory(true); setField('category', ''); }} onPickPhoto={pickPhoto} onPresetCategory={(category) => { setCustomCategory(false); setField('category', category); }} onRemovePhoto={(index) => setField('photos', draft.photos.filter((_, itemIndex) => itemIndex !== index))} setField={setField} />}
      {step === 2 && <WhenWhereStep draft={draft} setField={setField} />}
      {step === 3 && <GroupStep draft={draft} setField={setField} />}
      {step === 4 && <FinancialStep draft={draft} setField={setField} />}
      {step === 5 && <ReviewStep draft={draft} onEditFinancial={() => setStep(4)} />}
    </View></ScrollView>
    <View style={styles.footer}>{step > 1 && <Pressable onPress={() => { setError(undefined); setStep((current) => current - 1); }} style={styles.backButton}><Text style={styles.backText}>Quay lại</Text></Pressable>}<GradientButton label={busy ? 'Publishing...' : step === 5 ? 'Đăng hoạt động' : 'Tiếp tục'} onPress={next} style={styles.nextButton} trailing={<Ionicons color={colors.white} name={step === 5 ? 'checkmark' : 'arrow-forward'} size={19} />} /></View>
  </View>;
}

function BasicStep({ customCategory, draft, onCustomCategory, onPickPhoto, onPresetCategory, onRemovePhoto, setField }: StepProps & { customCategory: boolean; onCustomCategory: () => void; onPickPhoto: () => void; onPresetCategory: (category: string) => void; onRemovePhoto: (index: number) => void }) {
  return <View><StepHeading icon="sparkles-outline" title="Thông tin cơ bản" note="Ảnh rõ, tên ngắn và mô tả cụ thể giúp hoạt động dễ được quan tâm hơn." />
    <Text style={styles.fieldLabel}>Ảnh hoạt động <Text style={styles.optional}>· một ảnh bìa, tối đa 2 MB, tỉ lệ 1:1</Text></Text>
    <View style={styles.photoGrid}>{draft.photos.map((photo, index) => <View key={photo.uri} style={styles.photoTile}><Image source={photo} style={styles.photo} />{index === 0 && <View style={styles.coverBadge}><Text style={styles.coverBadgeText}>Ảnh bìa</Text></View>}<Pressable accessibilityLabel="Xóa ảnh" onPress={() => onRemovePhoto(index)} style={styles.removePhoto}><Ionicons color={colors.white} name="close" size={15} /></Pressable></View>)}{draft.photos.length < 1 && <Pressable onPress={onPickPhoto} style={styles.addPhoto}><Ionicons color={colors.primary} name="add" size={27} /><Text style={styles.addPhotoText}>Thêm ảnh</Text></Pressable>}</View>
    <View style={styles.card}><FormField icon="text-outline" label="Tên hoạt động" onChangeText={(value) => setField('name', value)} placeholder="Ví dụ: Cà phê cuối tuần" value={draft.name} /><ChoiceGroup label="Danh mục" options={[...activityCategories, 'Khác']} selected={customCategory ? 'Khác' : draft.category} onSelect={(value) => value === 'Khác' ? onCustomCategory() : onPresetCategory(value)} />{customCategory && <FormField icon="create-outline" label="Danh mục của bạn" onChangeText={(value) => setField('category', value)} placeholder="Ví dụ: Nhiếp ảnh đường phố" value={draft.category} />}<FormField icon="reader-outline" label="Mô tả" multiline onChangeText={(value) => setField('description', value)} placeholder="Mục tiêu, trải nghiệm và những điều thành viên cần biết" value={draft.description} /></View>
  </View>;
}

function WhenWhereStep({ draft, setField }: StepProps) {
  const districts = activityLocations[draft.province] ?? [];
  return <View><StepHeading icon="calendar-outline" title="Thời gian & địa điểm" note="Cung cấp lịch chi tiết và điểm gặp rõ ràng để mọi người dễ sắp xếp." /><View style={styles.card}>
    <View style={styles.twoColumns}><View style={styles.column}><DateField label="Ngày bắt đầu" value={draft.date} onChange={(value) => setField('date', value)} /></View><View style={styles.column}><DateField label="Ngày kết thúc" value={draft.endDate} onChange={(value) => setField('endDate', value)} /></View></View>
    <View style={styles.twoColumns}><View style={styles.column}><TimeField label="Bắt đầu" value={draft.startTime} onChange={(value) => setField('startTime', value)} /></View><View style={styles.column}><TimeField label="Kết thúc" value={draft.endTime} onChange={(value) => setField('endTime', value)} /></View></View>
    <DateTimeField label="Hạn nhận yêu cầu tham gia" value={draft.registrationDeadline} onChange={(value) => setField('registrationDeadline', value)} />
    <ChoiceGroup label="Tỉnh / thành phố" options={provinces} selected={draft.province} onSelect={(province) => { setField('province', province); setField('district', activityLocations[province]?.[0] ?? ''); }} />
    <ChoiceGroup label="Quận / huyện" options={districts} selected={draft.district} onSelect={(value) => setField('district', value)} />
    <FormField icon="location-outline" label="Địa chỉ" onChangeText={(value) => setField('address', value)} placeholder="Số nhà, tên đường hoặc địa điểm" value={draft.address} />
    <FormField icon="navigate-outline" label="Điểm tập trung / hướng dẫn gặp mặt" onChangeText={(value) => setField('meetingPoint', value)} placeholder="Ví dụ: trước cổng chính, bàn số 8" value={draft.meetingPoint} />
    <FormField icon="list-outline" label="Ghi chú lịch trình" multiline onChangeText={(value) => setField('scheduleNote', value)} placeholder="Các mốc thời gian hoặc kế hoạch dự kiến" value={draft.scheduleNote} />
  </View></View>;
}

function GroupStep({ draft, setField }: StepProps) { return <CreateGroupFields draft={draft} onChange={(patch) => { for (const key of Object.keys(patch) as (keyof ActivityDraft)[]) setField(key, patch[key]!); }} />; }

function FinancialStep({ draft, setField }: StepProps) {
  const config = draft.financialConfig;
  const setConfig = (patch: Partial<ActivityDraft['financialConfig']>) => setField('financialConfig', { ...config, ...patch });
  const selectMode = (fundingMode: FundingMode) => setConfig(fundingMode === 'FULL_PREPAYMENT' ? { fundingMode, depositAmount: undefined, estimatedCostMin: undefined, estimatedCostMax: undefined } : { fundingMode, estimatedCostPerMember: undefined });
  const memberCount = Number(draft.maxParticipants || 1000);
  return <View><StepHeading icon="wallet-outline" title="Quản lý chi phí" note="Chọn cách thành viên đóng tiền cho hoạt động." />
    <View style={styles.fundingOptions}><FundingOption description="Thành viên đóng toàn bộ khoản dự kiến trước khi hoạt động bắt đầu." icon="card-outline" label="Đóng đủ trước" onPress={() => selectMode('FULL_PREPAYMENT')} selected={config.fundingMode === 'FULL_PREPAYMENT'} /><FundingOption description="Thành viên đóng một phần trước và bổ sung phần còn thiếu sau." icon="wallet-outline" label="Đặt cọc trước" onPress={() => selectMode('DEPOSIT')} selected={config.fundingMode === 'DEPOSIT'} /></View>
    <View style={styles.card}>{config.fundingMode === 'FULL_PREPAYMENT' ? <><MoneyField label="Chi phí dự kiến / người" onChange={(value) => setConfig({ estimatedCostPerMember: value })} value={config.estimatedCostPerMember} /><DateTimeField label="Thời hạn đóng tiền" value={config.paymentDeadline} onChange={(value) => setConfig({ paymentDeadline: value })} /><View style={styles.summaryBox}><Text style={styles.summaryText}>Mỗi thành viên cần đóng {currency(config.estimatedCostPerMember)} trước thời hạn.</Text>{config.estimatedCostPerMember ? <Text style={styles.summaryStrong}>{memberCount} thành viên × {currency(config.estimatedCostPerMember)} = {currency(memberCount * config.estimatedCostPerMember)}</Text> : null}</View></> : <><View style={styles.twoColumns}><View style={styles.column}><MoneyField label="Chi phí tối thiểu" onChange={(value) => setConfig({ estimatedCostMin: value })} value={config.estimatedCostMin} /></View><View style={styles.column}><MoneyField label="Chi phí tối đa" onChange={(value) => setConfig({ estimatedCostMax: value })} value={config.estimatedCostMax} /></View></View><MoneyField label="Tiền cọc / người" onChange={(value) => setConfig({ depositAmount: value })} value={config.depositAmount} /><DateTimeField label="Thời hạn đóng cọc" value={config.paymentDeadline} onChange={(value) => setConfig({ paymentDeadline: value })} /><View style={styles.summaryBox}><Text style={styles.summaryText}>Phần chi phí còn thiếu sẽ được bổ sung sau nếu cần.</Text></View></>}
      <View style={styles.ruleDivider} /><Text style={styles.sectionTitle}>Quy tắc quỹ</Text><View style={styles.managerRow}><View style={styles.managerIcon}><Ionicons color={colors.primary} name="person" size={18} /></View><View style={styles.managerCopy}><Text style={styles.managerLabel}>Người quản lý quỹ</Text><Text style={styles.managerValue}>Bạn (Host)</Text></View><Ionicons color={colors.success} name="checkmark-circle" size={20} /></View><MoneyField label="Ngưỡng cần thành viên xác nhận" onChange={(value) => setConfig({ approvalThreshold: value })} value={config.approvalThreshold} /><ChoiceGroup label="Quy tắc xác nhận" options={approvalRules.map((rule) => rule.label)} selected={approvalRules.find((rule) => rule.value === config.approvalRule)?.label ?? ''} onSelect={(label) => setConfig({ approvalRule: approvalRules.find((rule) => rule.label === label)?.value ?? 'TWO_THIRDS' })} />
    </View>
  </View>;
}

function ReviewStep({ draft, onEditFinancial }: { draft: ActivityDraft; onEditFinancial: () => void }) {
  const config = draft.financialConfig;
  const approvalLabel = approvalRules.find((rule) => rule.value === config.approvalRule)?.label;
  return <View><StepHeading icon="checkmark-done-outline" title="Xem lại trước khi đăng" note="Kiểm tra thông tin chính trước khi hoạt động được công khai." /><ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewPhotos}>{draft.photos.map((photo) => <Image key={photo.uri} source={photo} style={styles.reviewImage} />)}</ScrollView><View style={styles.reviewCard}><Text style={styles.reviewCategory}>{draft.category}</Text><Text style={styles.reviewTitle}>{draft.name}</Text><Text style={styles.reviewDescription}>{draft.description}</Text><ReviewRow icon="calendar-outline" value={`${draft.date}${draft.endDate ? ` – ${draft.endDate}` : ''} · ${draft.startTime}–${draft.endTime}`} /><ReviewRow icon="location-outline" value={`${draft.address}, ${draft.district}, ${draft.province}`} /><ReviewRow icon="people-outline" value={`Tối đa ${draft.maxParticipants || 1000} thành viên`} /><ReviewRow icon="hourglass-outline" value={`Nhận yêu cầu đến ${draft.registrationDeadline}`} /></View>
    <View style={styles.reviewCard}><Text style={styles.sectionTitle}>Nhóm từ {draft.minParticipants || 2} đến {draft.maxParticipants || 1000} thành viên</Text><PreferencesSummary value={draft.participantPreferences} /></View>
    <View style={styles.reviewCard}><View style={styles.reviewSectionHeading}><Text style={styles.sectionTitle}>Quản lý chi phí</Text><Pressable onPress={onEditFinancial}><Text style={styles.editText}>Chỉnh sửa</Text></Pressable></View><Text style={styles.fundingReviewTitle}>{config.fundingMode === 'FULL_PREPAYMENT' ? 'Đóng đủ trước' : 'Đặt cọc trước'}</Text>{config.fundingMode === 'FULL_PREPAYMENT' ? <Text style={styles.fundingReviewText}>{currency(config.estimatedCostPerMember)} / người</Text> : <><Text style={styles.fundingReviewText}>{currency(config.depositAmount)} cọc / người</Text><Text style={styles.fundingReviewText}>Dự kiến {currency(config.estimatedCostMin)} – {currency(config.estimatedCostMax)}</Text></>}<Text style={styles.fundingReviewText}>Hạn đóng: {config.paymentDeadline || 'Không yêu cầu (hoạt động miễn phí)'}</Text><Text style={styles.fundingReviewText}>Khoản từ {currency(config.approvalThreshold)} cần {approvalLabel?.toLowerCase()} xác nhận</Text></View>
  </View>;
}

function StepHeading({ icon, title, note }: { icon: IconName; title: string; note: string }) { return <View style={styles.stepHeading}><View style={styles.stepIcon}><Ionicons color={colors.primary} name={icon} size={23} /></View><View style={styles.stepCopy}><Text style={styles.stepTitle}>{title}</Text><Text style={styles.stepNote}>{note}</Text></View></View>; }
function ChoiceGroup({ label, options, selected, onSelect }: { label: string; options: string[]; selected: string; onSelect: (value: string) => void }) { return <View style={styles.choiceGroup}><Text style={styles.choiceLabel}>{label}</Text><View style={styles.choiceRow}>{options.map((option) => <Pressable key={option} onPress={() => onSelect(option)} style={[styles.choice, selected === option && styles.selectedChoice]}><Text style={[styles.choiceText, selected === option && styles.selectedChoiceText]}>{option}</Text></Pressable>)}</View></View>; }
function MoneyField({ label, onChange, value }: { label: string; onChange: (value: number) => void; value?: number }) { return <FormField icon="cash-outline" keyboardType="number-pad" label={label} onChangeText={(text) => onChange(toAmount(text))} placeholder="0đ" value={value ? value.toLocaleString('vi-VN') : ''} />; }
function FundingOption({ description, icon, label, onPress, selected }: { description: string; icon: IconName; label: string; onPress: () => void; selected: boolean }) { return <Pressable onPress={onPress} style={[styles.fundingOption, selected && styles.fundingOptionSelected]}><View style={[styles.fundingIcon, selected && styles.fundingIconSelected]}><Ionicons color={selected ? colors.white : colors.primary} name={icon} size={21} /></View><View style={styles.fundingCopy}><Text style={[styles.fundingLabel, selected && styles.fundingLabelSelected]}>{label}</Text><Text style={styles.fundingDescription}>{description}</Text></View><Ionicons color={selected ? colors.primary : colors.border} name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={22} /></Pressable>; }
function ReviewRow({ icon, value }: { icon: IconName; value: string }) { return <View style={styles.reviewRow}><View style={styles.reviewIcon}><Ionicons color={colors.primary} name={icon} size={17} /></View><Text style={styles.reviewValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 }, header: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', maxWidth: layout.maxWidth, paddingHorizontal: 18, paddingTop: 18, width: '100%' }, title: { color: colors.text, fontSize: 25, fontWeight: '900', letterSpacing: -0.5 }, subtitle: { color: colors.textSecondary, fontSize: 11.5, marginTop: 4 }, stepBadge: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 18, height: 38, justifyContent: 'center', width: 38 }, stepBadgeText: { color: colors.primary, fontSize: 15, fontWeight: '900' }, progress: { alignSelf: 'center', backgroundColor: colors.border, borderRadius: 3, height: 4, marginTop: 15, maxWidth: layout.maxWidth - 36, overflow: 'hidden', width: '90%' }, progressFill: { backgroundColor: colors.primary, borderRadius: 3, height: '100%' }, scrollContent: { paddingBottom: 18 }, page: { alignSelf: 'center', maxWidth: layout.maxWidth, padding: 18, width: '100%' },
  errorBanner: { alignItems: 'center', backgroundColor: colors.matchSoft, borderColor: colors.matchBorder, borderRadius: 13, borderWidth: 1, flexDirection: 'row', marginBottom: 14, padding: 12 }, errorText: { color: colors.matchText, flex: 1, fontSize: 11.5, lineHeight: 17, marginLeft: 8 }, stepHeading: { alignItems: 'center', flexDirection: 'row', marginBottom: 17 }, stepIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 16, height: 44, justifyContent: 'center', width: 44 }, stepCopy: { flex: 1, marginLeft: 11 }, stepTitle: { color: colors.text, fontSize: 18, fontWeight: '900' }, stepNote: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 3 }, fieldLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 9 }, optional: { color: colors.textMuted, fontSize: 10.5, fontWeight: '500' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, photoTile: { aspectRatio: 1, borderRadius: 16, overflow: 'hidden', position: 'relative', width: '31.5%' }, photo: { height: '100%', width: '100%' }, addPhoto: { alignItems: 'center', aspectRatio: 1, backgroundColor: colors.surface, borderColor: colors.primaryLight, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1.3, justifyContent: 'center', width: '31.5%' }, addPhotoText: { color: colors.primary, fontSize: 10.5, fontWeight: '700', marginTop: 4 }, removePhoto: { alignItems: 'center', backgroundColor: colors.overlay, borderRadius: 13, height: 25, justifyContent: 'center', position: 'absolute', right: 6, top: 6, width: 25 }, coverBadge: { backgroundColor: colors.overlayStrong, borderRadius: 8, bottom: 6, left: 6, paddingHorizontal: 7, paddingVertical: 4, position: 'absolute' }, coverBadgeText: { color: colors.white, fontSize: 8.5, fontWeight: '800' },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.largeCard, borderWidth: 1, gap: 15, marginTop: 14, padding: 16 }, choiceGroup: { gap: 9 }, choiceLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' }, choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, choice: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 }, selectedChoice: { backgroundColor: colors.primarySoft, borderColor: colors.primary }, choiceText: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' }, selectedChoiceText: { color: colors.primary, fontWeight: '800' }, twoColumns: { flexDirection: 'row', gap: 10 }, column: { flex: 1 }, note: { alignItems: 'flex-start', backgroundColor: colors.successSoft, borderRadius: radii.input, flexDirection: 'row', marginTop: 14, padding: 13 }, noteText: { color: colors.textSecondary, flex: 1, fontSize: 11, lineHeight: 16, marginLeft: 8 },
  fundingOptions: { gap: 10 }, fundingOption: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1.5, flexDirection: 'row', padding: 14 }, fundingOptionSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary }, fundingIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 14, height: 42, justifyContent: 'center', width: 42 }, fundingIconSelected: { backgroundColor: colors.primary }, fundingCopy: { flex: 1, marginHorizontal: 11 }, fundingLabel: { color: colors.text, fontSize: 13.5, fontWeight: '800' }, fundingLabelSelected: { color: colors.primary }, fundingDescription: { color: colors.textSecondary, fontSize: 10.5, lineHeight: 15, marginTop: 3 }, summaryBox: { backgroundColor: colors.primarySoft, borderRadius: 13, padding: 12 }, summaryText: { color: colors.textSecondary, fontSize: 11, lineHeight: 16 }, summaryStrong: { color: colors.primary, fontSize: 11.5, fontWeight: '800', marginTop: 5 }, ruleDivider: { backgroundColor: colors.border, height: 1, marginVertical: 2 }, sectionTitle: { color: colors.text, fontSize: 14.5, fontWeight: '800' }, managerRow: { alignItems: 'center', backgroundColor: colors.background, borderRadius: 13, flexDirection: 'row', padding: 11 }, managerIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 12, height: 36, justifyContent: 'center', width: 36 }, managerCopy: { flex: 1, marginLeft: 10 }, managerLabel: { color: colors.textMuted, fontSize: 9.5 }, managerValue: { color: colors.text, fontSize: 12, fontWeight: '700', marginTop: 2 },
  reviewPhotos: { marginHorizontal: -18, paddingHorizontal: 18 }, reviewImage: { borderRadius: 18, height: 150, marginRight: 10, width: 150 }, reviewCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.largeCard, borderWidth: 1, marginTop: 13, padding: 17 }, reviewCategory: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 }, reviewTitle: { color: colors.text, fontSize: 21, fontWeight: '900', marginTop: 6 }, reviewDescription: { color: colors.textSecondary, fontSize: 12.5, lineHeight: 19, marginBottom: 10, marginTop: 7 }, reviewRow: { alignItems: 'center', flexDirection: 'row', marginTop: 10 }, reviewIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 11, height: 31, justifyContent: 'center', width: 31 }, reviewValue: { color: colors.textSecondary, flex: 1, fontSize: 11.5, marginLeft: 9 }, reviewSectionHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, editText: { color: colors.primary, fontSize: 11.5, fontWeight: '700' }, fundingReviewTitle: { color: colors.primary, fontSize: 13.5, fontWeight: '800', marginTop: 12 }, fundingReviewText: { color: colors.textSecondary, fontSize: 11.5, lineHeight: 18, marginTop: 4 },
  footer: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', gap: 10, maxWidth: layout.maxWidth, padding: 12, width: '100%' }, backButton: { alignItems: 'center', borderColor: colors.border, borderRadius: radii.button, borderWidth: 1, justifyContent: 'center', minHeight: 58, paddingHorizontal: 17 }, backText: { color: colors.textSecondary, fontSize: 13, fontWeight: '800' }, nextButton: { flex: 1 },
});
