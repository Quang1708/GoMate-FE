import { View } from 'react-native';
import { FormField } from './FormField';
import { Text } from './LocalizedText';
import { AdvancedPreferences, emptyPreferences } from './ActivityChoices';
import type { ActivityDraft } from '../services/activityService';

export function CreateGroupFields({ draft, onChange }: { draft: ActivityDraft; onChange: (patch: Partial<ActivityDraft>) => void }) {
  return <View style={{ gap: 16 }}>
    <Text style={{ fontSize: 20, fontWeight: '700' }}>Thiết lập nhóm</Text>
    <Text>Chọn số thành viên tối thiểu hoặc tối đa, tính cả host.</Text>
    <FormField label="Thành viên tối thiểu (mặc định 2)" keyboardType="number-pad" value={draft.minParticipants || ''} onChangeText={value => onChange({ minParticipants: value.replace(/\D/g, '') })} placeholder="2" />
    <FormField label="Thành viên tối đa (để trống: 1000)" keyboardType="number-pad" value={draft.maxParticipants} onChangeText={value => onChange({ maxParticipants: value.replace(/\D/g, '') })} placeholder="6" />
    <FormField label="Yêu cầu tham gia" multiline value={draft.requirements} onChangeText={requirements => onChange({ requirements })} placeholder="Vật dụng cần mang, kinh nghiệm... Mỗi yêu cầu một dòng." />
    <AdvancedPreferences value={draft.participantPreferences || emptyPreferences} onChange={participantPreferences => onChange({ participantPreferences })} />
  </View>;
}
