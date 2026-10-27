import { useFeedbackState } from '../services/feedback';
import { useCallback, useRef, useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { Text } from './LocalizedText';
import { SelectionField } from './SelectionField';
import { RemoteState } from './RemoteState';
import { Friend, listFriends } from '../services/friendService';
import { ActivityDto, addActivityFriends, getActivity, listMembers, listSentActivityInvitations, ActivityInvitation } from '../services/activityApi';
import { useRemote } from '../services/useRemote';
import { colors } from '../theme';
export function AddActivityFriends({ activityId, onAdded }: { activityId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false), [ids, setIds] = useState<string[]>([]), [useReserved, setUseReserved] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useFeedbackState('');
  const lock = useRef(false);
  const loader = useCallback(async () => { const [friends, members, activity, invitations] = await Promise.all([listFriends(), listMembers(activityId), getActivity(activityId), listSentActivityInvitations(activityId)]); return { friends: friends.filter(friend => !members.some(member => member.userId === friend.id)), activity, invitations }; }, [activityId]);
  const remote = useRemote<{ friends: Friend[]; activity: ActivityDto | null; invitations: ActivityInvitation[] }>(loader, { friends: [], activity: null, invitations: [] });
  const add = async () => {
    if (lock.current || !ids.length) return;
    lock.current = true; setBusy(true); setError('');
    try { await addActivityFriends(activityId, ids, useReserved); setIds([]); setOpen(false); await remote.reload(); onAdded(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không gửi được lời mời'); }
    finally { lock.current = false; setBusy(false); }
  };
  return <View style={{ gap: 12, paddingVertical: 12 }}><Pressable accessibilityRole="button" onPress={() => { setOpen(!open); if (!open) void remote.reload(); }}><Text style={{ color: colors.primary, fontWeight: '600' }}>Mời bạn bè vào nhóm</Text></Pressable>
    {open && (remote.loading || remote.error ? <RemoteState {...remote} onRetry={remote.reload} /> : <><Text>Ứng dụng gửi lời mời và thông báo. Bạn bè chỉ vào nhóm và chat sau khi đồng ý; lời mời chưa giữ chỗ.</Text><SelectionField label="Chọn bạn bè thêm vào nhóm" options={remote.data.friends.map(friend => ({ value: friend.id, label: friend.name + ' · ' + (friend.username || friend.id.slice(0, 6)) }))} selected={ids} onChange={setIds} multiple searchable emptyLabel={remote.data.friends.length ? 'Chọn bạn' : 'Không có bạn bè ngoài nhóm'} />
      {(remote.data.activity?.reservedSeats ?? 0) > 0 && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Text style={{ flex: 1 }}>Dùng chỗ đã giữ cho bạn đi cùng ({remote.data.activity?.reservedSeats})</Text><Switch accessibilityLabel="Dùng chỗ đã giữ" value={useReserved} onValueChange={setUseReserved} /></View>}
      {useReserved && ids.length > 0 && (remote.data.activity?.reservedSeats ?? 0) > 0 && <Text style={{ fontSize: 12, color: colors.textSecondary }}>Khi người nhận đồng ý, chuyển chỗ đã giữ của {Array.from({ length: Math.min(ids.length, remote.data.activity?.reservedSeats ?? 0) }, (_, index) => remote.data.activity?.companions?.[index]?.name || `người đồng hành ${index + 1}`).join(', ')} thành thành viên GoMate. Tắt tùy chọn trên để giữ riêng các chỗ này.</Text>}
      <Pressable accessibilityRole="button" disabled={busy || !ids.length} onPress={() => void add()}><Text style={{ color: colors.primary }}>{busy ? 'Đang thêm...' : 'Gửi lời mời hoạt động'}</Text></Pressable>
    </>)}
    {remote.data.invitations.map(invitation => <Text key={invitation.id}>{invitation.name} · {invitation.status === 'pending' ? 'Chờ đồng ý' : invitation.status === 'accepted' ? 'Đã đồng ý' : 'Đã từ chối'}</Text>)}
    {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
  </View>;
}
