import { useFeedbackState } from '../services/feedback';
import { placeRegionFields } from '../services/mapsService';
import { ComponentProps, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocationField } from '../components/LocationField';
import type { Coordinates } from '../services/locationService';
import { Text } from '../components/LocalizedText';
import { AdvancedPreferences, emptyPreferences, ParticipantPreferences } from '../components/ActivityChoices';
import { DateRangeField, dateToIso, TimeField } from '../components/DateTimeField';
import { SelectionField } from '../components/SelectionField';
import { ActivityLocationFields } from '../components/ActivityLocationFields';
import { activityCategories } from '../data/activityOptions';
import { colors, control, layout, radii } from '../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type ActivityFilters = {
  organizerType: 'all' | 'personal' | 'business';
  sort: 'recommended' | 'nearest' | 'soonest';
  radiusEnabled: boolean;
  coordinates?: Coordinates | null;
  province: string;
  district: string;
  ward?: string;
  distance: number;
  categories: string[];
  availableDays: string[];
  timePeriods: string[];
  minBudget: number;
  maxBudget: number;
  minimumCapacity: number;
  maximumCapacity: number;
  dateFrom: string;
  dateTo: string;
  fromTime: string;
  toTime: string;
  preferences: ParticipantPreferences;
};

export const defaultActivityFilters: ActivityFilters = {
  organizerType: 'all', sort: 'recommended', radiusEnabled: false, coordinates: null,
  province: 'Tất cả', district: 'Tất cả', distance: 10, categories: [],
  availableDays: [], timePeriods: [], minBudget: 0, maxBudget: 2000000, minimumCapacity: 0,
  maximumCapacity: 0, dateFrom: '', dateTo: '', fromTime: '', toTime: '', preferences: emptyPreferences,
};

type FilterScreenProps = { saving?: boolean; saveError?: string; initialFilters?: ActivityFilters; onApply: (filters: ActivityFilters) => void; onClose: () => void };
const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const periods = ['Sáng', 'Chiều', 'Tối'];



export function FilterScreen(props: FilterScreenProps) { return <FilterSheet {...props} />; }

export function FilterSheet({ saving = false, saveError, initialFilters = defaultActivityFilters, onApply, onClose }: FilterScreenProps) {
  const [filters, setFilters] = useState<ActivityFilters>(initialFilters);
  const [error, setError] = useFeedbackState('');
  const apply = () => {
    if (filters.dateFrom && filters.dateTo && dateToIso(filters.dateFrom) > dateToIso(filters.dateTo)) { setError('Ngày kết thúc không được trước ngày bắt đầu.'); return; }
    if (filters.fromTime && filters.toTime && filters.fromTime > filters.toTime) { setError('Giờ kết thúc không được trước giờ bắt đầu.'); return; }
    if ((filters.fromTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(filters.fromTime)) || (filters.toTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(filters.toTime))) { setError('Giờ cần theo định dạng HH:mm.'); return; }
    if (filters.maximumCapacity && filters.minimumCapacity > filters.maximumCapacity) { setError('Số lượng tối thiểu không được lớn hơn tối đa.'); return; }
    if ([filters.minimumCapacity, filters.maximumCapacity].some(value => value !== 0 && (!Number.isInteger(value) || value < 2 || value > 1000))) { setError('Số lượng thành viên cần từ 2 đến 1000.'); return; }
    if ((filters.radiusEnabled || filters.sort === 'nearest') && !filters.coordinates) { setError('Chọn vị trí hoặc bật GPS để lọc theo bán kính.'); return; }
    onApply(filters);
  };
  const toggleList = (key: 'categories' | 'availableDays' | 'timePeriods', value: string) => setFilters((current) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value] }));

  return <SafeAreaView style={styles.safeArea}>
    <View style={styles.sheetHandle} /><View style={styles.header}><Pressable accessibilityLabel="Đóng bộ lọc" onPress={onClose} style={styles.headerButton}><Ionicons color={colors.text} name="close" size={26} /></Pressable><View style={styles.headerCopy}><Text style={styles.headerTitle}>Bộ lọc hoạt động</Text><Text style={styles.headerSubtitle}>Tìm hoạt động phù hợp nhất với bạn</Text></View><Pressable onPress={() => setFilters(defaultActivityFilters)} style={styles.resetButton}><Text style={styles.resetText}>Đặt lại</Text></Pressable></View>
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}><View style={styles.page}>
      <FilterSection icon="business-outline" subtitle="Chọn nguồn tổ chức hoạt động" title="Loại hoạt động">
        <ChipGroup options={['Tất cả', 'Cá nhân', 'Doanh nghiệp']} selected={[{ all: 'Tất cả', personal: 'Cá nhân', business: 'Doanh nghiệp' }[filters.organizerType]]} onPress={label => setFilters(current => ({ ...current, organizerType: label === 'Cá nhân' ? 'personal' : label === 'Doanh nghiệp' ? 'business' : 'all' }))} />
        <Text style={styles.innerLabel}>Sắp xếp gợi ý</Text><ChipGroup options={['Dành cho bạn', 'Gần nhất', 'Sắp diễn ra']} selected={[{ recommended: 'Dành cho bạn', nearest: 'Gần nhất', soonest: 'Sắp diễn ra' }[filters.sort]]} onPress={label => setFilters(current => ({ ...current, sort: label === 'Gần nhất' ? 'nearest' : label === 'Sắp diễn ra' ? 'soonest' : 'recommended' }))} />
        <Text style={styles.allHint}>Bộ lọc được lưu cho tài khoản của bạn khi áp dụng.</Text>
      </FilterSection>
      <FilterSection icon="location-outline" subtitle="Chọn khu vực hoặc tìm quanh một vị trí" title="Khu vực">
        <ActivityLocationFields filter province={filters.province} district={filters.district} ward={filters.ward} onChange={patch => setFilters(current => ({ ...current, ...patch }))} />
        <View style={{ gap: 12, marginTop: 16 }}><LocationField value={filters.coordinates} onChange={coordinates => setFilters(current => ({ ...current, coordinates, radiusEnabled: coordinates ? current.radiusEnabled : false }))} radiusKm={filters.radiusEnabled ? filters.distance : undefined} onPlaceSelected={place => { const fields = placeRegionFields(place, filters.province); setFilters(current => ({ ...current, ...(fields.province ? { province: fields.province } : {}), district: fields.district, ward: fields.ward })); }} />
        <View style={styles.sliderHeader}><Text style={styles.sliderLabel}>Chỉ tìm trong bán kính</Text><Switch accessibilityLabel="Lọc theo bán kính" value={filters.radiusEnabled} onValueChange={radiusEnabled => setFilters(current => ({ ...current, radiusEnabled }))} /></View></View>
        {filters.radiusEnabled && !filters.coordinates && <Text style={styles.allHint}>Bán kính đã được lưu. Chọn vị trí cho phiên này để tiếp tục.</Text>}
        <SelectionField label="Bán kính tìm kiếm" options={[1, 5, 10, 20, 50, 100, 200].map(value => ({ value: String(value), label: `${value} km` }))} selected={[String(filters.distance)]} onChange={values => setFilters(current => ({ ...current, distance: Number(values[0] || 10) }))} />
      </FilterSection>

      <FilterSection icon="grid-outline" subtitle="Có thể chọn nhiều danh mục" title="Danh mục">
        <SelectionField label="Danh mục hoạt động" options={[...activityCategories, 'Khác'].map(label => ({ value: label, label }))} selected={filters.categories} onChange={categories => setFilters(current => ({ ...current, categories }))} multiple searchable emptyLabel="Tất cả danh mục" />
      </FilterSection>

      <FilterSection icon="calendar-outline" subtitle="Để trống nếu thời gian linh hoạt" title="Thời gian phù hợp">
        <Text style={styles.innerLabel}>Ngày trong tuần</Text><ChipGroup compact options={days} selected={filters.availableDays} onPress={(day) => toggleList('availableDays', day)} />
        <Text style={styles.innerLabel}>Buổi trong ngày</Text><ChipGroup options={periods} selected={filters.timePeriods} onPress={(period) => toggleList('timePeriods', period)} />
        <View style={{ gap: 12, marginTop: 16 }}>
          <DateRangeField label="Khoảng ngày hoạt động" start={filters.dateFrom} end={filters.dateTo} onChange={(dateFrom, dateTo) => setFilters(current => ({ ...current, dateFrom, dateTo }))} allowPast />
          {Boolean(filters.dateFrom) && <Pressable accessibilityRole="button" onPress={() => setFilters(current => ({ ...current, dateFrom: '', dateTo: '' }))}><Text style={styles.resetText}>Xóa khoảng ngày</Text></Pressable>}
          <TimeField label="Giờ bắt đầu từ" value={filters.fromTime} onChange={fromTime => setFilters(current => ({ ...current, fromTime }))} />
          <TimeField label="Giờ bắt đầu đến" value={filters.toTime} onChange={toTime => setFilters(current => ({ ...current, toTime }))} />
        </View>
      </FilterSection>



      <FilterSection icon="people-outline" subtitle="Lọc theo sức chứa của nhóm" title="Số lượng thành viên">
        <SelectionField label="Nhóm có tối thiểu" options={[{ value: '0', label: 'Bất kỳ' }, ...Array.from({ length: 999 }, (_, index) => ({ value: String(index + 2), label: `${index + 2} người` }))]} selected={[String(filters.minimumCapacity)]} onChange={values => setFilters(current => ({ ...current, minimumCapacity: Number(values[0] || 0) }))} />
        <SelectionField label="Nhóm có tối đa" options={[{ value: '0', label: 'Bất kỳ' }, ...Array.from({ length: 999 }, (_, index) => ({ value: String(index + 2), label: `${index + 2} người` }))]} selected={[String(filters.maximumCapacity)]} onChange={values => setFilters(current => ({ ...current, maximumCapacity: Number(values[0] || 0) }))} />
      </FilterSection>
      <AdvancedPreferences filter value={filters.preferences} onChange={preferences => setFilters(current => ({ ...current, preferences }))} />
      {saveError ? <Text style={{ color: colors.danger }}>{saveError}</Text> : null}
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
    </View></ScrollView>
    <View style={styles.footer}><Pressable disabled={saving} onPress={apply} style={({ pressed }) => [styles.applyButton, pressed && styles.pressed]}><Ionicons color={colors.white} name="options" size={19} /><Text style={styles.applyText}>{saving ? 'Đang lưu...' : 'Áp dụng bộ lọc'}</Text></Pressable></View>
  </SafeAreaView>;
}

function FilterSection({ children, icon, subtitle, title }: { children: React.ReactNode; icon: IconName; subtitle: string; title: string }) { return <View style={styles.section}><View style={styles.sectionHeader}><View style={styles.sectionIcon}><Ionicons color={colors.primary} name={icon} size={20} /></View><View><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionSubtitle}>{subtitle}</Text></View></View><View style={styles.sectionBody}>{children}</View></View>; }
function ChipGroup({ compact = false, onPress, options, selected }: { compact?: boolean; onPress: (value: string) => void; options: string[]; selected: string[] }) { return <View style={styles.chipRow}>{options.map((option) => { const active = selected.includes(option); return <Pressable key={option} onPress={() => onPress(option)} style={[styles.chip, compact && styles.compactChip, active && styles.activeChip]}><Text style={[styles.chipText, active && styles.activeChipText]}>{option}</Text></Pressable>; })}</View>; }

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 }, sheetHandle: { alignSelf: 'center', backgroundColor: colors.border, borderRadius: 2, height: 4, marginTop: 4, width: 42 }, header: { alignItems: 'center', flexDirection: 'row', minHeight: 64, paddingHorizontal: 12 }, headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 }, headerCopy: { flex: 1, marginLeft: 4 }, headerTitle: { color: colors.text, fontSize: 17, fontWeight: '800' }, headerSubtitle: { color: colors.textMuted, fontSize: 10.5, marginTop: 2 }, resetButton: { alignItems: 'flex-end', justifyContent: 'center', minWidth: 58 }, resetText: { color: colors.primary, fontSize: 12.5, fontWeight: '700' }, scrollContent: { paddingBottom: 22 }, page: { alignSelf: 'center', gap: 12, maxWidth: layout.maxWidth, paddingHorizontal: 15, width: '100%' },
  section: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, padding: 15 }, sectionHeader: { alignItems: 'center', flexDirection: 'row' }, sectionIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 13, height: 40, justifyContent: 'center', marginRight: 10, width: 40 }, sectionTitle: { color: colors.text, fontSize: 14.5, fontWeight: '800' }, sectionSubtitle: { color: colors.textMuted, fontSize: 10.5, marginTop: 2 }, sectionBody: { marginTop: 14 }, innerLabel: { color: colors.textSecondary, fontSize: 11.5, fontWeight: '700', marginBottom: 8, marginTop: 14 }, chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, chip: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 12, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 9 }, compactChip: { alignItems: 'center', flex: 1, minWidth: 38, paddingHorizontal: 7 }, activeChip: { backgroundColor: colors.primarySoft, borderColor: colors.primary }, chipText: { color: colors.textSecondary, fontSize: 10.5, fontWeight: '600' }, activeChipText: { color: colors.primary, fontWeight: '800' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, categoryCard: { alignItems: 'center', backgroundColor: colors.background, borderColor: colors.border, borderRadius: 13, borderWidth: 1, height: 70, justifyContent: 'center', width: '31.5%' }, categoryCardActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary }, categoryText: { color: colors.textSecondary, fontSize: 9.5, marginTop: 4 }, categoryTextActive: { color: colors.primary, fontWeight: '800' }, allHint: { color: colors.textMuted, fontSize: 10, marginTop: 9, textAlign: 'center' },
  sliderHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }, sliderLabel: { color: colors.textSecondary, fontSize: 11.5, fontWeight: '600' }, sliderValue: { color: colors.primary, fontSize: 11.5, fontWeight: '800' }, slider: { marginTop: 8 }, sliderTouch: { height: 30, justifyContent: 'center', marginHorizontal: 8 }, sliderTrack: { backgroundColor: colors.border, borderRadius: 3, height: 5, position: 'relative' }, sliderFill: { backgroundColor: colors.primary, borderRadius: 3, height: 5 }, sliderThumb: { backgroundColor: colors.primary, borderColor: colors.white, borderRadius: 11, borderWidth: 3, elevation: 2, height: 22, marginLeft: -11, position: 'absolute', top: -8.5, width: 22 }, sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' }, sliderTick: { color: colors.textMuted, flex: 1, fontSize: 8, textAlign: 'center' }, sliderTickActive: { color: colors.primary, fontWeight: '800' },
  footer: { backgroundColor: colors.background, paddingBottom: 12, paddingHorizontal: 16, paddingTop: 10 }, applyButton: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.primary, borderRadius: radii.pill, flexDirection: 'row', gap: 8, height: control.buttonHeight, justifyContent: 'center', maxWidth: layout.maxWidth, width: '100%' }, applyText: { color: colors.white, fontSize: 14, fontWeight: '800' }, pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});
