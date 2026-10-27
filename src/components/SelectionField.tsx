import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PickerSheet, WheelColumn } from './ProfilePickers';
import { FormField } from './FormField';
import { Text } from './LocalizedText';
import { searchKey } from '../data/profileOptions';
import { colors } from '../theme';
export type SelectionOption = { value: string; label: string };
export function SelectionField({ label, options, selected, onChange, multiple = false, emptyLabel = 'Chọn thông tin', searchable = false }: { label: string; options: SelectionOption[]; selected: string[]; onChange: (values: string[]) => void; multiple?: boolean; emptyLabel?: string; searchable?: boolean }) {
  const [open, setOpen] = useState(false), [query, setQuery] = useState(''), [candidate, setCandidate] = useState(''), [draft, setDraft] = useState<string[]>([]), [candidateChanged, setCandidateChanged] = useState(false);
  const rows = useMemo(() => options.filter(option => searchKey(option.label).includes(searchKey(query))), [options, query]);
  const candidateOption = rows.find(option => option.value === candidate) ?? rows[0];
  const summary = selected.map(value => options.find(option => option.value === value)?.label).filter(Boolean).join(' · ');
  const show = () => { setDraft(selected); setCandidate(selected[0] ?? options[0]?.value ?? ''); setQuery(''); setCandidateChanged(false); setOpen(true); };
  return <View style={{ gap: 8 }}><Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={show} style={{ minHeight: 50, padding: 13, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text style={{ flex: 1, color: summary ? colors.text : colors.textMuted }}>{summary || emptyLabel}</Text><Ionicons name="chevron-down" color={colors.textMuted} size={18} /></Pressable>
    {open && <PickerSheet title={label} onClose={() => setOpen(false)}>
      {searchable && <FormField label={`Tìm ${label.toLowerCase()}`} value={query} onChangeText={text => { setQuery(text); setCandidateChanged(false); }} placeholder="Nhập để tìm nhanh" />}
      {multiple && <ScrollView style={{ maxHeight: 96 }} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{draft.map(value => <Pressable accessibilityRole="button" accessibilityLabel={`Bỏ chọn ${options.find(option => option.value === value)?.label}`} key={value} onPress={() => { setCandidateChanged(false); setDraft(items => items.filter(item => item !== value)); }} style={{ padding: 10, borderRadius: 18, backgroundColor: colors.primarySoft }}><Text style={{ color: colors.primary }}>{options.find(option => option.value === value)?.label} ×</Text></Pressable>)}</ScrollView>}
      {rows.length ? <WheelColumn label={label} options={rows.map(option => option.label)} value={candidateOption?.label ?? ''} onChange={text => { setCandidate(rows.find(option => option.label === text)!.value); setCandidateChanged(true); }} /> : <Text>Không có lựa chọn phù hợp.</Text>}
      {multiple && candidateOption && <Pressable accessibilityRole="button" onPress={() => setDraft(items => items.includes(candidateOption.value) ? items : [...items, candidateOption.value])} style={{ padding: 12 }}><Text style={{ color: colors.primary }}>{draft.includes(candidateOption.value) ? `Đã chọn ${candidateOption.label}` : `Thêm ${candidateOption.label}`}</Text></Pressable>}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 }}><Pressable accessibilityRole="button" onPress={() => { onChange([]); setOpen(false); }}><Text style={{ color: colors.primary }}>Xóa lựa chọn</Text></Pressable><Pressable accessibilityRole="button" disabled={!multiple && !candidateOption} onPress={() => { onChange(multiple ? candidateChanged && candidateOption ? [...new Set([...draft, candidateOption.value])] : draft : [candidateOption!.value]); setOpen(false); }}><Text style={{ color: colors.primary, fontWeight: '700' }}>Xong</Text></Pressable></View>
    </PickerSheet>}
  </View>;
}
export function StringSelectionField({ label, options, value, onChange, emptyLabel, searchable = true }: { label: string; options: string[]; value: string; onChange: (value: string) => void; emptyLabel?: string; searchable?: boolean }) {
  return <SelectionField label={label} options={[...new Set(options)].map(item => ({ value: item, label: item }))} selected={value ? [value] : []} onChange={values => onChange(values[0] || '')} emptyLabel={emptyLabel} searchable={searchable} />;
}
