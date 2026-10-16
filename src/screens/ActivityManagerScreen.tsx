import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/LocalizedText';
import { ScreenHeader } from '../components/ScreenHeader';
import { ActivityRecord, deleteActivity, getActivity, myHostedActivities } from '../services/legacyActivityService';
import { getSession } from '../services/authService';
import { LegacyCreateActivityScreen } from './LegacyCreateActivityScreen';
import { colors } from '../theme';

export function ActivityManagerScreen({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<ActivityRecord[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    myHostedActivities(page).then(data => {
      if (!active) return;
      setItems(current => page === 1 ? data.items : [...current, ...data.items.filter(item => !current.some(old => old.id === item.id))]);
      setHasMore(data.hasMore); setError('');
    }).catch(reason => { if (active) setError(reason.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, refresh]);
  const reload = () => { setLoading(true); setPage(1); setRefresh(value => value + 1); };
  if (selected) return <ApiActivityDetailScreen id={selected} onBack={() => { setSelected(undefined); reload(); }} />;
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <ScreenHeader title="Hoạt động tôi tổ chức" onBack={onBack} />
    <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
      <Pressable disabled={loading} onPress={reload}><Text>Làm mới</Text></Pressable>
      {!!error && <Pressable onPress={reload}><Text accessibilityRole="alert">{error} · Thử lại</Text></Pressable>}
      {loading && <Text>Đang tải…</Text>}
      {!loading && !error && !items.length && <Text>Bạn chưa tạo hoạt động nào. Mở tab Tạo để bắt đầu.</Text>}
      {items.map(item => <Pressable key={item.id} onPress={() => setSelected(item.id)} style={{ padding: 16, borderRadius: 16, backgroundColor: colors.surface }}>
        <Text style={{ fontWeight: '700', fontSize: 18 }}>{item.title}</Text>
        <Text>{new Date(item.startsAt).toLocaleString('vi-VN', { timeZone: 'Asia/Bangkok' })}</Text>
        <Text>{item.location} · {item.memberCount}/{item.maxParticipants} người</Text>
        <Text>Xem chi tiết / Sửa / Xóa</Text>
      </Pressable>)}
      {hasMore && !error && <Pressable disabled={loading} onPress={() => { setLoading(true); setPage(value => value + 1); }}><Text>Tải thêm</Text></Pressable>}
    </ScrollView>
  </SafeAreaView>;
}

export function ApiActivityDetailScreen({ id, onBack }: { id: string; onBack: () => void }) {
  const [item, setItem] = useState<ActivityRecord>();
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const deleting = useRef(false);
  useEffect(() => {
    let active = true;
    getActivity(id).then(data => { if (active) { setItem(data.activity); setCanEdit(new Date(data.activity.startsAt).getTime() > Date.now()); setError(''); } }).catch(reason => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, [id, refresh]);
  const remove = async () => {
    if (deleting.current) return;
    deleting.current = true; setBusy(true);
    try { await deleteActivity(id); onBack(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không xóa được hoạt động.'); }
    finally { deleting.current = false; setBusy(false); }
  };
  if (editing && item) return <SafeAreaView style={{ flex: 1 }}><LegacyCreateActivityScreen editing={item} onCancel={() => setEditing(false)} onCreated={() => { setEditing(false); setItem(undefined); setRefresh(value => value + 1); }} /></SafeAreaView>;
  const owner = item?.hostId === getSession()?.user.id;
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <ScreenHeader title="Chi tiết hoạt động" onBack={() => { if (!busy) onBack(); }} />
    <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
      {!!error && <Pressable onPress={() => setRefresh(value => value + 1)}><Text accessibilityRole="alert">{error} · Thử lại</Text></Pressable>}
      {!item && !error && <Text>Đang tải…</Text>}
      {item && <>
        {!!item.imageUrl && <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 230, borderRadius: 16 }} />}
        <Text style={{ fontSize: 24, fontWeight: '700' }}>{item.title}</Text>
        <Text>{item.category} · Host: {item.hostName}</Text>
        <Text>{item.description}</Text>
        <Text>Bắt đầu: {new Date(item.startsAt).toLocaleString('vi-VN', { timeZone: 'Asia/Bangkok' })}</Text>
        {!!item.endsAt && <Text>Kết thúc: {new Date(item.endsAt).toLocaleString('vi-VN', { timeZone: 'Asia/Bangkok' })}</Text>}
        <Text>{item.location}</Text>
        <Text>{item.memberCount}/{item.maxParticipants} người · {item.estimatedCost.toLocaleString('vi-VN')}đ/người</Text>
        {(item.requirements ?? []).map(value => <Text key={value}>• {value}</Text>)}
        {(item.plan ?? []).map(value => <Text key={value}>• {value}</Text>)}
        {owner ? <View style={{ gap: 16 }}>
          {canEdit && <Pressable disabled={busy} onPress={() => setEditing(true)}><Text>Sửa hoạt động</Text></Pressable>}
          {!confirmDelete ? <Pressable onPress={() => setConfirmDelete(true)}><Text>Xóa hoạt động</Text></Pressable> : <View style={{ gap: 12 }}>
            <Text>Xóa hoạt động này khỏi danh sách và Match?</Text>
            <Pressable disabled={busy} onPress={() => void remove()}><Text>{busy ? 'Đang xóa…' : 'Xác nhận xóa'}</Text></Pressable>
            <Pressable disabled={busy} onPress={() => setConfirmDelete(false)}><Text>Giữ lại</Text></Pressable>
          </View>}
        </View> : <Text>Gửi yêu cầu tham gia sẽ được bổ sung sau.</Text>}
      </>}
    </ScrollView>
  </SafeAreaView>;
}
