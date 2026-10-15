import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Text } from './LocalizedText';
import { downloadPlanFile, ItineraryStep, PlanFile, safePlanLink } from '../services/planService';
import { isoToDate } from './DateTimeField';
import { colors } from '../theme';
export function TripPlanView({ activityId, itinerary = [], plan = [], planLink, planFile, preview = false }: { activityId: string; itinerary?: ItineraryStep[]; plan?: string[]; planLink?: string; planFile?: PlanFile | null; preview?: boolean }) {
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  return <View style={{ gap: 12 }}>
    {itinerary.length ? itinerary.map((step, index) => <View key={step.id} style={{ gap: 4, borderLeftColor: colors.primaryLight, borderLeftWidth: 2, paddingLeft: 12 }}><Text style={{ color: colors.primary, fontSize: 12 }}>{isoToDate(step.date)} · {step.time}</Text><Text style={{ fontWeight: '600' }}>{index + 1}. {step.title}</Text>{step.place ? <Text>{step.place}</Text> : null}{step.note ? <Text style={{ color: colors.textSecondary }}>{step.note}</Text> : null}</View>) : plan.map((line, index) => <Text key={index}>{index + 1}. {line}</Text>)}
    {!itinerary.length && !plan.length && !planLink && !planFile && <Text style={{ color: colors.textMuted }}>Lịch trình sẽ được host cập nhật cùng nhóm.</Text>}
    {planLink ? <Pressable accessibilityRole="link" onPress={() => { if (!safePlanLink(planLink)) { setError('Dùng link HTTPS hợp lệ.'); return; } void Linking.openURL(planLink).catch(() => setError('Không mở được đường dẫn.')); }}><Text style={{ color: colors.primary }}>Mở kế hoạch online ↗</Text></Pressable> : null}
    {planFile && <Pressable accessibilityRole="button" disabled={busy || preview} onPress={() => { setBusy(true); setError(''); void downloadPlanFile(activityId, planFile).catch(reason => setError(reason instanceof Error ? reason.message : 'Không tải được tệp')).finally(() => setBusy(false)); }}><Text style={{ color: colors.primary }}>{busy ? 'Đang tải...' : 'Excel: ' + planFile.name}{preview ? ' · sẽ được đính kèm khi đăng' : ' ↓'}</Text></Pressable>}
    {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
  </View>;
}
