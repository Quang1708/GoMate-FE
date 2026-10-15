import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './LocalizedText';
import { PickerSheet, WheelColumn } from './ProfilePickers';
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
  const [open, setOpen] = useState(false), [hour, setHour] = useState('09'), [minute, setMinute] = useState('00');
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => { const parts = /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value.split(':') : ['09', '00']; setHour(parts[0]); setMinute(parts[1]); setOpen(true); }} style={styles.control}><Text>{value || 'Chọn giờ'} ◷</Text></Pressable>
    {open && <PickerSheet title={label} onClose={() => setOpen(false)}><View style={{ flexDirection: 'row', gap: 12 }}><WheelColumn label="Giờ" options={Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))} value={hour} onChange={setHour} /><WheelColumn label="Phút" options={Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))} value={minute} onChange={setMinute} /></View><View style={styles.heading}><Pressable accessibilityRole="button" onPress={() => { onChange(''); setOpen(false); }}><Text style={styles.link}>Xóa giờ</Text></Pressable><Pressable accessibilityRole="button" onPress={() => { onChange(`${hour}:${minute}`); setOpen(false); }}><Text style={styles.link}>Dùng giờ này</Text></Pressable></View></PickerSheet>}
  </View>;
}

export function DateRangeField({ label = 'Ngày bắt đầu và kết thúc', start, end, onChange, allowPast = false }: { label?: string; start: string; end: string; onChange: (start: string, end: string) => void; allowPast?: boolean }) {
  const [open, setOpen] = useState(false), [today] = useState(todayVietnam), [month, setMonth] = useState(todayVietnam().slice(0, 7));
  const [range, setRange] = useState({ start: '', end: '' }), [phase, setPhase] = useState<'start' | 'end'>('start'), [jump, setJump] = useState(false);
  const [year, monthNumber] = month.split('-').map(Number), count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate(), offset = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7;
  const move = (delta: number) => setMonth(new Date(Date.UTC(year, monthNumber - 1 + delta, 1)).toISOString().slice(0, 7));
  const choose = (date: string) => { if (phase === 'start' || !range.start || date < range.start) { setRange({ start: date, end: '' }); setPhase('end'); } else { setRange(current => ({ ...current, end: date })); setPhase('start'); } };
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><Pressable accessibilityRole="button" accessibilityLabel={label} style={styles.control} onPress={() => { setRange({ start: dateToIso(start), end: dateToIso(end || start) }); setMonth((dateToIso(start) || today).slice(0, 7)); setPhase('start'); setJump(false); setOpen(true); }}><Text>{start ? `${start} → ${end || start}` : 'Chọn khoảng ngày'} ▦</Text></Pressable>
    <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}><View style={styles.backdrop}><View style={styles.modal}>
      <Text style={styles.label}>{label}</Text><Text>{phase === 'start' ? 'Chạm ngày bắt đầu' : 'Chạm ngày kết thúc (có thể cùng ngày)'}</Text>
      <View style={styles.heading}><Pressable accessibilityRole="button" accessibilityLabel="Tháng trước" onPress={() => move(-1)}><Text style={styles.link}>‹</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Chọn tháng và năm" onPress={() => setJump(!jump)}><Text style={styles.label}>Tháng {monthNumber}/{year}⌄</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Tháng sau" onPress={() => move(1)}><Text style={styles.link}>›</Text></Pressable></View>
      {jump ? <><View style={{ flexDirection: 'row' }}><WheelColumn label="Tháng" options={Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))} value={String(monthNumber).padStart(2, '0')} onChange={value => setMonth(`${year}-${value}`)} /><WheelColumn label="Năm" options={Array.from({ length: 201 }, (_, i) => String(1900 + i))} value={String(year)} onChange={value => setMonth(`${value}-${String(monthNumber).padStart(2, '0')}`)} /></View><Pressable accessibilityRole="button" onPress={() => setJump(false)}><Text style={styles.link}>Xem lịch</Text></Pressable></> : <><View style={styles.grid}>{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => <View key={day} style={styles.cell}><Text>{day}</Text></View>)}</View><View style={styles.grid}>{Array.from({ length: offset + count }, (_, index) => { const day = index - offset + 1, iso = `${month}-${String(day).padStart(2, '0')}`, disabled = day < 1 || (!allowPast && iso < today), selected = iso === range.start || iso === range.end, between = iso > range.start && iso < range.end; return <Pressable key={index} accessibilityRole="button" accessibilityLabel={day > 0 ? isoToDate(iso) : undefined} accessibilityState={{ selected }} disabled={disabled} onPress={() => choose(iso)} style={[styles.cell, between && { backgroundColor: colors.background }, selected && styles.selected]}><Text style={{ opacity: disabled ? 0.25 : 1, fontWeight: selected ? '700' : '400' }}>{day > 0 ? day : ''}</Text></Pressable>; })}</View></>}
      <Text>{range.start ? isoToDate(range.start) : 'Bắt đầu'} → {range.end ? isoToDate(range.end) : 'Kết thúc'}</Text>
      <View style={styles.heading}><Pressable accessibilityRole="button" onPress={() => setOpen(false)}><Text style={styles.link}>Đóng</Text></Pressable><Pressable accessibilityRole="button" disabled={!range.start || !range.end} onPress={() => { onChange(isoToDate(range.start), isoToDate(range.end)); setOpen(false); }}><Text style={[styles.link, (!range.start || !range.end) && { opacity: 0.4 }]}>Dùng khoảng ngày</Text></Pressable></View>
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
