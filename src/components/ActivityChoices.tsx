import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './LocalizedText';
import { SelectionField } from './SelectionField';
import { profileLanguages } from '../data/profileOptions';
import { colors } from '../theme';

export type ParticipantPreferences = { minAge?: number; maxAge?: number; genders: string[]; languages: string[]; religions: string[]; alcohol: 'any' | 'yes' | 'no'; dressCode: string };
export const emptyPreferences: ParticipantPreferences = { genders: [], languages: [], religions: [], alcohol: 'any', dressCode: '' };
export const genderOptions = [['male', 'Nam'], ['female', 'Nữ'], ['other', 'Giới tính khác'], ['undisclosed', 'Không tiết lộ']] as const;
export const religionOptions = [['none', 'Không tôn giáo'], ['buddhist', 'Phật giáo'], ['catholic', 'Công giáo'], ['protestant', 'Tin lành'], ['muslim', 'Hồi giáo'], ['hindu', 'Ấn Độ giáo'], ['other', 'Khác'], ['undisclosed', 'Không tiết lộ']] as const;
export const languageOptions = ['Tiếng Việt', 'English', '中文', '日本語', '한국어', 'Français'].map(value => [value, value] as const);
export const interestOptions = ['Cà phê', 'Ẩm thực', 'Cầu lông', 'Chạy bộ', 'Du lịch', 'Âm nhạc', 'Board game', 'Học tập', 'Gaming', 'Nhiếp ảnh', 'Yoga', 'Nghệ thuật'].map(value => [value, value] as const);

export function OptionChips({ label, options, selected, onChange, single = false }: { label: string; options: readonly (readonly [string, string])[]; selected: string[]; onChange: (values: string[]) => void; single?: boolean }) {
  return <View style={styles.group}><Text style={styles.label}>{label}</Text><View style={styles.row}>{options.map(([value, text]) => <Pressable key={value} accessibilityRole="button" aria-selected={selected.includes(value)} accessibilityState={{ selected: selected.includes(value) }} onPress={() => onChange(single ? [value] : selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value])} style={[styles.chip, selected.includes(value) && styles.active]}><Text style={selected.includes(value) ? styles.activeText : styles.text}>{text}</Text></Pressable>)}</View></View>;
}

export function AdvancedPreferences({ value, onChange, filter = false }: { value: ParticipantPreferences; onChange: (value: ParticipantPreferences) => void; filter?: boolean }) {
  const [open, setOpen] = useState(false);
  const count = value.genders.length + value.languages.length + (value.minAge ? 1 : 0) + (value.maxAge ? 1 : 0);
  const patch = (fields: Partial<ParticipantPreferences>) => onChange({ ...value, ...fields });
  const ages = [{ value: '0', label: 'Không giới hạn' }, ...Array.from({ length: 109 }, (_, index) => ({ value: String(index + 12), label: `${index + 12} tuổi` }))];
  return <View style={styles.panel}><Pressable accessibilityRole="button" accessibilityLabel="Tùy chọn nâng cao" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)}><Text style={styles.title}>Tùy chọn nâng cao {count ? `(${count})` : ''} {open ? '−' : '+'}</Text><Text style={styles.hint}>Độ tuổi, giới tính và ngôn ngữ · chọn bằng cuộn</Text></Pressable>
    {open && <View style={styles.group}><Text style={styles.hint}>{filter ? 'Nhóm không giới hạn vẫn được hiển thị. Khoảng tuổi lọc theo phần giao nhau.' : 'Để trống nếu không giới hạn. Điều kiện được đối chiếu với hồ sơ khi tham gia.'}</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}><View style={{ flex: 1 }}><SelectionField label="Tuổi từ" options={ages} selected={[String(value.minAge || 0)]} onChange={values => patch({ minAge: Number(values[0] || 0) })} /></View><View style={{ flex: 1 }}><SelectionField label="Đến tuổi" options={ages} selected={[String(value.maxAge || 0)]} onChange={values => patch({ maxAge: Number(values[0] || 0) })} /></View></View>
      <SelectionField label="Giới tính tham gia" options={genderOptions.map(([key, label]) => ({ value: key, label }))} selected={value.genders} onChange={genders => patch({ genders })} multiple={!filter} emptyLabel="Không giới hạn" />
      <SelectionField label="Ngôn ngữ của nhóm" options={profileLanguages.map(label => ({ value: label, label }))} selected={value.languages} onChange={languages => patch({ languages })} multiple={!filter} searchable emptyLabel="Không giới hạn" />
      <Pressable accessibilityRole="button" onPress={() => onChange({ ...emptyPreferences })}><Text style={styles.activeText}>Xóa tùy chọn nâng cao</Text></Pressable>
    </View>}
  </View>;
}

export function PreferencesSummary({ value }: { value?: ParticipantPreferences }) {
  if (!value || (!value.genders.length && !value.languages.length && !value.religions.length && value.alcohol === 'any' && !value.dressCode && !value.minAge && !value.maxAge)) return null;
  return <View style={styles.group}><Text style={styles.label}>Tùy chọn nhóm</Text>
    {(value.minAge || value.maxAge) ? <Text>Độ tuổi: {value.minAge || 12}–{value.maxAge || 120}</Text> : null}
    {value.genders.length ? <Text>Giới tính: {value.genders.map(value => genderOptions.find(([key]) => key === value)?.[1] || value).join(', ')}</Text> : null}
    {value.languages.length ? <Text>Ngôn ngữ: {value.languages.join(', ')}</Text> : null}
    {value.religions.length ? <Text>Tôn giáo: {value.religions.map(value => religionOptions.find(([key]) => key === value)?.[1] || value).join(', ')}</Text> : null}
    {value.alcohol !== 'any' ? <Text>{value.alcohol === 'yes' ? 'Có thể uống rượu' : 'Không uống rượu'}</Text> : null}
    {value.dressCode ? <Text>Dress code: {value.dressCode}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 16 },
  group: { gap: 10, marginTop: 12 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  label: { color: colors.text, fontSize: 14, fontWeight: '600' }, title: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  chip: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  active: { backgroundColor: colors.primarySoft, borderColor: colors.primary }, text: { color: colors.textSecondary }, activeText: { color: colors.primary, fontWeight: '700' },
  hint: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 },
});
