import { useFeedbackState } from '../services/feedback';
import { deleteActivityDraft, loadActivityDraft, restoreDraftPhotos, saveActivityDraft } from '../services/activityDraftService';
import { placeRegionFields } from '../services/mapsService';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { ComponentProps, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { DateRangeField, TimeField } from '../components/DateTimeField';
import { CreateGroupFields } from '../components/CreateGroupFields';
import { emptyPreferences } from '../components/ActivityChoices';
import { LocationField } from '../components/LocationField';
import { FormField } from '../components/FormField';
import { GradientButton } from '../components/GradientButton';
import { Text } from '../components/LocalizedText';
import { StringSelectionField } from '../components/SelectionField';
import { RegistrationDeadlineField } from '../components/RegistrationDeadlineField';
import { activityCategories, popularActivityCategories } from '../data/activityOptions';
import { ActivityDraft, publishActivityDraft, validateActivityDraft } from '../services/activityService';
import { ActivityDraftPreview } from '../components/ActivityDraftPreview';
import { ActivityLocationFields } from '../components/ActivityLocationFields';
import { useProfile } from '../services/ProfileContext';
import { normalizeRegion, profileRegions } from '../data/profileOptions';
import { ActivityDto } from '../services/activityApi';
import { colors, layout, radii } from '../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];
type SetField = <K extends keyof ActivityDraft>(key: K, value: ActivityDraft[K]) => void;
type StepProps = { draft: ActivityDraft; setField: SetField };

const stepNames = ['Thông tin cơ bản', 'Thời gian & địa điểm', 'Nhóm & điều kiện', 'Xem trước bài đăng'];

function createInitialDraft(province = 'TP. Hồ Chí Minh'): ActivityDraft {
  return {
    organizerType: 'personal', coordinates: null,
    name: '', category: activityCategories[0], description: '', photos: [],
    date: '', endDate: '', startTime: '09:00', endTime: '11:00', registrationDeadline: '', scheduleNote: '',
    province, district: '', ward: '', address: '', meetingPoint: '', reservedSeats: 0, initialFriendIds: [], itinerary: [], planLink: '', costNote: '',
    minParticipants: '2', maxParticipants: '6', participantPreferences: emptyPreferences, requirements: '',
    financialConfig: {
      fundingMode: 'FULL_PREPAYMENT', paymentDeadline: '', treasurerUserId: 'current-user',
      estimatedCostPerMember: 0, approvalThreshold: 1000000, approvalRule: 'TWO_THIRDS',
    },
  };
}


function draftFromActivity(activity?: ActivityDto, province?: string): ActivityDraft {
  if (!activity) return createInitialDraft(province);
  const local = (iso: string) => new Date(new Date(iso).getTime() + 7 * 3600000).toISOString();
  const date = (iso: string) => { const [year, month, day] = local(iso).slice(0, 10).split('-'); return `${day}/${month}/${year}`; };
  return { ...createInitialDraft(), organizerType: activity.organizerType || 'personal', coordinates: activity.coordinates ? { longitude: activity.coordinates.coordinates[0], latitude: activity.coordinates.coordinates[1] } : null, name: activity.title, description: activity.description, category: activity.category,
    date: date(activity.startsAt), endDate: date(activity.endsAt || activity.startsAt), startTime: local(activity.startsAt).slice(11, 16), endTime: local(activity.endsAt || activity.startsAt).slice(11, 16),
    province: activity.province || '', district: activity.district || '', ward: activity.ward || '', address: activity.address || activity.location, reservedSeats: activity.reservedSeats ?? 0, companions: activity.companions ?? [], itinerary: activity.itinerary?.length ? activity.itinerary : (activity.plan || []).map((title, index) => ({ id: `legacy-${index}`, date: local(activity.startsAt).slice(0, 10), time: local(activity.startsAt).slice(11, 16), title, place: '', note: '' })), planLink: activity.planLink || '', planFile: activity.planFile, costNote: activity.costNote || '', meetingPoint: activity.meetingPoint || '',
    registrationDeadline: activity.registrationDeadline ? `${date(activity.registrationDeadline)} · ${local(activity.registrationDeadline).slice(11, 16)}` : '',
    minParticipants: String(activity.minParticipants || 2), maxParticipants: String(activity.maxParticipants), participantPreferences: activity.participantPreferences || emptyPreferences,
    requirements: (activity.requirements || []).join('\n'), scheduleNote: (activity.plan || []).join('\n'),
    financialConfig: { ...createInitialDraft().financialConfig, estimatedCostPerMember: activity.estimatedCost } };
}

export function CreateActivityScreen({ onCreated, initialActivity, onCancel }: { onCreated: (activity?: ActivityDto) => void; initialActivity?: ActivityDto; onCancel?: () => void }) {
  const { profile } = useProfile();
  const defaultRegion = profileRegions.includes(normalizeRegion(profile?.location || '')) ? normalizeRegion(profile?.location || '') : 'TP. Hồ Chí Minh';
  const fileBusy = false;
  const publishing = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(() => draftFromActivity(initialActivity, defaultRegion));
  const [customCategory, setCustomCategory] = useState(false);
  const [error, setError] = useFeedbackState<string | undefined>(undefined);
  const [draftLoading, setDraftLoading] = useState(!initialActivity), [draftLoadError, setDraftLoadError] = useState(''), [draftRetry, setDraftRetry] = useState(0);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false), [draftNotice, setDraftNotice] = useState(''), [discarding, setDiscarding] = useState(false);
  const draftVersion = useRef(0), draftLock = useRef(false), draftRevision = useRef(0);
  const editingId = initialActivity?.id;
  useEffect(() => {
    if (editingId) return;
    let alive = true;
    void loadActivityDraft().then(saved => {
      if (!alive) return;
      if (saved) {
        draftVersion.current = saved.version; setHasSavedDraft(true);
        setDraft(current => ({ ...current, ...saved.state.data, financialConfig: { ...current.financialConfig, ...saved.state.data.financialConfig }, photos: restoreDraftPhotos(saved.state.data.photos) }));
        setStep(saved.state.step); setCustomCategory(saved.state.customCategory); setDraftNotice(`Đã khôi phục bản nháp · Bước ${saved.state.step}/4`);
      }
      setDraftLoadError(''); setDraftLoading(false);
    }).catch(reason => { if (alive) { setDraftLoadError(reason instanceof Error ? reason.message : 'Chưa tải được bản nháp.'); setDraftLoading(false); } });
    return () => { alive = false; };
  }, [editingId, draftRetry]);
  const setField: SetField = (key, value) => { draftRevision.current++; setDraftNotice(''); setDraft((current) => ({ ...current, [key]: value })); };
  const storeDraft = async () => {
    if (draftLock.current || publishing.current || fileBusy) return;
    draftLock.current = true; const revision = draftRevision.current; setDraftSaving(true); setError(undefined);
    try { const saved = await saveActivityDraft({ step, customCategory, data: draft }, draftVersion.current); draftVersion.current = saved.version; setHasSavedDraft(true); setDraftNotice(draftRevision.current === revision ? `Đã lưu bản nháp · Bước ${step}/4` : 'Đã lưu bản nháp; có thay đổi mới chưa lưu.'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Chưa lưu được bản nháp.'); }
    finally { draftLock.current = false; setDraftSaving(false); }
  };
  const discardDraft = async () => {
    if (draftLock.current) return;
    draftLock.current = true; setDraftSaving(true);
    try { if (draftVersion.current) await deleteActivityDraft(draftVersion.current); draftVersion.current = 0; setHasSavedDraft(false); setDraft(createInitialDraft(defaultRegion)); setStep(1); setCustomCategory(false); setDraftNotice(''); setDiscarding(false); setError(undefined); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Chưa xóa được bản nháp.'); setDiscarding(false); }
    finally { draftLock.current = false; setDraftSaving(false); }
  };

  const pickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error('GoMate cần quyền truy cập thư viện ảnh.');
      const result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, selectionLimit: 6 - draft.photos.length, mediaTypes: ['images'], quality: 1, base64: true });
      if (result.canceled) return;
      if (draft.photos.length + result.assets.length > 6) throw new Error('Chọn tối đa 6 ảnh.');
      for (const asset of result.assets) {
        if (!asset.base64 || (asset.fileSize ?? 0) > 10 * 1024 * 1024 || asset.base64.length * 3 / 4 - (asset.base64.endsWith('==') ? 2 : asset.base64.endsWith('=') ? 1 : 0) > 10 * 1024 * 1024) throw new Error('Mỗi ảnh tối đa 10 MB. Vui lòng chọn lại.');
      }
      draftRevision.current++; setDraftNotice(''); setDraft(current => ({ ...current, photos: [...current.photos, ...result.assets.map(asset => ({ uri: asset.uri, base64: asset.base64! }))].slice(0, 6) }));
      setError(undefined);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không chọn được ảnh.'); }
  };

  const next = async () => {
    if (fileBusy || publishing.current || draftLock.current) return;
    setError(undefined);
    try { validateActivityDraft(draft, Math.min(step, 4)); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Invalid input'); return; }
    if (step === 3) { try { validateActivityDraft(draft, 4); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Chi phí không hợp lệ'); return; } }
    if (step < 4) { scroll.current?.scrollTo({ y: 0, animated: false }); setStep((current) => current + 1); return; }
    if (publishing.current) return;
    publishing.current = true; setBusy(true);
    try {
      const created = await publishActivityDraft({ ...draft, cover: draft.photos[0] }, initialActivity?.id);
      if (!initialActivity && draftVersion.current) { try { await deleteActivityDraft(draftVersion.current); draftVersion.current = 0; setHasSavedDraft(false); setDraftNotice(''); } catch { console.warn('Activity published; saved draft cleanup needs retry.'); } }
      onCreated(created); setStep(1); setDraft(createInitialDraft(defaultRegion)); setCustomCategory(false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không đăng được hoạt động'); }
    finally { publishing.current = false; setBusy(false); }
  };

  if (draftLoading || draftLoadError) return <View style={{ flex: 1, padding: 24, gap: 16, alignItems: 'center', justifyContent: 'center' }}>{draftLoading ? <ActivityIndicator color={colors.primary} /> : <><Text accessibilityRole="alert">{draftLoadError}</Text><Pressable onPress={() => { setDraftLoading(true); setDraftRetry(value => value + 1); }}><Text style={{ color: colors.primary }}>Tải lại bản nháp</Text></Pressable></>}</View>;
  return <View style={styles.screen}>
    <View style={styles.header}><View><Text style={styles.title}>{initialActivity ? 'Chỉnh sửa hoạt động' : 'Tạo hoạt động'}</Text><Text style={styles.subtitle}>Bước {step}/4 · {stepNames[step - 1]}</Text></View><View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>{!initialActivity && <Pressable accessibilityRole="button" accessibilityLabel="Lưu nháp" disabled={draftSaving || busy || fileBusy} onPress={() => void storeDraft()} style={{ padding: 9, borderRadius: 12, backgroundColor: colors.primarySoft }}><Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>{draftSaving ? 'Đang lưu...' : 'Lưu nháp'}</Text></Pressable>}<View style={styles.stepBadge}><Text style={styles.stepBadgeText}>{step}</Text></View></View></View>
    {!initialActivity && <View style={{ paddingHorizontal: 18, gap: 6 }}>{draftNotice ? <Text accessibilityLiveRegion="polite" style={{ color: colors.primary, fontSize: 12 }}>{draftNotice}</Text> : null}{hasSavedDraft && <Pressable accessibilityRole="button" disabled={draftSaving || busy} onPress={() => setDiscarding(true)}><Text style={{ color: colors.textMuted, fontSize: 12 }}>Bỏ bản nháp và tạo mới</Text></Pressable>}</View>}
    <Modal visible={discarding} transparent animationType="fade" onRequestClose={() => setDiscarding(false)}><View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(24,18,45,.3)', padding: 24 }}><View style={{ width: '100%', maxWidth: 380, padding: 24, gap: 20, borderRadius: 22, backgroundColor: colors.surface }}><Text style={{ fontSize: 18, fontWeight: '700' }}>Bỏ bản nháp này?</Text><Text>Nội dung, ảnh và kế hoạch đã lưu trong bản nháp sẽ được xóa.</Text><Pressable accessibilityRole="button" disabled={draftSaving} onPress={() => void discardDraft()}><Text style={{ color: colors.danger }}>Xóa bản nháp</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setDiscarding(false)}><Text style={{ color: colors.primary }}>Tiếp tục chỉnh sửa</Text></Pressable></View></View></Modal>
    <View style={styles.progress}><View style={[styles.progressFill, { width: `${step * 25}%` }]} /></View>
    <ScrollView ref={scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}><View style={styles.page}>
      {onCancel && <Pressable onPress={onCancel}><Text style={styles.editText}>Hủy chỉnh sửa</Text></Pressable>}
      {initialActivity && <View><Text style={styles.noteText}>{draft.replacePhotos ? 'Ảnh hiện tại sẽ được xóa khi lưu.' : 'Ảnh hiện tại được giữ lại. Chọn ảnh mới để thay thế bộ ảnh.'}</Text><Pressable onPress={() => setField('replacePhotos', !draft.replacePhotos)}><Text style={styles.editText}>{draft.replacePhotos ? 'Giữ lại ảnh hiện tại' : 'Xóa bộ ảnh hiện tại'}</Text></Pressable></View>}
      {step === 1 && <BasicStep customCategory={customCategory} draft={draft} onCustomCategory={() => { setCustomCategory(true); setField('category', ''); }} onPickPhoto={pickPhoto} onPresetCategory={(category) => { setCustomCategory(false); setField('category', category); }} onRemovePhoto={(index) => setField('photos', draft.photos.filter((_, itemIndex) => itemIndex !== index))} setField={setField} />}
      {step === 2 && <WhenWhereStep draft={draft} setField={setField} onSuggestionsLayout={() => scroll.current?.scrollToEnd({ animated: true })} />}
      {step === 3 && <View style={{ gap: 18 }}><GroupStep draft={draft} setField={setField} editing={Boolean(initialActivity)} existingMembers={initialActivity ? initialActivity.memberCount - (initialActivity.reservedSeats ?? 0) : 1} onCompanionChange={(index, patch) => { draftRevision.current++; setDraftNotice(''); setDraft(current => ({ ...current, companions: Array.from({ length: current.reservedSeats ?? 0 }, (_, at) => ({ name: '', note: '', ...current.companions?.[at], ...(at === index ? patch : {}) })) })); }} /><View style={styles.card}><FormField label="Yêu cầu tham gia" multiline value={draft.requirements} onChangeText={value => setField('requirements', value)} placeholder="Mỗi yêu cầu một dòng" /><Text>Kế hoạch chuyến đi được tạo và chỉnh sửa trong nhóm chat sau khi đăng hoạt động.</Text></View></View>}
      {step === 4 && <ActivityDraftPreview draft={draft} initialActivity={initialActivity} host={{ id: profile?.id || '', name: profile?.name || '' }} />}

    </View></ScrollView>
    <View style={styles.footerShell}>{error && <View accessibilityRole="alert" style={[styles.errorBanner, { marginHorizontal: 18, marginBottom: 0, maxWidth: layout.maxWidth - 36, width: '92%', alignSelf: 'center' }]}><Ionicons color={colors.danger} name="alert-circle" size={18} /><Text style={styles.errorText}>{error}</Text></View>}<View style={styles.footer}>{step > 1 && <Pressable onPress={() => { setError(undefined); scroll.current?.scrollTo({ y: 0, animated: false }); setStep((current) => current - 1); }} style={styles.backButton}><Text style={styles.backText}>Quay lại</Text></Pressable>}<GradientButton disabled={busy || fileBusy || draftSaving} label={busy ? 'Đang lưu...' : fileBusy ? 'Đang đọc tệp...' : step === 4 ? (initialActivity ? 'Lưu thay đổi' : 'Đăng hoạt động') : 'Tiếp tục'} onPress={next} style={styles.nextButton} trailing={<Ionicons color={colors.white} name={step === 4 ? 'checkmark' : 'arrow-forward'} size={19} />} /></View></View>
  </View>;
}

function BasicStep({ customCategory, draft, onCustomCategory, onPickPhoto, onPresetCategory, onRemovePhoto, setField }: StepProps & { customCategory: boolean; onCustomCategory: () => void; onPickPhoto: () => void; onPresetCategory: (category: string) => void; onRemovePhoto: (index: number) => void }) {
  return <View><StepHeading icon="sparkles-outline" title="Thông tin cơ bản" note="Ảnh rõ, tên ngắn và mô tả cụ thể giúp hoạt động dễ được quan tâm hơn." />
    <Text style={styles.fieldLabel}>Ảnh hoạt động <Text style={styles.optional}>· tối đa 6 ảnh, mỗi ảnh tối đa 10 MB</Text></Text>
    <View style={styles.photoGrid}>{draft.photos.map((photo, index) => <View key={photo.uri} style={styles.photoTile}><Image source={photo} style={styles.photo} />{index === 0 && <View style={styles.coverBadge}><Text style={styles.coverBadgeText}>Ảnh bìa</Text></View>}<Pressable accessibilityLabel="Xóa ảnh" onPress={() => onRemovePhoto(index)} style={styles.removePhoto}><Ionicons color={colors.white} name="close" size={15} /></Pressable></View>)}{draft.photos.length < 6 && <Pressable onPress={onPickPhoto} style={styles.addPhoto}><Ionicons color={colors.primary} name="add" size={27} /><Text style={styles.addPhotoText}>Thêm ảnh</Text></Pressable>}</View>
    <View style={styles.card}><FormField icon="text-outline" label="Tên hoạt động" onChangeText={(value) => setField('name', value)} placeholder="Ví dụ: Cà phê cuối tuần" value={draft.name} /><View style={{ gap: 12 }}><StringSelectionField label="Danh mục" options={activityCategories} value={customCategory ? 'Khác' : draft.category} onChange={value => value === 'Khác' ? onCustomCategory() : onPresetCategory(value)} emptyLabel="Tìm và chọn danh mục" /><Text style={styles.optional}>Phổ biến trên GoMate</Text><View style={styles.choiceRow}>{popularActivityCategories.map(category => <Pressable accessibilityRole="button" key={category} onPress={() => onPresetCategory(category)} style={[styles.choice, draft.category === category && styles.selectedChoice]}><Text style={[styles.choiceText, draft.category === category && styles.selectedChoiceText]}>{category}</Text></Pressable>)}</View></View>{customCategory && <FormField icon="create-outline" label="Danh mục của bạn" onChangeText={(value) => setField('category', value)} placeholder="Ví dụ: Nhiếp ảnh đường phố" value={draft.category} />}<FormField icon="reader-outline" label="Mô tả" multiline onChangeText={(value) => setField('description', value)} placeholder="Mục tiêu, trải nghiệm và những điều thành viên cần biết" value={draft.description} /></View>
  </View>;
}

function WhenWhereStep({ draft, setField, onSuggestionsLayout }: StepProps & { onSuggestionsLayout: () => void }) {
  return <View><StepHeading icon="calendar-outline" title="Thời gian & địa điểm" note="Cung cấp lịch chi tiết và điểm gặp rõ ràng để mọi người dễ sắp xếp." /><View style={styles.card}>
    <DateRangeField start={draft.date} end={draft.endDate} onChange={(date, endDate) => { setField('date', date); setField('endDate', endDate); }} />
    <View style={styles.twoColumns}><View style={styles.column}><TimeField label="Bắt đầu" value={draft.startTime} onChange={(value) => setField('startTime', value)} /></View><View style={styles.column}><TimeField label="Kết thúc" value={draft.endTime} onChange={(value) => setField('endTime', value)} /></View></View>
    <RegistrationDeadlineField draft={draft} onChange={patch => { setField('registrationDeadline', patch.registrationDeadline || ''); setField('deadlineHoursBefore', patch.deadlineHoursBefore); setField('deadlineCustom', patch.deadlineCustom); }} />
    <ActivityLocationFields province={draft.province} district={draft.district} ward={draft.ward} onChange={patch => { if (patch.province !== undefined) { setField('province', patch.province); setField('coordinates', null); } if (patch.district !== undefined) setField('district', patch.district); if (patch.ward !== undefined) setField('ward', patch.ward); }} />
    <Text style={{ color: colors.textSecondary }}>Ghim địa điểm để mọi người thấy khoảng cách chính xác.</Text>
    <LocationField value={draft.coordinates} onChange={point => setField('coordinates', point)} onPlaceSelected={place => { const fields = placeRegionFields(place, draft.province); if (fields.province) setField('province', fields.province); setField('district', fields.district); setField('ward', fields.ward); setField('address', fields.address); }} />
    <AddressAutocomplete value={draft.address} bias={draft.coordinates} onSuggestionsLayout={onSuggestionsLayout} onChangeText={value => { setField('address', value); setField('coordinates', null); }} onSelect={place => { const fields = placeRegionFields(place, draft.province); if (fields.province) setField('province', fields.province); setField('district', fields.district); setField('ward', fields.ward); setField('address', fields.address); setField('coordinates', place.point); }} />
    <FormField icon="navigate-outline" label="Điểm tập trung / hướng dẫn gặp mặt" onChangeText={(value) => setField('meetingPoint', value)} placeholder="Ví dụ: trước cổng chính, bàn số 8" value={draft.meetingPoint} />

  </View></View>;
}

function GroupStep({ draft, setField, editing, existingMembers, onCompanionChange }: StepProps & { existingMembers: number; editing: boolean; onCompanionChange: (index: number, patch: Partial<{ name: string; note: string }>) => void }) { return <CreateGroupFields existingMembers={existingMembers} onCompanionChange={onCompanionChange} editing={editing} draft={draft} onChange={(patch) => { for (const key of Object.keys(patch) as (keyof ActivityDraft)[]) setField(key, patch[key]!); }} />; }

function StepHeading({ icon, title, note }: { icon: IconName; title: string; note: string }) { return <View style={styles.stepHeading}><View style={styles.stepIcon}><Ionicons color={colors.primary} name={icon} size={23} /></View><View style={styles.stepCopy}><Text style={styles.stepTitle}>{title}</Text><Text style={styles.stepNote}>{note}</Text></View></View>; }

const styles = StyleSheet.create({
  footerShell: { backgroundColor: colors.surface, paddingTop: 8 },
  screen: { backgroundColor: colors.background, flex: 1 }, header: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', maxWidth: layout.maxWidth, paddingHorizontal: 18, paddingTop: 18, width: '100%' }, title: { color: colors.text, fontSize: 25, fontWeight: '900', letterSpacing: -0.5 }, subtitle: { color: colors.textSecondary, fontSize: 11.5, marginTop: 4 }, stepBadge: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 18, height: 38, justifyContent: 'center', width: 38 }, stepBadgeText: { color: colors.primary, fontSize: 15, fontWeight: '900' }, progress: { alignSelf: 'center', backgroundColor: colors.border, borderRadius: 3, height: 4, marginTop: 15, maxWidth: layout.maxWidth - 36, overflow: 'hidden', width: '90%' }, progressFill: { backgroundColor: colors.primary, borderRadius: 3, height: '100%' }, scrollContent: { paddingBottom: 18 }, page: { alignSelf: 'center', maxWidth: layout.maxWidth, padding: 18, width: '100%' },
  errorBanner: { alignItems: 'center', backgroundColor: colors.matchSoft, borderColor: colors.matchBorder, borderRadius: 13, borderWidth: 1, flexDirection: 'row', marginBottom: 14, padding: 12 }, errorText: { color: colors.matchText, flex: 1, fontSize: 11.5, lineHeight: 17, marginLeft: 8 }, stepHeading: { alignItems: 'center', flexDirection: 'row', marginBottom: 17 }, stepIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 16, height: 44, justifyContent: 'center', width: 44 }, stepCopy: { flex: 1, marginLeft: 11 }, stepTitle: { color: colors.text, fontSize: 18, fontWeight: '900' }, stepNote: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 3 }, fieldLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 9 }, optional: { color: colors.textMuted, fontSize: 10.5, fontWeight: '500' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, photoTile: { aspectRatio: 1, borderRadius: 16, overflow: 'hidden', position: 'relative', width: '31.5%', maxWidth: 160 }, photo: { height: '100%', width: '100%' }, addPhoto: { alignItems: 'center', aspectRatio: 1, backgroundColor: colors.surface, borderColor: colors.primaryLight, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1.3, justifyContent: 'center', width: '31.5%', maxWidth: 160 }, addPhotoText: { color: colors.primary, fontSize: 10.5, fontWeight: '700', marginTop: 4 }, removePhoto: { alignItems: 'center', backgroundColor: colors.overlay, borderRadius: 13, height: 25, justifyContent: 'center', position: 'absolute', right: 6, top: 6, width: 25 }, coverBadge: { backgroundColor: colors.overlayStrong, borderRadius: 8, bottom: 6, left: 6, paddingHorizontal: 7, paddingVertical: 4, position: 'absolute' }, coverBadgeText: { color: colors.white, fontSize: 8.5, fontWeight: '800' },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.largeCard, borderWidth: 1, gap: 15, marginTop: 14, padding: 16 }, choiceGroup: { gap: 9 }, choiceLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' }, choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, choice: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 }, selectedChoice: { backgroundColor: colors.primarySoft, borderColor: colors.primary }, choiceText: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' }, selectedChoiceText: { color: colors.primary, fontWeight: '800' }, twoColumns: { flexDirection: 'row', gap: 10 }, column: { flex: 1 }, note: { alignItems: 'flex-start', backgroundColor: colors.successSoft, borderRadius: radii.input, flexDirection: 'row', marginTop: 14, padding: 13 }, noteText: { color: colors.textSecondary, flex: 1, fontSize: 11, lineHeight: 16, marginLeft: 8 },
  fundingOptions: { gap: 10 }, fundingOption: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1.5, flexDirection: 'row', padding: 14 }, fundingOptionSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary }, fundingIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 14, height: 42, justifyContent: 'center', width: 42 }, fundingIconSelected: { backgroundColor: colors.primary }, fundingCopy: { flex: 1, marginHorizontal: 11 }, fundingLabel: { color: colors.text, fontSize: 13.5, fontWeight: '800' }, fundingLabelSelected: { color: colors.primary }, fundingDescription: { color: colors.textSecondary, fontSize: 10.5, lineHeight: 15, marginTop: 3 }, summaryBox: { backgroundColor: colors.primarySoft, borderRadius: 13, padding: 12 }, summaryText: { color: colors.textSecondary, fontSize: 11, lineHeight: 16 }, summaryStrong: { color: colors.primary, fontSize: 11.5, fontWeight: '800', marginTop: 5 }, ruleDivider: { backgroundColor: colors.border, height: 1, marginVertical: 2 }, sectionTitle: { color: colors.text, fontSize: 14.5, fontWeight: '800' }, managerRow: { alignItems: 'center', backgroundColor: colors.background, borderRadius: 13, flexDirection: 'row', padding: 11 }, managerIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 12, height: 36, justifyContent: 'center', width: 36 }, managerCopy: { flex: 1, marginLeft: 10 }, managerLabel: { color: colors.textMuted, fontSize: 9.5 }, managerValue: { color: colors.text, fontSize: 12, fontWeight: '700', marginTop: 2 },
  reviewPhotos: { marginHorizontal: -18, paddingHorizontal: 18 }, reviewImage: { borderRadius: 18, height: 150, marginRight: 10, width: 150 }, reviewCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.largeCard, borderWidth: 1, marginTop: 13, padding: 17 }, reviewCategory: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 }, reviewTitle: { color: colors.text, fontSize: 21, fontWeight: '900', marginTop: 6 }, reviewDescription: { color: colors.textSecondary, fontSize: 12.5, lineHeight: 19, marginBottom: 10, marginTop: 7 }, reviewRow: { alignItems: 'center', flexDirection: 'row', marginTop: 10 }, reviewIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 11, height: 31, justifyContent: 'center', width: 31 }, reviewValue: { color: colors.textSecondary, flex: 1, fontSize: 11.5, marginLeft: 9 }, reviewSectionHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, editText: { color: colors.primary, fontSize: 11.5, fontWeight: '700' }, fundingReviewTitle: { color: colors.primary, fontSize: 13.5, fontWeight: '800', marginTop: 12 }, fundingReviewText: { color: colors.textSecondary, fontSize: 11.5, lineHeight: 18, marginTop: 4 },
  footer: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', gap: 10, maxWidth: layout.maxWidth, padding: 12, width: '100%' }, backButton: { alignItems: 'center', borderColor: colors.border, borderRadius: radii.button, borderWidth: 1, justifyContent: 'center', minHeight: 58, paddingHorizontal: 17 }, backText: { color: colors.textSecondary, fontSize: 13, fontWeight: '800' }, nextButton: { flex: 1 },
});
