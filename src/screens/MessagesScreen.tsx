import { useEffect, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../components/LocalizedText';
import { RemoteState } from '../components/RemoteState';
import { Conversation, listConversations } from '../services/chatService';
import { getSession } from '../services/api';
import { imageUrl } from '../services/profileService';
import { searchKey } from '../data/profileOptions';
import { useRemote } from '../services/useRemote';
import { colors, layout } from '../theme';
export type { Conversation } from '../services/chatService';
type InboxFilter = 'all' | 'unread' | 'group' | 'direct';

function timeLabel(value?: string) {
  if (!value) return '';
  const date = new Date(value), now = new Date();
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString() ? 'Hôm qua' : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export function MessagesScreen({ onOpenChat, onFriends }: { onOpenChat: (conversation: Conversation) => void; onFriends: () => void }) {
  const remote = useRemote(listConversations, []);
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState(''), [filter, setFilter] = useState<InboxFilter>('all');
  const reload = remote.reload;
  useEffect(() => { const timer = setInterval(() => void reload(), 10000); return () => clearInterval(timer); }, [reload]);
  const rows = remote.data.filter(row => (filter === 'all' || filter === 'unread' && row.unreadCount > 0 || row.type === filter) && searchKey(row.name + ' ' + row.activityTitle + ' ' + (row.lastMessage?.text || '')).includes(searchKey(query)));
  return <View style={styles.screen}>
    <View style={styles.top}><View><Text style={styles.title}>Tin nhắn</Text><Text style={styles.subtitle}></Text></View><Pressable accessibilityRole="button" accessibilityLabel="Bạn bè và cuộc trò chuyện mới" onPress={onFriends} style={styles.newChat}><Ionicons name="people-outline" color={colors.primary} size={25} /></Pressable></View>
    <View style={[styles.search, focused && { borderColor: colors.primaryLight }]}><Ionicons name="search-outline" color={colors.textMuted} size={22} /><TextInput accessibilityLabel="Tìm kiếm cuộc trò chuyện" onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="Tìm kiếm cuộc trò chuyện..." placeholderTextColor={colors.textMuted} value={query} onChangeText={setQuery} style={styles.searchInput} />{!!query && <Pressable accessibilityLabel="Xóa tìm kiếm" onPress={() => setQuery('')}><Ionicons name="close-circle" color={colors.textMuted} size={19} /></Pressable>}</View>
    <View style={styles.filters}>{([['all', 'Tất cả'], ['unread', 'Chưa đọc'], ['group', 'Nhóm'], ['direct', 'Cá nhân']] as const).map(([key, label]) => <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: filter === key }} onPress={() => setFilter(key)} style={[styles.filter, filter === key && styles.selectedFilter]}><Text style={[styles.filterText, filter === key && { color: colors.white }]}>{label}</Text></Pressable>)}</View>
    {remote.error ? <RemoteState {...remote} loading={false} onRetry={remote.reload} /> : null}
    <ScrollView contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={remote.loading} onRefresh={remote.reload} />} keyboardShouldPersistTaps="handled">
      {!remote.loading && !remote.error && !rows.length && <View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="chatbubbles-outline" size={35} color={colors.primary} /></View><Text style={styles.emptyTitle}>{query ? 'Chưa tìm thấy cuộc trò chuyện' : filter === 'unread' ? 'Bạn đã đọc hết tin nhắn' : 'Bắt đầu một cuộc trò chuyện'}</Text><Text style={styles.emptyText}>{query ? 'Thử tìm bằng tên bạn bè, nhóm hoặc nội dung tin nhắn.' : 'Mở nhóm hoạt động để cùng lên kế hoạch, hoặc nhắn cho bạn bè.'}</Text><Pressable accessibilityRole="button" onPress={onFriends} style={styles.friendButton}><Text style={{ color: colors.primary, fontWeight: '700' }}>Tìm bạn bè</Text></Pressable></View>}
      {rows.map(conversation => {
        const preview = conversation.lastMessage;
        const sender = preview ? preview.senderId === getSession()?.user.id ? 'Bạn: ' : conversation.type === 'group' ? `${preview.senderName || 'Thành viên'}: ` : '' : '';
        return <Pressable accessibilityRole="button" key={conversation.id} onPress={() => onOpenChat(conversation)} style={styles.row}>
          <View>{conversation.avatarUrl ? <Image source={{ uri: imageUrl(conversation.avatarUrl) }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarFallback]}><Ionicons name={conversation.type === 'group' ? 'people' : 'person'} size={27} color={colors.primary} /></View>}{conversation.type === 'group' && <View style={styles.groupIcon}><Ionicons name="people" size={11} color={colors.white} /></View>}</View>
          <View style={styles.copy}><View style={styles.rowHeading}><Text numberOfLines={1} style={[styles.name, conversation.unreadCount > 0 && { fontWeight: '800' }]}>{conversation.type === 'group' ? conversation.activityTitle || conversation.name : conversation.name}</Text><Text style={styles.time}>{timeLabel(preview?.createdAt || conversation.createdAt)}</Text></View><View style={styles.previewRow}><Text numberOfLines={2} style={[styles.preview, conversation.unreadCount > 0 && { color: colors.textSecondary }]}>{sender}{preview?.text || (preview?.location ? 'Đã chia sẻ vị trí' : preview?.attachments?.length ? `Đã gửi ${preview.attachments.length} tệp` : '') || (conversation.type === 'group' ? 'Cùng lên kế hoạch cho hoạt động nhé!' : 'Gửi lời chào đầu tiên')}</Text>{conversation.unreadCount > 0 && <View style={styles.unread}><Text style={styles.unreadText}>{conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}</Text></View>}</View>
            {conversation.type === 'group' && <View style={[styles.statusPill, conversation.scheduleConfirmedAt && { backgroundColor: colors.successSoft }]}><Ionicons name={conversation.scheduleConfirmedAt ? 'calendar' : 'calendar-outline'} size={14} color={conversation.scheduleConfirmedAt ? colors.successText : colors.primary} /><Text style={{ fontSize: 11, fontWeight: '600', color: conversation.scheduleConfirmedAt ? colors.successText : colors.primary }}>{conversation.activityStatus === 'completed' ? 'Đã kết thúc' : conversation.activityStatus === 'in-progress' ? 'Đang diễn ra' : conversation.scheduleConfirmedAt ? 'Lịch đi đã chốt' : 'Đang lên kế hoạch'}</Text><Ionicons name="chevron-forward" size={12} color={colors.textMuted} /></View>}
          </View>
        </Pressable>;
      })}
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, maxWidth: layout.maxWidth, width: '100%', alignSelf: 'center', backgroundColor: colors.surface }, top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 18 }, title: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.6 }, subtitle: { color: colors.textMuted, fontSize: 11, marginTop: 6 }, newChat: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }, search: { borderWidth: 1, borderColor: 'transparent', marginHorizontal: 20, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: colors.surfaceMuted, borderRadius: 16 }, searchInput: { outlineWidth: 0, outlineStyle: 'solid', outlineColor: 'transparent', borderWidth: 0, flex: 1, minHeight: 49, fontSize: 14, color: colors.text }, filters: { flexDirection: 'row', paddingHorizontal: 20, gap: 7, paddingVertical: 18 }, filter: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.surfaceMuted }, selectedFilter: { backgroundColor: colors.primary }, filterText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' }, list: { paddingHorizontal: 20, paddingBottom: 30 }, row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 18, borderBottomWidth: 1, borderColor: colors.border }, avatar: { width: 60, height: 60, borderRadius: 30 }, avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }, groupIcon: { position: 'absolute', right: -1, bottom: 0, backgroundColor: colors.primary, padding: 4, borderRadius: 12, borderWidth: 2, borderColor: colors.surface }, copy: { flex: 1, gap: 7 }, rowHeading: { flexDirection: 'row', gap: 8, alignItems: 'center' }, name: { color: colors.text, fontSize: 16, fontWeight: '700', flex: 1 }, time: { color: colors.textMuted, fontSize: 11 }, previewRow: { flexDirection: 'row', gap: 8, alignItems: 'center' }, preview: { flex: 1, color: colors.textMuted, lineHeight: 20, fontSize: 13 }, unread: { minWidth: 24, height: 24, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.primary }, unreadText: { color: colors.white, fontSize: 11, fontWeight: '700' }, statusPill: { alignSelf: 'flex-start', flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: colors.primarySoft, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14 }, empty: { alignItems: 'center', paddingVertical: 45, paddingHorizontal: 20, gap: 14 }, emptyIcon: { padding: 24, borderRadius: 45, backgroundColor: colors.primarySoft }, emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', color: colors.text }, emptyText: { color: colors.textMuted, textAlign: 'center', lineHeight: 22, fontSize: 13 }, friendButton: { padding: 12 },
});
