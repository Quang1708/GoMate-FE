import { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, PanResponder, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivityMatchCard, MatchActions, MatchHeader, MatchState } from '../components/match/MatchPrimitives';
import { MatchMoreMenu, NotInterestedSheet, ReportActivitySheet, SafetySheet, UndoSheet } from '../components/match/MatchSheets';
import { Activity, activities } from '../data/activities';
import { colors, layout } from '../theme';
import { Text } from '../components/LocalizedText';

type SheetName = 'more' | 'report' | 'safety' | 'undo' | 'notInterested' | null;

type MatchScreenProps = {
  error?: string;
  activityItems?: Activity[];
  onFilterPress: () => void;
  onMatched?: (activity: Activity) => Promise<boolean>;
  onBack: () => void;
  state?: 'ready' | 'loading' | 'location-required' | 'network-error' | 'activity-unavailable';
};

const HORIZONTAL_INTENT_DISTANCE = 7;
const HORIZONTAL_INTENT_RATIO = 1.1;
const FAST_SWIPE_DISTANCE = 24;
const FAST_SWIPE_VELOCITY = 0.45;

function isHorizontalGesture(dx: number, dy: number) {
  return Math.abs(dx) > HORIZONTAL_INTENT_DISTANCE && Math.abs(dx) > Math.abs(dy) * HORIZONTAL_INTENT_RATIO;
}

export function MatchScreen({ error, activityItems = activities, onFilterPress, onMatched, onBack, state = 'ready' }: MatchScreenProps) {
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastSkippedIndex, setLastSkippedIndex] = useState<number | null>(null);
  const [undoUsed, setUndoUsed] = useState(false);
  const [sheet, setSheet] = useState<SheetName>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [requestToast, setRequestToast] = useState(false);
  const [position] = useState(() => new Animated.ValueXY());
  const currentActivity = activityItems[currentIndex];
  const canUndo = lastSkippedIndex !== null && !undoUsed;

  useEffect(() => {
    if (!requestToast) return;
    const timer = setTimeout(() => setRequestToast(false), 3200);
    return () => clearTimeout(timer);
  }, [requestToast]);

  const skipCurrent = useCallback(() => {
    setLastSkippedIndex(currentIndex);
    setCurrentIndex((current) => current + 1);
    setSheet(null);
  }, [currentIndex]);

  const requestCurrent = useCallback(async () => {
    if (!currentActivity) return;
    if (!onMatched || !await onMatched(currentActivity)) return;
    setCurrentIndex((current) => current + 1);
    setRequestToast(true);
    setSheet(null);
  }, [currentActivity, onMatched]);

  const swipe = useCallback((direction: 'left' | 'right') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsSwiping(false);
    Animated.timing(position, {
      duration: 210,
      toValue: { x: direction === 'right' ? width * 1.25 : -width * 1.25, y: 4 },
      useNativeDriver: true,
    }).start(async ({ finished }) => {
      if (!finished) {
        setIsAnimating(false);
        return;
      }
      position.setValue({ x: 0, y: 0 });
      if (direction === 'left') skipCurrent();
      else await requestCurrent();
      setIsAnimating(false);
    });
  }, [isAnimating, position, requestCurrent, skipCurrent, width]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => isHorizontalGesture(gesture.dx, gesture.dy),
    onMoveShouldSetPanResponderCapture: (_, gesture) => isHorizontalGesture(gesture.dx, gesture.dy),
    onPanResponderGrant: () => {
      position.stopAnimation();
      setIsSwiping(true);
    },
    onPanResponderMove: (_, gesture) => position.setValue({ x: gesture.dx, y: gesture.dy * 0.08 }),
    onPanResponderRelease: (_, gesture) => {
      const swipeDistance = Math.min(96, Math.max(64, width * 0.18));
      const isFastSwipe = Math.abs(gesture.dx) > FAST_SWIPE_DISTANCE && Math.abs(gesture.vx) > FAST_SWIPE_VELOCITY;

      setIsSwiping(false);
      if (gesture.dx > swipeDistance || (isFastSwipe && gesture.vx > 0)) swipe('right');
      else if (gesture.dx < -swipeDistance || (isFastSwipe && gesture.vx < 0)) swipe('left');
      else Animated.spring(position, { friction: 7, tension: 55, toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => {
      setIsSwiping(false);
      Animated.spring(position, { friction: 7, tension: 55, toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
    },
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
  }), [position, swipe, width]);

  const rotate = position.x.interpolate({ inputRange: [-width, 0, width], outputRange: ['-7deg', '0deg', '7deg'] });

  const undoSkip = () => {
    if (lastSkippedIndex === null || undoUsed) return;
    setCurrentIndex(lastSkippedIndex);
    setUndoUsed(true);
    setSheet(null);
  };

  if (state !== 'ready') {
    const states = {
      loading: { icon: 'calendar-outline' as const, title: 'Đang tìm hoạt động phù hợp', message: 'GoMate đang chuẩn bị những gợi ý tốt nhất cho bạn.', action: undefined },
      'location-required': { icon: 'location-outline' as const, title: 'Cần quyền truy cập vị trí', message: 'Bật vị trí để xem các hoạt động phù hợp đang diễn ra gần bạn.', action: 'Bật vị trí' },
      'network-error': { icon: 'cloud-offline-outline' as const, title: 'Không thể kết nối', message: 'Kiểm tra kết nối mạng và thử lại sau ít phút.', action: 'Thử lại' },
      'activity-unavailable': { icon: 'calendar-outline' as const, title: 'Hoạt động không còn khả dụng', message: 'Hoạt động có thể đã đủ thành viên, bị hủy hoặc được host đóng.', action: 'Xem hoạt động tiếp theo' },
    };
    const currentState = states[state];
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.page}><MatchHeader onBack={onBack} onFilter={onFilterPress} /><MatchState action={currentState.action} icon={currentState.icon} message={currentState.message} onAction={currentState.action ? onFilterPress : undefined} title={currentState.title} /></View>
      </SafeAreaView>
    );
  }

  if (!currentActivity) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.page}>
          <MatchHeader onBack={onBack} onFilter={onFilterPress} />
          <MatchState action={canUndo ? 'Quay lại hoạt động vừa bỏ qua' : 'Điều chỉnh bộ lọc'} icon="calendar-outline" message="Hãy mở rộng khoảng cách, thời gian rảnh hoặc danh mục để tiếp tục Match." onAction={canUndo ? () => setSheet('undo') : onFilterPress} title="Không còn hoạt động phù hợp" />
        </View>
        <UndoSheet onCancel={() => setSheet(null)} onConfirm={undoSkip} visible={sheet === 'undo'} />
        {requestToast && <RequestToast />}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <MatchHeader onBack={onBack} onFilter={onFilterPress} />
        {error ? <Text style={{ color: colors.danger, padding: 14 }}>{error}</Text> : null}
        <View {...panResponder.panHandlers} style={styles.deck}>
          <ScrollView contentContainerStyle={styles.scrollContent} directionalLockEnabled scrollEnabled={!isSwiping} showsVerticalScrollIndicator={false}>
            <Animated.View style={{ transform: [...position.getTranslateTransform(), { rotate }] }}>
              <ActivityMatchCard activity={currentActivity} canUndo={canUndo} onMore={() => setSheet('more')} onUndo={() => setSheet('undo')} />
            </Animated.View>
            <View style={styles.scrollSpacer} />
          </ScrollView>
        </View>
        <MatchActions onInterested={() => swipe('right')} onSkip={() => swipe('left')} />
      </View>

      <MatchMoreMenu
        category={currentActivity.category}
        onClose={() => setSheet(null)}
        onHide={skipCurrent}
        onNotInterested={() => setSheet('notInterested')}
        onReport={() => setSheet('report')}
        onSafety={() => setSheet('safety')}
        visible={sheet === 'more'}
      />
      <ReportActivitySheet onClose={() => setSheet(null)} visible={sheet === 'report'} />
      <SafetySheet onClose={() => setSheet(null)} visible={sheet === 'safety'} />
      <UndoSheet onCancel={() => setSheet(null)} onConfirm={undoSkip} visible={sheet === 'undo'} />
      <NotInterestedSheet category={currentActivity.category} onCancel={() => setSheet(null)} onConfirm={skipCurrent} visible={sheet === 'notInterested'} />
      {requestToast && <RequestToast />}
    </SafeAreaView>
  );
}

function RequestToast() {
  return <View pointerEvents="none" style={styles.toast}><View style={styles.toastIcon}><Ionicons color={colors.white} name="paper-plane" size={18} /></View><View style={styles.toastCopy}><Text style={styles.toastTitle}>Đã gửi yêu cầu tham gia</Text><Text style={styles.toastMessage}>Host sẽ xem hồ sơ và phản hồi sau khi duyệt.</Text></View><Ionicons color={colors.success} name="checkmark-circle" size={22} /></View>;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  page: { alignSelf: 'center', flex: 1, maxWidth: layout.maxWidth, width: '100%' },
  deck: { flex: 1 },
  scrollContent: { paddingHorizontal: 14 },
  scrollSpacer: { height: 12 },
  toast: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.overlayHeavy, borderRadius: 18, bottom: 96, flexDirection: 'row', maxWidth: layout.maxWidth - 28, padding: 13, position: 'absolute', width: '92%' },
  toastIcon: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 14, height: 38, justifyContent: 'center', width: 38 },
  toastCopy: { flex: 1, marginHorizontal: 10 },
  toastTitle: { color: colors.white, fontSize: 12.5, fontWeight: '800' },
  toastMessage: { color: colors.whiteMuted, fontSize: 10.5, lineHeight: 15, marginTop: 2 },
});
