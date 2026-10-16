import { Pressable, TextInput, View } from 'react-native';
import { Text } from './LocalizedText';
import { colors } from '../theme';
export function NumberStepper({ label, value, onChange, min = 0, max = 1000, hint }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; hint?: string }) {
  return <View style={{ gap: 6 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}><View style={{ flex: 1 }}><Text style={{ fontWeight: '600' }}>{label}</Text>{hint ? <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>{hint}</Text> : null}</View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Giảm ${label.toLowerCase()}`} disabled={value <= min} onPress={() => onChange(Math.max(min, value - 1))} style={{ padding: 10, backgroundColor: colors.primarySoft, borderRadius: 12 }}><Text style={{ color: value <= min ? colors.textMuted : colors.primary }}>−</Text></Pressable>
    <TextInput accessibilityLabel={label} keyboardType="number-pad" selectTextOnFocus value={String(value)} onChangeText={text => onChange(Math.min(max, Number(text.replace(/\D/g, ''))))} onBlur={() => { if (value < min) onChange(min); }} style={{ width: 54, minHeight: 44, textAlign: 'center', fontWeight: '700', color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.border }} />
    <Pressable accessibilityRole="button" accessibilityLabel={`Tăng ${label.toLowerCase()}`} disabled={value >= max} onPress={() => onChange(Math.min(max, value + 1))} style={{ padding: 10, backgroundColor: colors.primarySoft, borderRadius: 12 }}><Text style={{ color: value >= max ? colors.textMuted : colors.primary }}>+</Text></Pressable>
  </View></View>;
}
