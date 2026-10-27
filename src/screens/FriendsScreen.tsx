import { ActivityInvitations } from '../components/ActivityInvitations';
import { useFeedbackState } from '../services/feedback';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { FormField } from '../components/FormField';
import { Text } from '../components/LocalizedText';
import { RemoteState } from '../components/RemoteState';
import { decideFriend, Friend, listFriendRequests, listFriends, removeFriend, requestFriend, searchPeople } from '../services/friendService';
import { imageUrl } from '../services/profileService';
import { useRemote } from '../services/useRemote';
import { colors, layout } from '../theme';
async function load() { const [friends, requests] = await Promise.all([listFriends(), listFriendRequests()]); return { friends, requests }; }
export function FriendsScreen({ onBack, onChat }: { onBack: () => void; onChat: (userId: string) => Promise<void> }) {
  const remote = useRemote(load, { friends: [], requests: [] });
  const [query, setQuery] = useState(''), [results, setResults] = useState<Friend[] | null>(null), [error, setError] = useFeedbackState(''), [busy, setBusy] = useState(false), [removeId, setRemoveId] = useState('');
  const lock = useRef(false), reload = remote.reload;
  useEffect(() => { const timer = setInterval(() => { if (!lock.current) void reload(true); }, 10000); return () => clearInterval(timer); }, [reload]);
  const run = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await action(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không xử lý được yêu cầu'); }
    finally { lock.current = false; setBusy(false); }
  };
  const row = (person: Friend, children: React.ReactNode) => <View key={person.id} style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 12 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>{person.avatarUrl && <Image source={{ uri: imageUrl(person.avatarUrl) }} style={{ width: 44, height: 44, borderRadius: 22 }} />}<View style={{ flex: 1 }}><Text style={{ fontWeight: '700' }}>{person.name}</Text>{person.username ? <Text style={{ color: colors.textMuted }}>@{person.username}</Text> : null}<Text style={{ color: colors.textMuted }}>{person.location}</Text></View></View>{children}
  </View>;
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><ScreenHeader title="Bạn bè GoMate" onBack={onBack} right={<Pressable accessibilityRole="button" accessibilityLabel="Làm mới bạn bè" onPress={() => void remote.reload()}><Text style={{ color: colors.primary }}>Làm mới</Text></Pressable>} />
    <ScrollView contentContainerStyle={{ padding: 18, gap: 14, maxWidth: layout.maxWidth, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
      <ActivityInvitations />
      <FormField label="Tìm bạn bằng tên hoặc Nickname" value={query} onChangeText={setQuery} placeholder="Nhập ít nhất 2 ký tự" /><Pressable accessibilityRole="button" disabled={busy} onPress={() => void run(async () => { setResults(await searchPeople(query.trim())); })}><Text style={{ color: colors.primary }}>{busy ? 'Đang xử lý...' : 'Tìm bạn'}</Text></Pressable>
      {error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}
      {results !== null && <><Text style={{ fontSize: 18, fontWeight: '700' }}>Kết quả tìm kiếm</Text>{!results.length && <Text>Chưa tìm thấy người dùng phù hợp.</Text>}{results.map(person => row(person, person.friendshipStatus === 'accepted' ? <Text>Đã là bạn bè</Text> : person.friendshipStatus === 'pending' ? <Text>{person.incoming ? 'Có lời mời từ người này ở bên dưới' : 'Đã gửi lời mời'}</Text> : <Pressable accessibilityRole="button" accessibilityLabel={'Kết bạn với ' + person.name} disabled={busy} onPress={() => void run(async () => { await requestFriend(person.id); await remote.reload(); setResults(await searchPeople(query.trim())); })}><Text style={{ color: colors.primary }}>Kết bạn</Text></Pressable>))}</>}
      {remote.loading || remote.error ? <RemoteState {...remote} onRetry={remote.reload} /> : <>
        <Text style={{ fontSize: 18, fontWeight: '700' }}>Lời mời kết bạn</Text>
        {!remote.data.requests.length && <Text style={{ color: colors.textMuted }}>Chưa có lời mời đang chờ.</Text>}
        {remote.data.requests.map(person => row(person, person.incoming ? <View style={{ flexDirection: 'row', gap: 24 }}><Pressable accessibilityRole="button" accessibilityLabel={'Chấp nhận ' + person.name} disabled={busy} onPress={() => void run(async () => { await decideFriend(person.friendshipId!, 'accepted'); await remote.reload(); setResults(null); })}><Text style={{ color: colors.primary }}>Chấp nhận</Text></Pressable><Pressable accessibilityRole="button" disabled={busy} onPress={() => void run(async () => { await decideFriend(person.friendshipId!, 'declined'); await remote.reload(); })}><Text>Từ chối</Text></Pressable></View> : <Pressable accessibilityRole="button" disabled={busy} onPress={() => void run(async () => { await removeFriend(person.id); await remote.reload(); })}><Text>Hủy lời mời đã gửi</Text></Pressable>))}
        <Text style={{ fontSize: 18, fontWeight: '700' }}>Bạn bè ({remote.data.friends.length})</Text>
        {!remote.data.friends.length && <Text>Kết bạn từ hồ sơ thành viên hoặc tìm bằng tên/Nickname ở trên.</Text>}
        {remote.data.friends.map(person => row(person, <View style={{ flexDirection: 'row', gap: 24 }}><Pressable accessibilityRole="button" accessibilityLabel={'Nhắn tin cho ' + person.name} disabled={busy} onPress={() => void run(() => onChat(person.id))}><Text style={{ color: colors.primary }}>Nhắn tin</Text></Pressable><Pressable accessibilityRole="button" disabled={busy} onPress={() => setRemoveId(person.id)}><Text>Bỏ kết bạn</Text></Pressable></View>))}
        {removeId && <View style={{ gap: 12 }}><Text>Bỏ kết bạn với người này?</Text><Pressable accessibilityRole="button" disabled={busy} onPress={() => void run(async () => { await removeFriend(removeId); setRemoveId(''); await remote.reload(); })}><Text style={{ color: colors.danger }}>Xác nhận bỏ kết bạn</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setRemoveId('')}><Text>Giữ lại</Text></Pressable></View>}
      </>}
    </ScrollView>
  </SafeAreaView>;
}
