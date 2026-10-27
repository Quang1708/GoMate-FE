import { useFeedbackState } from '../services/feedback';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './LocalizedText';
import { GradientButton } from './GradientButton';
import { ActivityDto, confirmActivitySchedule, transitionActivity } from '../services/activityApi';
import { getSession } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme';

type Props = {
  activity: ActivityDto;
  compact?: boolean;
  showTimeline?: boolean;
  showActions?: boolean;
  onChanged?: (activity: ActivityDto) => void;
  onProgress?: (activity: ActivityDto) => void;
  onPlan?: () => void;
};
const stages = ['Lên kế hoạch', 'Đã chốt lịch', 'Đang diễn ra', 'Đã kết thúc'];

export function ActivityLifecyclePanel({ activity, compact = false, showTimeline = true, showActions = true, onChanged, onProgress, onPlan }: Props) {
  const [confirmation, setConfirmation] = useState<{ action: 'schedule' | 'start'; version: number } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { translate } = useLanguage();
  const [busy, setBusy] = useState(false), [error, setError] = useFeedbackState('');
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 10000); return () => clearInterval(timer); }, []);
  const locked = useRef(false);
  const isHost = activity.hostId === getSession()?.user.id;
  const completed = activity.status === 'completed', running = activity.status === 'in-progress';
  const phase = completed ? 3 : running ? 2 : activity.scheduleConfirmedAt ? 1 : 0;
  const canConfirm = !completed && !running && new Date(activity.startsAt).getTime() > now;
  const scheduleFirst = phase === 0;
  const blockedReason = !running && !completed && isHost ? activity.readiness?.reason || (!activity.readiness ? 'Đang kiểm tra điều kiện thành viên. Hãy làm mới.' : '') : '';
  const actionDisabled = busy || Boolean(blockedReason) || (scheduleFirst && isHost && !canConfirm);
  const actionLabel = completed ? 'Xem tổng kết' : running ? isHost ? 'Điểm danh & kết thúc' : 'Xem diễn biến' : isHost ? scheduleFirst ? 'Chốt lịch đi' : 'Bắt đầu hoạt động' : 'Xem kế hoạch';
  const description = completed ? 'Hoạt động đã kết thúc. Xem tổng kết và gửi đánh giá.'
    : running ? isHost ? 'Điểm danh cả nhóm trước khi kết thúc để thành viên có thể đánh giá.' : 'Hoạt động đang diễn ra. Host sẽ điểm danh và cập nhật cho nhóm.'
      : phase === 1 ? isHost ? 'Lịch đã chốt. Khi nhóm sẵn sàng, bấm Bắt đầu để mở điểm danh.' : 'Lịch đã chốt. Chờ host bắt đầu hoạt động.'
        : isHost ? canConfirm ? 'Hoàn thiện kế hoạch, chốt lịch rồi bắt đầu khi nhóm sẵn sàng.' : 'Đã đến giờ hẹn nhưng lịch chưa được chốt. Hãy điều chỉnh lịch hẹn trước khi bắt đầu.' : 'Cùng lên kế hoạch. Host sẽ chốt thời gian và địa điểm.';
  const openConfirmation = (action: 'schedule' | 'start') => { setError(''); setConfirmation({ action, version: activity.version ?? 0 }); setDialogOpen(true); };
  const confirm = async () => {
    if (!confirmation || locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try {
      const fresh = confirmation.action === 'schedule'
        ? await confirmActivitySchedule(activity.id, confirmation.version)
        : await transitionActivity(activity.id, 'start');
      onChanged?.(fresh); setDialogOpen(false);
      if (confirmation.action === 'start') onProgress?.(fresh);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Chưa cập nhật được hoạt động. Vui lòng thử lại.'); }
    finally { locked.current = false; setBusy(false); }
  };
  const primaryAction = () => {
    if (completed || running) onProgress?.(activity);
    else if (isHost) openConfirmation(scheduleFirst ? 'schedule' : 'start');
    else onPlan?.();
  };
  if (activity.status === 'expired') return <View style={styles.card}><Text style={styles.title}>Hoạt động đã hết hạn</Text><Text style={styles.description}>Hoạt động chưa được bắt đầu trước khi hết lịch. Không mở điểm danh hoặc đánh giá.</Text></View>;
  return <View style={[styles.card, compact && styles.compact]}>
    {showTimeline && <View accessibilityLabel={`${translate('Tiến trình hoạt động')}: ${translate(stages[phase])}`} style={styles.timeline}>
      {stages.map((label, index) => {
        const skipped = index === 1 && !activity.scheduleConfirmedAt && phase > 1;
        return <View key={label} style={styles.step}>
        <View style={styles.track}>{index > 0 && <View style={[styles.line, index <= phase && styles.doneLine]} />}
          <View style={[styles.dot, index <= phase && !skipped && styles.doneDot, index === phase && styles.currentDot]}>
            {skipped ? <Ionicons name="remove" size={13} color={colors.textMuted} /> : index < phase ? <Ionicons name="checkmark" size={13} color={colors.white} /> : <Text style={[styles.number, index === phase && { color: colors.white }]}>{index + 1}</Text>}
          </View>{index < stages.length - 1 && <View style={[styles.line, { left: '50%', right: 0 }, index < phase && styles.doneLine]} />}
        </View>
        <Text style={[styles.stepLabel, index === phase && styles.currentLabel]}>{skipped ? 'Không chốt lịch' : label}</Text>
      </View>; })}
    </View>}
    {showActions && <>
      {!compact && <Text style={styles.title}>{isHost ? 'Bước tiếp theo của host' : stages[phase]}</Text>}
      <Text style={styles.description}>{description}</Text>
      {!compact && !running && !completed && <View style={styles.appointment}><Text style={styles.appointmentTitle}>{activity.scheduleConfirmedAt ? 'Lịch đã chốt' : 'Lịch hẹn dự kiến'}</Text><Text style={styles.description}>{new Date(activity.startsAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</Text><Text style={styles.description}>{activity.meetingPoint || activity.location}</Text></View>}
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel={translate(actionLabel)} accessibilityState={{ disabled: actionDisabled }} disabled={actionDisabled} onPress={primaryAction} style={[styles.primary, actionDisabled && { opacity: 0.5 }]}><Ionicons name={completed ? 'ribbon-outline' : running ? 'checkbox-outline' : isHost && !scheduleFirst ? 'play-circle-outline' : 'calendar-outline'} size={19} color={colors.white} /><Text style={styles.primaryText}>{actionLabel}</Text></Pressable>
        {!running && !completed && isHost && onPlan && <Pressable accessibilityRole="button" onPress={onPlan} style={styles.secondary}><Text style={styles.link}>Xem kế hoạch</Text></Pressable>}
      </View>
      {blockedReason ? <Text accessibilityRole="alert" style={styles.description}>{blockedReason}</Text> : null}
    </>}
    <Modal visible={dialogOpen} transparent animationType="fade" onRequestClose={() => { if (!busy) setDialogOpen(false); }}>
      <View style={styles.overlay}><View accessibilityViewIsModal style={styles.dialog}>
        <Ionicons name={confirmation?.action === 'schedule' ? 'calendar-outline' : 'play-circle-outline'} size={30} color={colors.primary} />
        <Text style={styles.title}>{confirmation?.action === 'schedule' ? 'Chốt lịch đi?' : 'Bắt đầu hoạt động?'}</Text>
        <Text style={styles.description}>{confirmation?.action === 'schedule' ? 'Xác nhận thời gian và địa điểm này cho cả nhóm. Nếu thay đổi lịch hẹn, bạn cần chốt lại.' : 'Bắt đầu sẽ đóng nhận thành viên mới và mở điểm danh. Hãy điểm danh trước khi kết thúc để mọi người có thể đánh giá.'}</Text>
        <Text style={styles.appointmentTitle}>{new Date(activity.startsAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</Text><Text style={styles.description}>{activity.meetingPoint || activity.location}</Text>
        {error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}
        <GradientButton disabled={busy} label={busy ? 'Đang xử lý...' : 'Xác nhận'} onPress={() => void confirm()} />
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => setDialogOpen(false)} style={styles.secondary}><Text style={styles.link}>Để sau</Text></Pressable>
      </View></View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  card: { gap: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 16 },
  compact: { borderRadius: 0, borderWidth: 0, borderBottomWidth: 1, paddingVertical: 10, paddingHorizontal: 14, gap: 8 },
  timeline: { flexDirection: 'row' }, step: { flex: 1, gap: 5 }, track: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 24 },
  line: { position: 'absolute', left: 0, right: '50%', height: 2, backgroundColor: colors.border },
  doneLine: { backgroundColor: colors.primary },
  dot: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  doneDot: { backgroundColor: colors.primary, borderColor: colors.primary }, currentDot: { borderWidth: 2, borderColor: colors.primary },
  number: { color: colors.textMuted, fontSize: 11, fontWeight: '800' }, stepLabel: { color: colors.textMuted, fontSize: 10, lineHeight: 15, textAlign: 'center' }, currentLabel: { color: colors.primary, fontWeight: '800' },
  title: { fontSize: 19, lineHeight: 26, fontWeight: '800', color: colors.text }, description: { fontSize: 12, lineHeight: 19, color: colors.textSecondary },
  appointment: { gap: 6, padding: 12, backgroundColor: colors.primarySoft, borderRadius: 12 }, appointmentTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }, primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 14, minHeight: 44, flexGrow: 1 },
  primaryText: { color: colors.white, fontWeight: '700', fontSize: 13 }, secondary: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center' }, link: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#19152B66', padding: 24 }, dialog: { width: '100%', maxWidth: 430, padding: 24, gap: 16, borderRadius: 26, backgroundColor: colors.surface },
});
