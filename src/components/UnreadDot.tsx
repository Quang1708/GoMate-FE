import { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import { api } from '../services/api';
import { listConversations } from '../services/chatService';
import { useRemote } from '../services/useRemote';
import { colors } from '../theme';
const noticeCount = async () => (await api<{ unreadCount: number }>('/community/notifications?limit=1')).unreadCount;
const messageCount = async () => (await listConversations()).reduce((count, row) => count + row.unreadCount, 0);
export function UnreadDot({ kind, style }: { kind: 'messages' | 'notifications'; style?: ViewStyle }) {
  const remote = useRemote(kind === 'messages' ? messageCount : noticeCount, 0), reload = remote.reload;
  useEffect(() => { const timer = setInterval(() => void reload(), 10000); return () => clearInterval(timer); }, [reload]);
  if (!remote.data || remote.error) return null;
  return <View accessibilityLabel={`${remote.data} ${kind === 'messages' ? 'tin nhắn' : 'thông báo'} chưa đọc`} style={[{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.match }, style]} />;
}
