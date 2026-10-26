import { useFeedbackState } from '../services/feedback';
import { useCallback, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './LocalizedText';
import { decideFriend, getFriendship, requestFriend } from '../services/friendService';
import { getSession } from '../services/api';
import { useRemote } from '../services/useRemote';
import { colors } from '../theme';
export function FriendRequestButton({ userId }: { userId: string }) {
  const loader = useCallback(() => getFriendship(userId), [userId]);
  const remote = useRemote(loader, { status: 'none' });
  const [error, setError] = useFeedbackState(''), [busy, setBusy] = useState(false);
  const lock = useRef(false);
  if (userId === getSession()?.user.id) return null;
  const relation = remote.data;
  const run = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { if (relation.status === 'pending' && relation.incoming) await decideFriend(relation.id!, 'accepted'); else await requestFriend(userId); await remote.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không gửi được lời mời'); }
    finally { lock.current = false; setBusy(false); }
  };
  return <View style={{ gap: 8 }}>
    <Pressable accessibilityRole="button" disabled={busy || remote.loading || relation.status === 'accepted' || (relation.status === 'pending' && !relation.incoming)} onPress={() => void run()}><Text style={{ color: colors.primary, fontWeight: '600' }}>{busy ? 'Đang xử lý...' : relation.status === 'accepted' ? 'Đã là bạn bè' : relation.status === 'pending' ? relation.incoming ? 'Chấp nhận kết bạn' : 'Đã gửi lời mời kết bạn' : 'Gửi lời mời kết bạn'}</Text></Pressable>
    {error || remote.error ? <Text style={{ color: colors.danger }}>{error || remote.error}</Text> : null}
  </View>;
}
