import { useFeedbackState } from '../services/feedback';
import { useCallback, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './LocalizedText';
import { RemoteState } from './RemoteState';
import { TripPlanEditor } from './TripPlanEditor';
import { TripPlanView } from './TripPlanView';
import { PlanOverview } from './PlanOverview';
import { BusinessIdentity } from './BusinessIdentity';
import { ActivityDto, getActivity, toActivity } from '../services/activityApi';
import { getSession } from '../services/api';
import { PlanDraft, saveActivityPlan } from '../services/planService';
import { useRemote } from '../services/useRemote';
import { colors } from '../theme';
const local = (iso: string) => new Date(new Date(iso).getTime() + 7 * 3600000).toISOString();
const displayed = (iso: string) => { const [year, month, day] = local(iso).slice(0, 10).split('-'); return day + '/' + month + '/' + year; };
export function ActivityPlanPanel({ activityId, onChanged, onManage, onProgress }: { activityId: string; onChanged?: (activity: ActivityDto) => void; onManage?: () => void; onProgress?: (activity: ActivityDto) => void }) {
  const loader = useCallback(() => getActivity(activityId), [activityId]);
  const remote = useRemote(loader, null);
  const [draft, setDraft] = useState<PlanDraft | null>(null), [editingVersion, setEditingVersion] = useState(0), [busy, setBusy] = useState(false), [fileBusy, setFileBusy] = useState(false), [error, setError] = useFeedbackState('');
  const lock = useRef(false);
  const row = remote.data;
  const edit = () => {
    if (!row) return;
    setEditingVersion(row.version ?? 0);
    setDraft({ itinerary: row.itinerary?.length ? row.itinerary : (row.plan || []).map((title, index) => ({ id: 'legacy-' + index, date: local(row.startsAt).slice(0, 10), time: local(row.startsAt).slice(11, 16), title, place: '', note: '' })), planLink: row.planLink || '', planFile: row.planFile });
  };
  const save = async () => {
    if (!draft || lock.current || fileBusy) return;
    lock.current = true; setBusy(true); setError('');
    try { const updated = await saveActivityPlan(activityId, editingVersion, draft); remote.setData(updated); onChanged?.(updated); setDraft(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không lưu được kế hoạch'); }
    finally { lock.current = false; setBusy(false); }
  };
  if (remote.loading || remote.error || !row) return <RemoteState {...remote} onRetry={remote.reload} />;
  return <View style={{ gap: 16 }}><Text style={{ fontSize: 23, fontWeight: '800', color: colors.text }}>{row.organizerType === 'business' ? 'Chương trình sự kiện' : 'Kế hoạch chuyến đi'}</Text><BusinessIdentity activity={toActivity(row)} />
    {onProgress && (row.status === 'in-progress' || row.status === 'completed') && <Pressable accessibilityRole="button" onPress={() => onProgress(row)} style={{ minHeight: 44, padding: 12, borderRadius: 12, backgroundColor: colors.primarySoft, justifyContent: 'center' }}><Text style={{ color: colors.primary, fontWeight: '700' }}>{row.status === 'completed' ? 'Xem tổng kết' : 'Xem diễn biến'}</Text></Pressable>}
    {onManage && row.status === 'published' && <Pressable accessibilityRole="button" onPress={onManage} style={{ minHeight: 44, padding: 12, borderRadius: 12, backgroundColor: colors.primarySoft, justifyContent: 'center' }}><Text style={{ color: colors.primary, fontWeight: '700' }}>{row.scheduleConfirmedAt ? 'Lịch đã chốt · Sang Quản lý để bắt đầu →' : 'Sang Quản lý để chốt lịch & bắt đầu →'}</Text></Pressable>}
    <PlanOverview activity={row} />
    {draft ? <View style={{ padding: 16, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 18 }}><TripPlanEditor value={draft} onChange={patch => setDraft(current => current ? { ...current, ...patch } : current)} startDate={displayed(row.startsAt)} endDate={displayed(row.endsAt || row.startsAt)} startTime={local(row.startsAt).slice(11, 16)} endTime={local(row.endsAt || row.startsAt).slice(11, 16)} onBusyChange={setFileBusy} /><View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}><Pressable accessibilityRole="button" disabled={busy || fileBusy} onPress={() => void save()} style={{ backgroundColor: colors.primary, padding: 14, borderRadius: 12 }}><Text style={{ color: colors.white, fontWeight: '700' }}>{busy ? 'Đang lưu...' : 'Lưu kế hoạch'}</Text></Pressable><Pressable accessibilityRole="button" disabled={busy || fileBusy} style={{ padding: 14 }} onPress={() => { setDraft(null); setError(''); }}><Text>Hủy chỉnh sửa kế hoạch</Text></Pressable></View></View> : <><TripPlanView activityId={row.id} itinerary={row.itinerary} plan={row.plan} planLink={row.planLink} planFile={row.planFile} />{row.hostId === getSession()?.user.id && ['published', 'in-progress'].includes(row.status || '') && <Pressable accessibilityRole="button" onPress={edit} style={{ minHeight: 48, borderWidth: 1, borderColor: colors.primary, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.primary, fontWeight: '700' }}>Chỉnh sửa kế hoạch chuyến đi</Text></Pressable>}</>}
    {error ? <View style={{ gap: 10 }}><Text style={{ color: colors.danger }}>{error}</Text><Pressable accessibilityRole="button" disabled={busy} onPress={() => { setDraft(null); setError(''); void remote.reload(); }}><Text style={{ color: colors.primary }}>Tải lại kế hoạch mới nhất</Text></Pressable></View> : null}
  </View>;
}
