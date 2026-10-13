import { ComponentProps, useState } from 'react';
import { GestureResponderEvent, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '../components/LocalizedText';
import { AdvancedPreferences, emptyPreferences, ParticipantPreferences } from '../components/ActivityChoices';
import { DateField, dateToIso, TimeField } from '../components/DateTimeField';
import { FormField } from '../components/FormField';
import { activityCategories, activityLocations, provinces } from '../data/activityOptions';
import { colors, control, layout, radii } from '../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type ActivityFilters = {
  province: string;
  district: string;
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
  province: 'Tất cả', district: 'Tất cả', distance: 10, categories: [],
  availableDays: [], timePeriods: [], minBudget: 0, maxBudget: 2000000, minimumCapacity: 0,
  maximumCapacity: 0, dateFrom: '', dateTo: '', fromTime: '', toTime: '', preferences: emptyPreferences,
};

type FilterScreenProps = { initialFilters?: ActivityFilters; onApply: (filters: ActivityFilters) => void; onClose: () => void };
const distances = [1, 5, 10, 20, 50];
const budgets = [0, 100000, 300000, 500000, 1000000, 2000000];
const capacities = [0, 2, 4, 6, 8, 10, 12];
const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const periods = ['Sáng', 'Chiều', 'Tối'];

const categoryIcons: Record<string, IconName> = {
  'Ăn uống': 'restaurant', 'Thể thao': 'barbell', 'Du lịch': 'airplane', 'Giải trí': 'film',
  'Học tập': 'school', Gaming: 'game-controller', 'Âm nhạc': 'musical-notes', 'Nghệ thuật': 'color-palette',
  'Thiên nhiên': 'leaf', 'Tình nguyện': 'heart', 'Công nghệ': 'hardware-chip', Networking: 'people',
};

function moneyLabel(value: number) {
  if (value === 0) return '0đ';
  if (value >= 1000000) return `${value / 1000000} triệu`;
  return `${value / 1000}k`;
}

export function FilterScreen(props: FilterScreenProps) { return <FilterSheet {...props} />; }

export function FilterSheet({ initialFilters = defaultActivityFilters, onApply, onClose }: FilterScreenProps) {
  const [filters, setFilters] = useState<ActivityFilters>(initialFilters);
  const [error, setError] = useState('');
  const apply = () => {
    if (filters.dateFrom && filters.dateTo && dateToIso(filters.dateFrom) > dateToIso(filters.dateTo)) { setError('Ngày kết thúc không được trước ngày bắt đầu.'); return; }
    if (filters.fromTime && filters.toTime && filters.fromTime > filters.toTime) { setError('Giờ kết thúc không được trước giờ bắt đầu.'); return; }
    if ((filters.fromTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(filters.fromTime)) || (filters.toTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(filters.toTime))) { setError('Giờ cần theo định dạng HH:mm.'); return; }
    if (filters.maximumCapacity && filters.minimumCapacity > filters.maximumCapacity) { setError('Số lượng tối thiểu không được lớn hơn tối đa.'); return; }
    if ([filters.minimumCapacity, filters.maximumCapacity].some(value => value !== 0 && (!Number.isInteger(value) || value < 2 || value > 1000))) { setError('Số lượng thành viên cần từ 2 đến 1000.'); return; }
    onApply(filters);
  };
  const districts = filters.province === 'Tất cả' ? [] : activityLocations[filters.province] ?? [];
  const toggleList = (key: 'categories' | 'availableDays' | 'timePeriods', value: string) => setFilters((current) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value] }));

  return <SafeAreaView style={styles.safeArea}>
    <View style={styles.sheetHandle} /><View style={styles.header}><Pressable accessibilityLabel="Đóng bộ lọc" onPress={onClose} style={styles.headerButton}><Ionicons color={colors.text} name="close" size={26} /></Pressable><View style={styles.headerCopy}><Text style={styles.headerTitle}>Bộ lọc nâng cao</Text><Text style={styles.headerSubtitle}>Tìm hoạt động phù hợp nhất với bạn</Text></View><Pressable onPress={() => setFilters(defaultActivityFilters)} style={styles.resetButton}><Text style={styles.resetText}>Đặt lại</Text></Pressable></View>
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}><View style={styles.page}>
      <FilterSection icon="location-outline" subtitle="Chọn đến cấp quận/huyện" title="Khu vực">
        <ChipGroup options={['Tất cả', ...provinces]} selected={[filters.province]} onPress={(province) => setFilters((current) => ({ ...current, province, district: 'Tất cả' }))} />
        {filters.province !== 'Tất cả' && <><Text style={styles.innerLabel}>Quận / huyện</Text><ChipGroup options={['Tất cả', ...districts]} selected={[filters.district]} onPress={(district) => setFilters((current) => ({ ...current, district }))} /></>}
        <SliderHeader label="Bán kính tìm kiếm" value={`Trong ${filters.distance} km`} /><DiscreteSlider labels={distances.map((value) => `${value} km`)} onChange={(distance) => setFilters((current) => ({ ...current, distance }))} value={filters.distance} values={distances} />
      </FilterSection>

      <FilterSection icon="grid-outline" subtitle="Có thể chọn nhiều danh mục" title="Danh mục">
        <View style={styles.categoryGrid}>{activityCategories.map((category) => { const selected = filters.categories.includes(category); return <Pressable key={category} onPress={() => toggleList('categories', category)} style={[styles.categoryCard, selected && styles.categoryCardActive]}><Ionicons color={selected ? colors.primary : colors.textSecondary} name={categoryIcons[category] ?? 'ellipse'} size={22} /><Text style={[styles.categoryText, selected && styles.categoryTextActive]}>{category}</Text></Pressable>; })}</View>
        {filters.categories.length === 0 && <Text style={styles.allHint}>Đang hiển thị tất cả danh mục</Text>}
      </FilterSection>

      <FilterSection icon="calendar-outline" subtitle="Để trống nếu thời gian linh hoạt" title="Thời gian phù hợp">
        <Text style={styles.innerLabel}>Ngày trong tuần</Text><ChipGroup compact options={days} selected={filters.availableDays} onPress={(day) => toggleList('availableDays', day)} />
        <Text style={styles.innerLabel}>Buổi trong ngày</Text><ChipGroup options={periods} selected={filters.timePeriods} onPress={(period) => toggleList('timePeriods', period)} />
        <View style={{ gap: 12, marginTop: 16 }}>
          <DateField label="Từ ngày cụ thể" value={filters.dateFrom} onChange={dateFrom => setFilters(current => ({ ...current, dateFrom, dateTo: current.dateTo || dateFrom }))} />
          <DateField label="Đến ngày cụ thể" value={filters.dateTo} onChange={dateTo => setFilters(current => ({ ...current, dateTo }))} />
          <TimeField label="Giờ bắt đầu từ" value={filters.fromTime} onChange={fromTime => setFilters(current => ({ ...current, fromTime }))} />
          <TimeField label="Giờ bắt đầu đến" value={filters.toTime} onChange={toTime => setFilters(current => ({ ...current, toTime }))} />
        </View>
      </FilterSection>

      <FilterSection icon="wallet-outline" subtitle="Chi phí dự kiến cho mỗi người" title="Khoảng chi phí">
        <SliderHeader label="Từ" value={moneyLabel(filters.minBudget)} /><DiscreteSlider labels={budgets.map(moneyLabel)} onChange={(minBudget) => setFilters((current) => ({ ...current, minBudget, maxBudget: Math.max(current.maxBudget, minBudget) }))} value={filters.minBudget} values={budgets} />
        <SliderHeader label="Đến" value={filters.maxBudget === 2000000 ? '2 triệu+' : moneyLabel(filters.maxBudget)} /><DiscreteSlider labels={budgets.map(moneyLabel)} onChange={(maxBudget) => setFilters((current) => ({ ...current, maxBudget, minBudget: Math.min(current.minBudget, maxBudget) }))} value={filters.maxBudget} values={budgets} />
      </FilterSection>

      <FilterSection icon="people-outline" subtitle="Lọc theo sức chứa của nhóm" title="Số lượng thành viên">
        <SliderHeader label="Số thành viên tối thiểu của nhóm" value={filters.minimumCapacity ? `Ít nhất ${filters.minimumCapacity} người` : 'Bất kỳ'} /><DiscreteSlider labels={capacities.map((value) => value ? String(value) : 'Bất kỳ')} onChange={(minimumCapacity) => setFilters((current) => ({ ...current, minimumCapacity }))} value={filters.minimumCapacity} values={capacities} />
        <FormField label="Sức chứa tối đa (để trống nếu bất kỳ)" keyboardType="number-pad" value={filters.maximumCapacity ? String(filters.maximumCapacity) : ''} onChangeText={value => setFilters(current => ({ ...current, maximumCapacity: Number(value.replace(/\D/g, '')) }))} placeholder="Ví dụ: 10" />
      </FilterSection>
      <AdvancedPreferences filter value={filters.preferences} onChange={preferences => setFilters(current => ({ ...current, preferences }))} />
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
    </View></ScrollView>
    <View style={styles.footer}><Pressable onPress={apply} style={({ pressed }) => [styles.applyButton, pressed && styles.pressed]}><Ionicons color={colors.white} name="options" size={19} /><Text style={styles.applyText}>Áp dụng bộ lọc</Text></Pressable></View>
  </SafeAreaView>;
}

function FilterSection({ children, icon, subtitle, title }: { children: React.ReactNode; icon: IconName; subtitle: string; title: string }) { return <View style={styles.section}><View style={styles.sectionHeader}><View style={styles.sectionIcon}><Ionicons color={colors.primary} name={icon} size={20} /></View><View><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionSubtitle}>{subtitle}</Text></View></View><View style={styles.sectionBody}>{children}</View></View>; }
function SliderHeader({ label, value }: { label: string; value: string }) { return <View style={styles.sliderHeader}><Text style={styles.sliderLabel}>{label}</Text><Text style={styles.sliderValue}>{value}</Text></View>; }
function ChipGroup({ compact = false, onPress, options, selected }: { compact?: boolean; onPress: (value: string) => void; options: string[]; selected: string[] }) { return <View style={styles.chipRow}>{options.map((option) => { const active = selected.includes(option); return <Pressable key={option} onPress={() => onPress(option)} style={[styles.chip, compact && styles.compactChip, active && styles.activeChip]}><Text style={[styles.chipText, active && styles.activeChipText]}>{option}</Text></Pressable>; })}</View>; }

function DiscreteSlider({ labels, onChange, value, values }: { labels: string[]; onChange: (value: number) => void; value: number; values: number[] }) {
  const [width, setWidth] = useState(0);
  const index = Math.max(0, values.indexOf(value));
  const update = (event: GestureResponderEvent) => {
    if (!width) return;
    const nextIndex = Math.max(0, Math.min(values.length - 1, Math.round((event.nativeEvent.locationX / width) * (values.length - 1))));
    onChange(values[nextIndex]);
  };
  const percent = values.length > 1 ? (index / (values.length - 1)) * 100 : 0;
  return <View style={styles.slider}><View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} onMoveShouldSetResponder={() => true} onResponderGrant={update} onResponderMove={update} onStartShouldSetResponder={() => true} style={styles.sliderTouch}><View style={styles.sliderTrack}><View style={[styles.sliderFill, { width: `${percent}%` }]} /><View style={[styles.sliderThumb, { left: `${percent}%` }]} /></View></View><View style={styles.sliderLabels}>{labels.map((label, itemIndex) => <Text key={`${label}-${itemIndex}`} numberOfLines={1} style={[styles.sliderTick, itemIndex === index && styles.sliderTickActive]}>{label}</Text>)}</View></View>;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 }, sheetHandle: { alignSelf: 'center', backgroundColor: colors.border, borderRadius: 2, height: 4, marginTop: 4, width: 42 }, header: { alignItems: 'center', flexDirection: 'row', minHeight: 64, paddingHorizontal: 12 }, headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 }, headerCopy: { flex: 1, marginLeft: 4 }, headerTitle: { color: colors.text, fontSize: 17, fontWeight: '800' }, headerSubtitle: { color: colors.textMuted, fontSize: 10.5, marginTop: 2 }, resetButton: { alignItems: 'flex-end', justifyContent: 'center', minWidth: 58 }, resetText: { color: colors.primary, fontSize: 12.5, fontWeight: '700' }, scrollContent: { paddingBottom: 22 }, page: { alignSelf: 'center', gap: 12, maxWidth: layout.maxWidth, paddingHorizontal: 15, width: '100%' },
  section: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, padding: 15 }, sectionHeader: { alignItems: 'center', flexDirection: 'row' }, sectionIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 13, height: 40, justifyContent: 'center', marginRight: 10, width: 40 }, sectionTitle: { color: colors.text, fontSize: 14.5, fontWeight: '800' }, sectionSubtitle: { color: colors.textMuted, fontSize: 10.5, marginTop: 2 }, sectionBody: { marginTop: 14 }, innerLabel: { color: colors.textSecondary, fontSize: 11.5, fontWeight: '700', marginBottom: 8, marginTop: 14 }, chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, chip: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 12, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 9 }, compactChip: { alignItems: 'center', flex: 1, minWidth: 38, paddingHorizontal: 7 }, activeChip: { backgroundColor: colors.primarySoft, borderColor: colors.primary }, chipText: { color: colors.textSecondary, fontSize: 10.5, fontWeight: '600' }, activeChipText: { color: colors.primary, fontWeight: '800' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, categoryCard: { alignItems: 'center', backgroundColor: colors.background, borderColor: colors.border, borderRadius: 13, borderWidth: 1, height: 70, justifyContent: 'center', width: '31.5%' }, categoryCardActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary }, categoryText: { color: colors.textSecondary, fontSize: 9.5, marginTop: 4 }, categoryTextActive: { color: colors.primary, fontWeight: '800' }, allHint: { color: colors.textMuted, fontSize: 10, marginTop: 9, textAlign: 'center' },
  sliderHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }, sliderLabel: { color: colors.textSecondary, fontSize: 11.5, fontWeight: '600' }, sliderValue: { color: colors.primary, fontSize: 11.5, fontWeight: '800' }, slider: { marginTop: 8 }, sliderTouch: { height: 30, justifyContent: 'center', marginHorizontal: 8 }, sliderTrack: { backgroundColor: colors.border, borderRadius: 3, height: 5, position: 'relative' }, sliderFill: { backgroundColor: colors.primary, borderRadius: 3, height: 5 }, sliderThumb: { backgroundColor: colors.primary, borderColor: colors.white, borderRadius: 11, borderWidth: 3, elevation: 2, height: 22, marginLeft: -11, position: 'absolute', top: -8.5, width: 22 }, sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' }, sliderTick: { color: colors.textMuted, flex: 1, fontSize: 8, textAlign: 'center' }, sliderTickActive: { color: colors.primary, fontWeight: '800' },
  footer: { backgroundColor: colors.background, paddingBottom: 12, paddingHorizontal: 16, paddingTop: 10 }, applyButton: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.primary, borderRadius: radii.pill, flexDirection: 'row', gap: 8, height: control.buttonHeight, justifyContent: 'center', maxWidth: layout.maxWidth, width: '100%' }, applyText: { color: colors.white, fontSize: 14, fontWeight: '800' }, pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});
