import { View } from 'react-native';
import { Text } from './LocalizedText';
import { ActivityMatchCard } from './match/MatchPrimitives';
import { MatchBackground } from './match/MatchBackground';
import { ActivityDraft } from '../services/activityService';
import { ActivityDto, toActivity } from '../services/activityApi';
import { dateToIso } from './DateTimeField';

export function ActivityDraftPreview({ draft, initialActivity, host }: { draft: ActivityDraft; initialActivity?: ActivityDto; host: { id: string; name: string } }) {
  const toInstant = (date: string, time: string) => new Date(dateToIso(date) + 'T' + time + ':00+07:00').toISOString();
  const row: ActivityDto = {
    id: initialActivity?.id || 'draft-preview', hostId: host.id, hostName: host.name,
    title: draft.name, description: draft.description, category: draft.category,
    location: [draft.address, draft.ward, draft.district, draft.province].filter(Boolean).join(', '),
    startsAt: toInstant(draft.date, draft.startTime), endsAt: toInstant(draft.endDate || draft.date, draft.endTime),
    estimatedCost: draft.financialConfig.estimatedCostPerMember || 0, costNote: draft.costNote,
    maxParticipants: Number(draft.maxParticipants || 6), minParticipants: Number(draft.minParticipants || 2),
    memberCount: initialActivity ? initialActivity.memberCount + ((draft.reservedSeats ?? 0) - (initialActivity.reservedSeats ?? 0)) : 1 + (draft.reservedSeats ?? 0),
    participantPreferences: draft.participantPreferences, organizerType: draft.organizerType, requirements: draft.requirements.split('\n').map(item => item.trim()).filter(Boolean),
    itinerary: [...(draft.itinerary || [])].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
    planLink: draft.planLink,
    planFile: draft.planAttachment === null ? null : draft.planAttachment ? { id: 'draft', name: draft.planAttachment.name, size: 0, mimeType: '' } : draft.planFile,
    imageUrl: draft.photos[0]?.uri || (!draft.replacePhotos ? initialActivity?.imageUrl : undefined),
    imageUrls: draft.photos.length ? draft.photos.map(photo => photo.uri) : !draft.replacePhotos ? initialActivity?.imageUrls : [],
    reservedSeats: draft.reservedSeats,
    coordinates: draft.coordinates ? { type: 'Point', coordinates: [draft.coordinates.longitude, draft.coordinates.latitude] } : null,
  };
  return <View style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', padding: 12 }}><MatchBackground /><Text style={{ fontSize: 18, fontWeight: '700', padding: 10 }}>Bài đăng hiển thị trên Match</Text><ActivityMatchCard activity={toActivity(row)} canUndo={false} onMore={() => {}} onUndo={() => {}} preview /></View>;
}
