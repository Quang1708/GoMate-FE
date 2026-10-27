import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Activity } from '../data/activities';
import { colors } from '../theme';
import { PreferencesSummary } from './ActivityChoices';
import { Text } from './LocalizedText';

const JoinContext = createContext<(activity: Activity) => Promise<boolean>>(async () => false);
export const useJoinConfirmation = () => useContext(JoinContext);

export function JoinConfirmationProvider({ children }: { children: ReactNode }) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [accepted, setAccepted] = useState(false);
  const pending = useRef<((confirmed: boolean) => void) | null>(null);
  useEffect(() => () => { pending.current?.(false); }, []);
  const finish = (confirmed: boolean) => {
    pending.current?.(confirmed); pending.current = null; setActivity(null); setAccepted(false);
  };
  const confirm = (next: Activity) => new Promise<boolean>(resolve => {
    pending.current?.(false); pending.current = resolve; setAccepted(false); setActivity(next);
  });
  return <JoinContext.Provider value={confirm}>{children}<Modal visible={Boolean(activity)} transparent animationType="fade" onRequestClose={() => finish(false)}>
    <View style={{ flex: 1, backgroundColor: '#15203388', justifyContent: 'center', padding: 20 }}><View accessibilityViewIsModal style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 20, maxHeight: '90%', width: '100%', maxWidth: 500, alignSelf: 'center', gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Cam kết tham gia</Text>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
        <Text style={{ fontSize: 17, fontWeight: '600' }}>{activity?.title}</Text>
        <Text>{activity?.time}</Text><Text>{activity?.meetingPoint || activity?.location}</Text>
        <PreferencesSummary value={activity?.participantPreferences} />
        {activity?.requirements.map((item, index) => <Text key={index}>• {item}</Text>)}
        <Text>Tôi đã đọc thông tin và điều kiện của hoạt động, cam kết tham gia đúng lịch khi được duyệt, tôn trọng các thành viên và báo sớm cho host nếu không thể tham gia.</Text>
        <Pressable accessibilityRole="checkbox" accessibilityLabel="Tôi đồng ý với cam kết tham gia" accessibilityState={{ checked: accepted }} onPress={() => setAccepted(value => !value)} style={{ padding: 14, borderWidth: 1, borderColor: accepted ? colors.primary : colors.border, borderRadius: 12 }}><Text>{accepted ? '☑' : '☐'} Tôi đồng ý với cam kết tham gia</Text></Pressable>
      </ScrollView>
      <Pressable accessibilityRole="button" disabled={!accepted} onPress={() => finish(true)} style={{ backgroundColor: colors.primary, opacity: accepted ? 1 : 0.4, padding: 15, borderRadius: 14, alignItems: 'center' }}><Text style={{ color: colors.white, fontWeight: '700' }}>Xác nhận và gửi yêu cầu</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => finish(false)} style={{ padding: 10, alignItems: 'center' }}><Text>Hủy</Text></Pressable>
    </View></View>
  </Modal></JoinContext.Provider>;
}
