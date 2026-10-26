import { ChatAttachmentPanel, ChatMessageContent, SharedChatLibrary } from '../components/ChatContent';
import { useFeedbackState } from '../services/feedback';
import { ChatAttachment, ChatLocation } from '../services/chatContent';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlockUserButton } from '../components/BlockUserButton';
import { ChatHeaderActions } from '../components/ChatHeaderActions';
import { Text } from '../components/LocalizedText';
import { imageUrl } from '../services/profileService';
import { ChatMessage, chatHistory, Conversation, getConversation, markChatRead, sendChatMessage } from '../services/chatService';
import { watchConversation } from '../services/chatEvents';
import { ApiError, getSession } from '../services/api';
import { colors, layout } from '../theme';

export function ChatScreen({ conversation, onBack, error, embedded = false, refreshKey = 0 }: { refreshKey?: number; embedded?: boolean; error?: string; conversation: Conversation; onBack: () => void }) {
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]), [location, setLocation] = useState<ChatLocation | null>(null), [library, setLibrary] = useState(false), [preparing, setPreparing] = useState(false);
  const [attachmentPanel, setAttachmentPanel] = useState(false), [keyboardHeight, setKeyboardHeight] = useState(260), [inputHeight, setInputHeight] = useState(44);
  const inputRef = useRef<TextInput>(null);
  useEffect(() => { const subscription = Keyboard.addListener('keyboardDidShow', event => setKeyboardHeight(Math.max(210, Math.min(event.endCoordinates.height, 320)))); return () => subscription.remove(); }, []);
  const [blocked, setBlocked] = useState(false), [retry, setRetry] = useState(0);
  const [message, setMessage] = useState(''), [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true), [loadError, setLoadError] = useState(''), [sendError, setSendError] = useFeedbackState(''), [sending, setSending] = useState(false);
  const [meta, setMeta] = useState(conversation), [cursor, setCursor] = useState<string | null>(null), [olderLoading, setOlderLoading] = useState(false);
  const lock = useRef(false), attempt = useRef<{ text: string; id: string } | null>(null), scroll = useRef<ScrollView>(null), follow = useRef(true);
  const merge = useCallback((rows: ChatMessage[]) => setMessages(current => [...new Map([...current, ...rows].map(item => [item.id, item])).values()].sort((a, b) => a.id.localeCompare(b.id))), []);
  useEffect(() => {
    let alive = true, polling = false, first = true, lastRead = '', connected = false, lastPoll = 0, queued = false;
    const poll = async () => {
      if (polling) { queued = true; return; }
      polling = true; lastPoll = Date.now();
      try {
        const [page, fresh] = await Promise.all([chatHistory(conversation.id), getConversation(conversation.id)]);
        if (!alive) return;
        merge(page.items); setMeta(fresh); setLoadError(''); setBlocked(false);
        if (first) { setCursor(page.nextCursor); first = false; }
        const newest = page.items[0]?.id;
        if (newest && newest !== lastRead) { await markChatRead(conversation.id, newest); lastRead = newest; }
      } catch (reason) { if (alive) { setLoadError(reason instanceof Error ? reason.message : 'Không tải được tin nhắn'); setBlocked(reason instanceof ApiError && [401, 403, 404].includes(reason.status)); } }
      finally { polling = false; if (alive) { setLoading(false); if (queued) { queued = false; void poll(); } } }
    };
    void poll();
    const stop = watchConversation(conversation.id, () => { if (alive) void poll(); }, value => { connected = value; });
    const timer = setInterval(() => { if (Date.now() - lastPoll >= (connected ? 15000 : 3000)) void poll(); }, 3000);
    return () => { alive = false; clearInterval(timer); stop(); };
  }, [conversation.id, merge, retry, refreshKey]);
  const send = async () => {
    const clean = message.trim(), signature = JSON.stringify({ clean, ids: attachments.map(file => file.id), location });
    if ((!clean && !attachments.length && !location) || lock.current || blocked || loading || preparing) return;
    if (clean.length > 4000) { setSendError('Tin nhắn tối đa 4000 ký tự.'); return; }
    lock.current = true; setSending(true); setSendError('');
    if (attempt.current?.text !== signature) attempt.current = { text: signature, id: 'message-' + Date.now() + '-' + Math.random().toString(36).slice(2) };
    try { const sent = await sendChatMessage(conversation.id, clean, attempt.current.id, { attachmentIds: attachments.map(file => file.id), location }); merge([sent]); follow.current = true; setMessage(current => current.trim() === clean ? '' : current); attempt.current = null; setAttachments([]); setLocation(null); }
    catch (reason) { setSendError(reason instanceof Error ? reason.message : 'Chưa gửi được. Nhấn gửi để thử lại.'); }
    finally { lock.current = false; setSending(false); }
  };
  const older = async () => {
    if (!cursor || olderLoading) return;
    setOlderLoading(true); follow.current = false;
    try { const page = await chatHistory(conversation.id, cursor); merge(page.items); setCursor(page.nextCursor); }
    catch (reason) { setLoadError(reason instanceof Error ? reason.message : 'Không tải được tin cũ'); }
    finally { setOlderLoading(false); }
  };
  const dayLabel = (value: string) => {
    const date = new Date(value), now = new Date(), yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === now.toDateString() ? 'Hôm nay' : date.toDateString() === yesterday.toDateString() ? 'Hôm qua' : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  return <SafeAreaView style={styles.safe} edges={embedded ? [] : ['top', 'bottom', 'left', 'right']}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
    {!embedded && <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={onBack} hitSlop={12}><Ionicons name="chevron-back" color={colors.text} size={27} /></Pressable>{meta.avatarUrl ? <Image source={{ uri: imageUrl(meta.avatarUrl) }} style={styles.avatar} /> : <View style={[styles.avatar, styles.fallback]}><Text style={{ color: colors.primary, fontWeight: '800' }}>{meta.name.slice(0, 1).toUpperCase()}</Text></View>}<View style={{ flex: 1, gap: 4 }}><Text numberOfLines={1} style={styles.headerName}>{meta.name}</Text><Text style={styles.caption}>Trò chuyện riêng</Text></View><ChatHeaderActions sharePath={`/app/messages/chat/${conversation.id}`} onShared={() => setLibrary(true)} onRefresh={() => setRetry(value => value + 1)} /></View>}{!embedded && meta.type === 'direct' && meta.participantIds?.find(id => id !== getSession()?.user.id) && <View style={{ paddingHorizontal: 18, backgroundColor: colors.surface }}><BlockUserButton userId={meta.participantIds.find(id => id !== getSession()?.user.id)!} onBlocked={onBack} /></View>}
    {loadError || error ? <View style={styles.errorBar}><Ionicons name="cloud-offline-outline" size={18} color={colors.danger} /><Text accessibilityRole="alert" style={{ color: colors.danger, flex: 1, fontSize: 12 }}>{loadError || error}</Text><Pressable accessibilityRole="button" onPress={() => setRetry(value => value + 1)}><Text style={styles.link}>Thử lại</Text></Pressable></View> : null}
    <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={[styles.messages, !messages.length && { justifyContent: 'center' }]} onContentSizeChange={() => { if (follow.current) scroll.current?.scrollToEnd({ animated: true }); }} onScroll={event => { const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent; follow.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 100; }} scrollEventThrottle={100} keyboardShouldPersistTaps="handled">
      {cursor && <Pressable accessibilityRole="button" disabled={olderLoading} onPress={() => void older()} style={styles.older}><Text style={styles.link}>{olderLoading ? 'Đang tải...' : 'Xem tin nhắn cũ hơn'}</Text></Pressable>}
      {loading && !messages.length ? <ActivityIndicator color={colors.primary} /> : !messages.length && !loadError ? <View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="chatbubbles-outline" size={32} color={colors.primary} /></View><Text style={styles.emptyTitle}>{meta.type === 'group' ? 'Hẹn nhau từ lời chào đầu tiên' : 'Một lời chào, thêm một kết nối'}</Text><Text style={styles.emptyNote}>{meta.type === 'group' ? 'Chat đã sẵn sàng. Cùng làm quen và lên kế hoạch trước ngày gặp nhé.' : 'Gửi tin nhắn để bắt đầu trò chuyện với người bạn này.'}</Text></View> : null}
      {messages.map((item, index) => {
        const mine = item.senderId === getSession()?.user.id;
        const previous = messages[index - 1], newDay = !previous || dayLabel(previous.createdAt) !== dayLabel(item.createdAt);
        const newSender = newDay || previous?.senderId !== item.senderId;
        return <Fragment key={item.id}>{newDay && <View style={styles.day}><Text style={styles.dayText}>{dayLabel(item.createdAt)}</Text></View>}<View style={[styles.messageRow, mine && { justifyContent: 'flex-end' }]}>{!mine && meta.type === 'group' && <View style={[styles.senderAvatar, !newSender && { opacity: 0 }]}><Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>{(item.senderName || 'T').slice(0, 1).toUpperCase()}</Text></View>}<View style={[styles.bubble, mine ? styles.mine : styles.theirs, !newSender && { marginTop: -5 }]}>{!mine && meta.type === 'group' && newSender && <Text style={styles.senderName}>{item.senderName || 'Thành viên'}</Text>}<ChatMessageContent item={item} mine={mine} />{item.text ? <Text selectable style={[styles.messageText, mine && { color: colors.white }]}>{item.text}</Text> : null}<View style={styles.messageMeta}><Text style={[styles.messageTime, mine && { color: colors.whiteMuted }]}>{new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Text>{mine && <Ionicons name="checkmark" size={12} color={colors.whiteMuted} />}</View></View></View></Fragment>;
      })}
    </ScrollView>
    {sendError ? <Text accessibilityRole="alert" style={styles.sendError}>{sendError}</Text> : null}
    {attachments.length || location ? <View style={{ padding: 12, backgroundColor: colors.surface, gap: 8 }}><ScrollView horizontal contentContainerStyle={{ gap: 8 }}>{attachments.map(file => <View key={file.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 10, backgroundColor: colors.primarySoft }}><Ionicons name={file.kind === 'image' ? 'image-outline' : 'document-attach-outline'} color={colors.primary} size={18} /><Text numberOfLines={1} style={{ maxWidth: 145, fontSize: 12 }}>{file.name}</Text><Pressable accessibilityLabel={`Bỏ tệp ${file.name}`} disabled={sending || preparing} onPress={() => setAttachments(rows => rows.filter(row => row.id !== file.id))}><Ionicons name="close-circle" color={colors.primary} size={20} /></Pressable></View>)}</ScrollView>{location && <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><Ionicons name="location" color={colors.primary} size={20} /><Text style={{ flex: 1, fontSize: 12 }}>Vị trí hiện tại · {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</Text><Pressable accessibilityLabel="Bỏ vị trí" disabled={sending || preparing} onPress={() => setLocation(null)}><Ionicons name="close-circle" size={20} color={colors.primary} /></Pressable></View>}</View> : null}
    <View style={styles.composerWrap}><View style={styles.composer}><View style={styles.inputWrap}><TextInput ref={inputRef} accessibilityLabel="Tin nhắn" multiline numberOfLines={1} maxLength={4000} editable={!blocked} value={message} onChangeText={setMessage} onFocus={() => setAttachmentPanel(false)} onContentSizeChange={event => setInputHeight(Math.max(44, Math.min(110, event.nativeEvent.contentSize.height)))} placeholder={blocked ? 'Bạn không còn quyền gửi tin trong nhóm này' : 'Nhắn gì đó...'} placeholderTextColor={colors.textMuted} style={[styles.input, { height: message ? inputHeight : 44 }]} /></View><Pressable accessibilityRole="button" accessibilityLabel={attachmentPanel ? 'Đóng đính kèm' : 'Thêm ảnh, tệp hoặc vị trí'} accessibilityState={{ expanded: attachmentPanel }} disabled={sending || blocked || loading || preparing} onPress={() => { if (attachmentPanel) { setAttachmentPanel(false); inputRef.current?.focus(); } else { inputRef.current?.blur(); Keyboard.dismiss(); setAttachmentPanel(true); } }} style={{ width: 36, height: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={attachmentPanel ? 'close' : 'add'} size={27} color={colors.primary} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Gửi tin nhắn" disabled={sending || loading || blocked || preparing || (!message.trim() && !attachments.length && !location)} onPress={() => void send()} style={[styles.send, (sending || loading || blocked || preparing || (!message.trim() && !attachments.length && !location)) && { opacity: 0.45 }]}>{sending ? <ActivityIndicator color={colors.white} size="small" /> : <Ionicons name="arrow-up" color={colors.white} size={25} />}</Pressable></View><ChatAttachmentPanel open={attachmentPanel} height={keyboardHeight} onClose={() => setAttachmentPanel(false)} conversationId={conversation.id} disabled={sending || blocked || loading} remaining={4 - attachments.length} onFile={file => setAttachments(rows => [...rows, file])} onLocation={setLocation} onBusyChange={setPreparing} /></View>

    {library && <SharedChatLibrary conversationId={conversation.id} onClose={() => setLibrary(false)} />}
  </KeyboardAvoidingView></SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F3FC' }, header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border }, avatar: { width: 42, height: 42, borderRadius: 21 }, fallback: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, headerName: { fontSize: 17, fontWeight: '800', color: colors.text }, caption: { fontSize: 12, color: colors.textMuted }, link: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  messages: { flexGrow: 1, padding: 16, paddingBottom: 24, gap: 12, maxWidth: layout.maxWidth, width: '100%', alignSelf: 'center' }, messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 }, bubble: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '82%', minWidth: 74 }, mine: { backgroundColor: colors.primary, borderBottomRightRadius: 6 }, theirs: { backgroundColor: colors.surface, borderBottomLeftRadius: 6, borderWidth: 1, borderColor: '#EDEAF5' }, messageText: { color: colors.text, fontSize: 15, lineHeight: 23 }, messageMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 5 }, messageTime: { fontSize: 10, color: colors.textMuted }, senderAvatar: { width: 29, height: 29, borderRadius: 15, backgroundColor: '#E7E0FA', alignItems: 'center', justifyContent: 'center' }, senderName: { color: colors.primary, fontSize: 12, fontWeight: '700', marginBottom: 4 }, day: { alignSelf: 'center', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#EAE5F4', marginVertical: 8 }, dayText: { fontSize: 11, color: '#81758D', fontWeight: '600' }, older: { alignItems: 'center', padding: 12 },
  empty: { alignItems: 'center', padding: 28, gap: 14 }, emptyIcon: { padding: 22, borderRadius: 40, backgroundColor: '#EAE4FC' }, emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' }, emptyNote: { color: colors.textMuted, fontSize: 13, lineHeight: 21, textAlign: 'center' }, errorBar: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 9, backgroundColor: colors.matchSoft }, sendError: { color: colors.danger, paddingHorizontal: 18, paddingVertical: 8, fontSize: 12 }, composerWrap: { backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border }, composer: { flexDirection: 'row', gap: 9, padding: 12, maxWidth: layout.maxWidth, width: '100%', alignSelf: 'center', alignItems: 'flex-end' }, inputWrap: { flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: 23, paddingHorizontal: 15 }, input: { outlineWidth: 0, outlineStyle: 'solid', outlineColor: 'transparent', borderWidth: 0, minHeight: 44, maxHeight: 110, paddingVertical: 11, lineHeight: 22, textAlignVertical: 'center', fontSize: 14, color: colors.text }, send: { backgroundColor: colors.primary, width: 45, height: 45, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginBottom: 1 },
});
