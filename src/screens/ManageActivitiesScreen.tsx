import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ActivityManagementPanel, ManagedActivityThumbnail } from '../components/ActivityManagementPanel';
import { ScreenHeader } from '../components/ScreenHeader';
import { RemoteState } from '../components/RemoteState';
import { Text } from '../components/LocalizedText';
import { Activity } from '../data/activities';
import { listOwned, toActivity } from '../services/activityApi';
import { useRemote } from '../services/useRemote';
import { colors, layout } from '../theme';

export function ManageActivitiesScreen({ onBack, onOpenMembers, onOpenGroup, onProgress }: { onBack: () => void; onOpenMembers?: (activity: Activity) => void; onOpenGroup?: (activity: Activity) => void; onProgress?: (activity: Activity) => void }) {
  const hosted = useRemote(listOwned, []);
  const [selectedId, setSelectedId] = useState('');
  const [revision, setRevision] = useState(0);
  const selected = hosted.data.find(row => row.id === selectedId) ?? hosted.data[0];
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><ScreenHeader onBack={onBack} title="Quản lý hoạt động" subtitle="Không gian dành cho host" />
    <ScrollView contentContainerStyle={{ padding: 18, gap: 20, maxWidth: layout.maxWidth, width: '100%', alignSelf: 'center', paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={hosted.loading} onRefresh={() => { setRevision(value => value + 1); void hosted.reload(); }} />}>
      <RemoteState {...hosted} onRetry={hosted.reload} />
      {!hosted.loading && !hosted.error && !hosted.data.length && <View style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 32, gap: 14, alignItems: 'center' }}><Ionicons name="sparkles-outline" color={colors.primary} size={36} /><Text style={{ fontSize: 20, fontWeight: '700' }}>Chuyến đi tiếp theo bắt đầu từ bạn</Text><Text style={{ color: colors.textSecondary, textAlign: 'center' }}>Sau khi đăng hoạt động, bạn có thể duyệt thành viên và điều hành nhóm tại đây.</Text></View>}
      {!!hosted.data.length && <><Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Hoạt động bạn tổ chức · {hosted.data.length}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>{hosted.data.map(row => <ManagedActivityThumbnail key={row.id} activity={toActivity(row)} selected={row.id === selected?.id} onPress={() => setSelectedId(row.id)} />)}</ScrollView></>}
      {selected && !hosted.error && <ActivityManagementPanel key={selected.id + ':' + revision} activityId={selected.id} onOpenGroup={onOpenGroup} onMembers={onOpenMembers} onProgress={onProgress || onOpenGroup} onDeleted={() => { setSelectedId(''); void hosted.reload(); }} onChanged={fresh => hosted.setData(rows => rows.map(row => row.id === fresh.id ? fresh : row))} />}
    </ScrollView>
  </SafeAreaView>;
}
