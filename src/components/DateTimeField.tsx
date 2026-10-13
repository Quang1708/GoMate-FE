import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from './LocalizedText';
import { FormField } from './FormField';
import { colors } from '../theme';

export function dateToIso(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
}
export function isoToDate(value: string) { const [year, month, day] = value.split('-'); return year && month && day ? `${day}/${month}/${year}` : ''; }
export function todayVietnam() { return new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10); }

export function DateField({ label, value, onChange, allowPast = false }: { label: string; value: string; onChange: (value: string) => void; allowPast?: boolean }) {
  const [open, setOpen] = useState(false);
  const [today] = useState(todayVietnam);
  const [month, setMonth] = useState(() => (dateToIso(value) || todayVietnam()).slice(0, 7));
  const [year, monthNumber] = month.split('-').map(Number);
  const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const offset = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7;
  const move = (delta: number) => setMonth(new Date(Date.UTC(year, monthNumber - 1 + delta, 1)).toISOString().slice(0, 7));
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => setOpen(true)} style={styles.control}><Text>{value || 'Chọn ngày trong lịch'} ▦</Text></Pressable>
    <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}><View style={styles.backdrop}><View style={styles.modal}>
      <View style={styles.heading}><Pressable accessibilityLabel="Tháng trước" onPress={() => move(-1)}><Text style={styles.link}>‹</Text></Pressable><Text style={styles.label}>Tháng {monthNumber}/{year}</Text><Pressable accessibilityLabel="Tháng sau" onPress={() => move(1)}><Text style={styles.link}>›</Text></Pressable></View>
      <View style={styles.grid}>{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => <View key={day} style={styles.cell}><Text>{day}</Text></View>)}</View>
      <View style={styles.grid}>{Array.from({ length: offset + count }, (_, index) => {
        const day = index - offset + 1;
        const iso = `${month}-${String(day).padStart(2, '0')}`;
        const disabled = day < 1 || (!allowPast && iso < today);
        return <Pressable key={index} accessibilityLabel={day > 0 ? isoToDate(iso) : undefined} accessibilityRole="button" disabled={disabled} style={[styles.cell, dateToIso(value) === iso && styles.selected]} onPress={() => { onChange(isoToDate(iso)); setOpen(false); }}><Text style={{ opacity: disabled ? 0.3 : 1 }}>{day > 0 ? day : ''}</Text></Pressable>;
      })}</View>
      <View style={styles.heading}><Pressable onPress={() => { onChange(''); setOpen(false); }}><Text style={styles.link}>Xóa ngày</Text></Pressable><Pressable onPress={() => setOpen(false)}><Text style={styles.link}>Đóng</Text></Pressable></View>
    </View></View></Modal>
  </View>;
}

export function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<'Sáng' | 'Chiều' | 'Tối'>('Sáng');
  const hours = period === 'Sáng' ? Array.from({ length: 12 }, (_, index) => index) : period === 'Chiều' ? [12, 13, 14, 15, 16, 17] : [18, 19, 20, 21, 22, 23];
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => { const hour = Number(value.split(':')[0] || 9); setPeriod(hour < 12 ? 'Sáng' : hour < 18 ? 'Chiều' : 'Tối'); setOpen(true); }} style={styles.control}><Text>{value || 'Chọn giờ'} ◷</Text></Pressable>
    <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}><View style={styles.backdrop}><View style={styles.modal}>
      <Text style={styles.label}>{label}</Text><View style={styles.heading}>{(['Sáng', 'Chiều', 'Tối'] as const).map(item => <Pressable key={item} onPress={() => setPeriod(item)} style={[styles.control, period === item && styles.selected]}><Text>{item}</Text></Pressable>)}</View>
      <ScrollView style={{ maxHeight: 260 }}><View style={styles.grid}>{hours.flatMap(hour => [0, 15, 30, 45].map(minute => {
        const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        return <Pressable key={time} style={[styles.time, value === time && styles.selected]} onPress={() => { onChange(time); setOpen(false); }}><Text>{time}</Text></Pressable>;
      }))}</View></ScrollView>
      <FormField label="Nhập giờ khác (HH:mm)" placeholder="09:15" value={value} onChangeText={onChange} />
      <View style={styles.heading}><Pressable onPress={() => { onChange(''); setOpen(false); }}><Text style={styles.link}>Xóa giờ</Text></Pressable><Pressable onPress={() => setOpen(false)}><Text style={styles.link}>Xong</Text></Pressable></View>
    </View></View></Modal>
  </View>;
}

export function DateTimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [date = '', time = '18:00'] = value.split(' · ');
  return <View style={styles.field}><DateField label={label} value={date} onChange={next => onChange(next ? `${next} · ${time}` : '')} />{date ? <TimeField label="Giờ" value={time} onChange={next => onChange(`${date} · ${next || '18:00'}`)} /> : null}</View>;
}

const styles = StyleSheet.create({
  field: { gap: 8 }, label: { color: colors.text, fontWeight: '600', fontSize: 14 }, control: { padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 }, modal: { alignSelf: 'center', width: '100%', maxWidth: 440, padding: 18, borderRadius: 22, backgroundColor: colors.surface, gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, grid: { flexDirection: 'row', flexWrap: 'wrap' }, cell: { width: '14.28%', height: 42, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  selected: { backgroundColor: colors.primarySoft, borderColor: colors.primary }, link: { color: colors.primary, fontWeight: '700', fontSize: 16 }, time: { width: '25%', paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
});
