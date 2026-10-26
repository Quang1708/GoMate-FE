import { useFeedbackState } from '../services/feedback';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './LocalizedText';
import { FormField } from './FormField';
import { profileInterests, profileLanguages, profileRegions, searchKey } from '../data/profileOptions';
import { birthDateDisplay, birthDateIso, daysInMonth, formatBirthInput } from '../services/profileDate';
import { colors } from '../theme';

export function PickerSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <Modal transparent animationType="slide" visible onRequestClose={onClose}><View style={styles.backdrop}><View style={styles.sheet}>
    <View style={styles.row}><Text style={styles.title}>{title}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Đóng ${title}`} onPress={onClose}><Ionicons name="close" size={24} color={colors.text} /></Pressable></View>{children}
  </View></View></Modal>;
}

const ROW = 44;
export function WheelColumn({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  const scroll = useRef<ScrollView>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const index = Math.max(0, options.indexOf(value));
  const selectedIndex = useRef(index);
  useEffect(() => { selectedIndex.current = index; }, [index]);
  const programmatic = useRef(false);
  const programmaticTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const align = useCallback(() => {
    clearTimeout(timer.current);
    clearTimeout(programmaticTimer.current);
    programmatic.current = true;
    scroll.current?.scrollTo({ y: index * ROW, animated: false });
    programmaticTimer.current = setTimeout(() => { programmatic.current = false; }, 180);
  }, [index]);
  useEffect(align, [align]);
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(programmaticTimer.current); }, []);
  const move = (delta: number) => onChange(options[Math.max(0, Math.min(options.length - 1, index + delta))]);
  return <View style={styles.wheelColumn}><Text style={styles.label}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} trước`} onPress={() => move(-1)}><Ionicons name="chevron-up" size={19} color={colors.textMuted} /></Pressable>
    <View style={styles.wheel}>
      <View pointerEvents="none" style={styles.selectionBand} />
      <ScrollView accessibilityLabel={`${label} cuộn`} ref={scroll} snapToInterval={ROW} decelerationRate="fast" showsVerticalScrollIndicator={false} nestedScrollEnabled scrollEventThrottle={16}
        contentContainerStyle={{ paddingVertical: ROW * 2 }} onLayout={align} onScrollBeginDrag={() => { programmatic.current = false; }}
        onScroll={event => {
          if (Platform.OS !== 'web' && programmatic.current) return;
          const offset = event.nativeEvent.contentOffset.y;
          clearTimeout(timer.current);
          timer.current = setTimeout(() => {
            // Read the actual web scroll position after settling: a queued event from
            // before a click/scrollTo must not overwrite the newly selected row.
            const node = Platform.OS === 'web' ? scroll.current?.getScrollableNode() as { scrollTop?: number } | undefined : undefined;
            const settledOffset = node?.scrollTop ?? offset;
            const next = Math.max(0, Math.min(options.length - 1, Math.round(settledOffset / ROW)));
            if (next !== selectedIndex.current) onChange(options[next]);
          }, 140);
        }}>
        {options.map((option, position) => <Pressable key={option} accessibilityRole="button" accessibilityLabel={`${label}: ${option}`} aria-selected={position === index} accessibilityState={{ selected: position === index }} onPress={() => { clearTimeout(timer.current); onChange(option); }} style={styles.wheelItem}><Text style={[styles.wheelText, position !== index && { opacity: Math.abs(position - index) === 1 ? 0.45 : 0.22 }]}>{option}</Text></Pressable>)}
      </ScrollView>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} sau`} onPress={() => move(1)}><Ionicons name="chevron-down" size={19} color={colors.textMuted} /></Pressable>
  </View>;
}

export function BirthDateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  return <View style={{ gap: 8 }}><FormField label="Ngày sinh" placeholder="DD-MM-YYYY" keyboardType="number-pad" value={value} onChangeText={input => onChange(formatBirthInput(input, value))} />
    <Pressable accessibilityRole="button" accessibilityLabel="Chọn ngày sinh bằng cuộn" onPress={() => setOpen(true)} style={styles.inline}><Ionicons name="calendar-outline" size={18} color={colors.primary} /><Text style={styles.link}>Chọn ngày, tháng, năm</Text></Pressable>
    {open && <BirthDateWheel value={value} onClose={() => setOpen(false)} onChange={next => { onChange(next); setOpen(false); }} />}
  </View>;
}
function BirthDateWheel({ value, onClose, onChange }: { value: string; onClose: () => void; onChange: (value: string) => void }) {
  const [today] = useState(() => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10));
  const [parts, setParts] = useState(() => { try { const [year, month, day] = birthDateIso(value).split('-').map(Number); return { day, month, year }; } catch { return { day: 1, month: 1, year: Number(today.slice(0, 4)) - 25 }; } });
  const [error, setError] = useFeedbackState('');
  const change = (patch: Partial<typeof parts>) => setParts(current => { const next = { ...current, ...patch }; return { ...next, day: Math.min(next.day, daysInMonth(next.month, next.year)) }; });
  const displayed = `${String(parts.day).padStart(2, '0')}-${String(parts.month).padStart(2, '0')}-${parts.year}`;
  return <PickerSheet title="Chọn ngày sinh" onClose={onClose}>
    <Text style={styles.hint}>Ngày · Tháng · Năm</Text>
    <View style={styles.wheels}><WheelColumn label="Ngày" options={Array.from({ length: daysInMonth(parts.month, parts.year) }, (_, index) => String(index + 1).padStart(2, '0'))} value={String(parts.day).padStart(2, '0')} onChange={day => change({ day: Number(day) })} />
      <WheelColumn label="Tháng" options={Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'))} value={String(parts.month).padStart(2, '0')} onChange={month => change({ month: Number(month) })} />
      <WheelColumn label="Năm" options={Array.from({ length: Number(today.slice(0, 4)) - 1899 }, (_, index) => String(1900 + index))} value={String(parts.year)} onChange={year => change({ year: Number(year) })} /></View>
    <Text style={styles.center}>{displayed}</Text>{error ? <Text style={styles.error}>{error}</Text> : null}
    <Pressable accessibilityRole="button" style={styles.primary} onPress={() => { try { onChange(birthDateDisplay(birthDateIso(displayed))); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Ngày không hợp lệ'); } }}><Text style={styles.primaryText}>Dùng ngày sinh này</Text></Pressable>
  </PickerSheet>;
}

export function RegionField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false), [query, setQuery] = useState('');
  const rows = profileRegions.filter(region => searchKey(region).includes(searchKey(query)));
  return <View style={{ gap: 8 }}><Text style={styles.label}>Khu vực</Text><Pressable accessibilityRole="button" accessibilityLabel="Chọn tỉnh / thành phố" onPress={() => setOpen(true)} style={styles.control}><Text>{value || 'Chọn tỉnh / thành phố'}</Text><Ionicons name="chevron-down" size={18} color={colors.textMuted} /></Pressable>
    {open && <PickerSheet title="Tỉnh / thành phố" onClose={() => setOpen(false)}><FormField label="Tìm tỉnh / thành phố" value={query} onChangeText={setQuery} placeholder="Ví dụ: Hà Nội" /><ScrollView style={{ maxHeight: 350 }} keyboardShouldPersistTaps="handled">{rows.map(region => <Pressable accessibilityRole="button" key={region} style={styles.option} onPress={() => { onChange(region); setOpen(false); setQuery(''); }}><Text>{region}</Text>{value === region && <Ionicons name="checkmark" size={20} color={colors.primary} />}</Pressable>)}{!rows.length && <Text>Không tìm thấy tỉnh / thành phố phù hợp.</Text>}</ScrollView></PickerSheet>}
  </View>;
}

export function LanguageField({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [candidate, setCandidate] = useState(value[0] || 'Tiếng Việt');
  const [feedback, setFeedback] = useState('');
  const remove = (language: string) => { if (value.length <= 1) { setFeedback('Giữ ít nhất một ngôn ngữ giao tiếp.'); return; } onChange(value.filter(item => item !== language)); setFeedback(''); };
  return <View style={{ gap: 10 }}><Text style={styles.label}>Ngôn ngữ giao tiếp</Text><View style={styles.chips}>{value.map(language => <Pressable accessibilityRole="button" accessibilityLabel={`Bỏ ngôn ngữ ${language}`} key={language} style={styles.chip} onPress={() => remove(language)}><Text style={styles.link}>{language} ×</Text></Pressable>)}</View>
    <Pressable accessibilityRole="button" style={styles.control} accessibilityLabel="Chọn ngôn ngữ bằng cuộn" onPress={() => { setCandidate(value[0] || 'Tiếng Việt'); setOpen(true); }}><Text>Thêm / chọn ngôn ngữ</Text><Ionicons name="chevron-down" size={18} color={colors.textMuted} /></Pressable>
    {feedback ? <Text style={styles.hint}>{feedback}</Text> : null}
    {open && <PickerSheet title="Chọn ngôn ngữ" onClose={() => setOpen(false)}><Text style={styles.hint}>Chọn một hoặc nhiều ngôn ngữ bạn có thể giao tiếp.</Text><View style={styles.chips}>{value.map(language => <Pressable key={language} style={styles.chip} accessibilityRole="button" accessibilityLabel={`Bỏ ngôn ngữ ${language} trong bộ chọn`} onPress={() => remove(language)}><Text style={styles.link}>{language} ×</Text></Pressable>)}</View>
      <View style={{ height: 300 }}><WheelColumn label="Ngôn ngữ" options={profileLanguages} value={candidate} onChange={setCandidate} /></View>
      <Pressable accessibilityRole="button" style={styles.control} onPress={() => { if (!value.includes(candidate)) { if (value.length >= 12) { setFeedback('Chọn tối đa 12 ngôn ngữ.'); return; } onChange([...value, candidate]); setFeedback(''); } }}><Text style={styles.link}>{value.includes(candidate) ? `Đã chọn ${candidate}` : `Thêm ${candidate}`}</Text></Pressable>
      {feedback ? <Text style={styles.hint}>{feedback}</Text> : null}<Pressable accessibilityRole="button" style={styles.primary} onPress={() => setOpen(false)}><Text style={styles.primaryText}>Xong</Text></Pressable>
    </PickerSheet>}
  </View>;
}

export function InterestField({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const [query, setQuery] = useState('');
  const rows = profileInterests.filter(interest => searchKey(interest).includes(searchKey(query)) && !value.includes(interest));
  const add = (interest: string) => { if (value.length >= 12) return; onChange([...value, interest]); setQuery(''); };
  const custom = query.trim().slice(0, 40);
  return <View style={{ gap: 12 }}><Text style={styles.label}>Sở thích của bạn · {value.length}/12</Text>
    <View style={styles.chips}>{value.map(interest => <Pressable key={interest} accessibilityRole="button" accessibilityLabel={`Bỏ sở thích ${interest}`} onPress={() => onChange(value.filter(item => item !== interest))} style={styles.chip}><Text style={styles.link}>{interest} ×</Text></Pressable>)}</View>
    <FormField label="Tìm kiếm sở thích" placeholder="Chạy bộ, cắm trại, nhiếp ảnh..." value={query} onChangeText={setQuery} icon="search-outline" />
    <Text style={styles.hint}>{query ? `${rows.length} sở thích phù hợp` : `Khám phá ${profileInterests.length} sở thích · chọn tối đa 12`}</Text>
    <View style={styles.chips}>{rows.slice(0, query ? 30 : 12).map(interest => <Pressable accessibilityRole="button" disabled={value.length >= 12} key={interest} style={[styles.suggestion, value.length >= 12 && { opacity: 0.4 }]} onPress={() => add(interest)}><Text>{interest}</Text></Pressable>)}</View>
    {custom && !profileInterests.some(item => searchKey(item) === searchKey(custom)) && !value.includes(custom) && <Pressable accessibilityRole="button" disabled={value.length >= 12} onPress={() => add(custom)}><Text style={styles.link}>+ Thêm sở thích “{custom}”</Text></Pressable>}
  </View>;
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(16,20,40,0.45)', justifyContent: 'flex-end' }, sheet: { backgroundColor: colors.surface, width: '100%', maxWidth: 560, maxHeight: '94%', alignSelf: 'center', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 30, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, title: { fontSize: 21, fontWeight: '700', color: colors.text }, label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary }, hint: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 }, link: { color: colors.primary, fontWeight: '600' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 }, control: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 14, padding: 15, minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  primary: { backgroundColor: colors.primary, borderRadius: 18, minHeight: 52, padding: 14, alignItems: 'center', justifyContent: 'center' }, primaryText: { color: colors.white, fontWeight: '700' }, center: { textAlign: 'center', color: colors.text, fontWeight: '700' }, error: { color: colors.danger },
  wheels: { flexDirection: 'row', gap: 8 }, wheelColumn: { flex: 1, alignItems: 'center', gap: 8, minWidth: 0 }, wheel: { height: ROW * 5, width: '100%', overflow: 'hidden' }, selectionBand: { position: 'absolute', top: ROW * 2, height: ROW, left: 0, right: 0, borderRadius: 10, backgroundColor: colors.primarySoft },
  wheelItem: { height: ROW, justifyContent: 'center', alignItems: 'center' }, wheelText: { color: colors.text, fontSize: 20, fontWeight: '600' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { backgroundColor: colors.primarySoft, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9 }, suggestion: { borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9 }, option: { minHeight: 48, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
});
