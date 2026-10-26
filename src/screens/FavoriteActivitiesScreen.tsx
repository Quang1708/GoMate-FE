import { useFeedbackState } from '../services/feedback';
import { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { Text } from '../components/LocalizedText';
import { RemoteState } from '../components/RemoteState';
import { listFavorites, setFavorite } from '../services/matchService';
import { listMyRequests, toActivity } from '../services/activityApi';
import { useRemote } from '../services/useRemote';
import { Activity } from '../data/activities';
import { colors, layout } from '../theme';
async function loadFavoriteActivities() {
  const [rows, requests] = await Promise.all([listFavorites(), listMyRequests()]);
  return rows.map(row => toActivity(row, requests.find(request => request.activityId === row.id)?.status));
}
export function FavoriteActivitiesScreen({ onBack, onOpen, onChanged }: { onChanged: () => void; onBack: () => void; onOpen: (activity: Activity) => void }) {
  const remote = useRemote(loadFavoriteActivities, []);
  const lock = useRef(false);
  const [busy, setBusy] = useState(false), [error, setError] = useFeedbackState('');
  const remove = async (id: string) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await setFavorite(id, false); remote.setData(rows => rows.filter(row => row.id !== id)); onChanged(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không bỏ lưu được hoạt động'); }
    finally { lock.current = false; setBusy(false); }
  };
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><ScreenHeader title="Hoạt động yêu thích" onBack={onBack} />
    {remote.loading || remote.error ? <RemoteState {...remote} onRetry={remote.reload} /> : <ScrollView contentContainerStyle={{ padding: 18, gap: 14, width: '100%', maxWidth: layout.maxWidth, alignSelf: 'center' }}>
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      {!remote.data.length && <Text>Bạn chưa lưu hoạt động nào. Nhấn trái tim trên thẻ Match để lưu.</Text>}
      {remote.data.map(activity => { return <View key={activity.id} style={{ gap: 10 }}><Pressable accessibilityRole="button" onPress={() => onOpen(activity)} style={{ backgroundColor: colors.surface, borderRadius: 18, overflow: 'hidden' }}>
        <Image source={activity.image} style={{ height: 160, width: '100%' }} /><View style={{ padding: 16, gap: 8 }}><Text style={{ fontWeight: '700', fontSize: 17 }}>{activity.title}</Text><Text>{activity.location}</Text><Text>{activity.time}</Text><Text style={{ color: colors.primary }}>{activity.backendStatus === 'completed' ? 'Đã kết thúc' : activity.backendStatus === 'in-progress' ? 'Đang diễn ra' : 'Xem hoạt động'}</Text></View>
      </Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Bỏ lưu ${activity.title}`} disabled={busy} onPress={() => void remove(activity.id)}><Text style={{ color: colors.primary }}>Bỏ lưu hoạt động</Text></Pressable></View>; })}
    </ScrollView>}
  </SafeAreaView>;
}
