import { Companion, CompanionCards } from './CompanionCards';
import { View } from 'react-native';
import { Text } from './LocalizedText';
import { AdvancedPreferences, emptyPreferences } from './ActivityChoices';
import { NumberStepper } from './NumberStepper';
import { SelectionField } from './SelectionField';
import { listFriends } from '../services/friendService';
import { useRemote } from '../services/useRemote';
import { RemoteState } from './RemoteState';
import type { ActivityDraft } from '../services/activityService';
export function CreateGroupFields({ draft, onChange, editing = false, onCompanionChange, existingMembers = 1 }: { existingMembers?: number; onCompanionChange: (index: number, patch: Partial<Companion>) => void; draft: ActivityDraft; onChange: (patch: Partial<ActivityDraft>) => void; editing?: boolean }) {
  const friends = useRemote(listFriends, []);
  const occupied = existingMembers + (draft.reservedSeats ?? 0);
  const capacityFloor = Math.max(occupied, Number(draft.minParticipants || 2) + (draft.reservedSeats ?? 0));
  return <View style={{ gap: 16 }}><Text style={{ fontSize: 20, fontWeight: '700' }}>Thiết lập nhóm</Text><Text>Sức chứa tính cả host và người đi cùng. Chốt lịch cần đủ tài khoản xác nhận theo tối thiểu và ít nhất một người ngoài nhóm có sẵn.</Text>
    <NumberStepper label="Tối thiểu" value={Number(draft.minParticipants || 2)} min={2} onChange={value => onChange({ minParticipants: String(value), maxParticipants: String(Math.max(value + (draft.reservedSeats ?? 0), Number(draft.maxParticipants || 6))) })} />
    <NumberStepper label="Tối đa" value={Number(draft.maxParticipants || 6)} min={capacityFloor} onChange={value => onChange({ maxParticipants: String(Math.max(value, capacityFloor)), minParticipants: String(Math.min(Math.max(value, capacityFloor), Number(draft.minParticipants || 2))) })} />
    <NumberStepper label="Người đi cùng" hint="Người chưa tải App GoMate.

" value={draft.reservedSeats ?? 0} max={Math.max(0, Number(draft.maxParticipants || 6) - Math.max(existingMembers, Number(draft.minParticipants || 2)))} onChange={reservedSeats => onChange({ reservedSeats, companions: Array.from({ length: reservedSeats }, (_, index) => draft.companions?.[index] ?? { name: '', note: '' }) })} />
    <CompanionCards value={Array.from({ length: draft.reservedSeats ?? 0 }, (_, index) => draft.companions?.[index] ?? { name: '', note: '' })} editable onPersonChange={onCompanionChange} onChange={companions => onChange({ companions })} />
    {!editing && (friends.loading || friends.error ? <RemoteState {...friends} onRetry={friends.reload} /> : <SelectionField label="Mời bạn bè GoMate" options={friends.data.map(friend => ({ value: friend.id, label: friend.name + (friend.username ? ' · @' + friend.username : ' · ' + friend.id.slice(0, 6)) }))} selected={draft.initialFriendIds ?? []} onChange={initialFriendIds => onChange({ initialFriendIds })} multiple searchable emptyLabel={friends.data.length ? 'Chọn bạn để gửi lời mời' : 'Chưa có bạn bè · có thể thêm sau khi đăng'} />)}
    <Text>Đã có: host + {draft.reservedSeats ?? 0} bạn đi cùng{!editing ? ` · ${draft.initialFriendIds?.length ?? 0} lời mời GoMate (chưa tính thành viên)` : ''}.</Text>
    <AdvancedPreferences value={draft.participantPreferences || emptyPreferences} onChange={participantPreferences => onChange({ participantPreferences })} />
  </View>;
}
