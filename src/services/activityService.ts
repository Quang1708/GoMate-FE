import { ImageSourcePropType } from 'react-native';
import { api } from './api';
import { safePlanLink } from './planService';
import type { ItineraryStep, PlanAttachment, PlanFile } from './planService';
import { ActivityDto } from './activityApi';
import type { ParticipantPreferences } from '../components/ActivityChoices';
import { activityCategories } from '../data/activityOptions';

export type FundingMode = 'FULL_PREPAYMENT' | 'DEPOSIT';
export type ApprovalRule = 'MAJORITY' | 'TWO_THIRDS' | 'ALL';

export type ActivityFinancialConfig = {
  fundingMode: FundingMode;
  estimatedCostPerMember?: number;
  estimatedCostMin?: number;
  estimatedCostMax?: number;
  depositAmount?: number;
  paymentDeadline: string;
  treasurerUserId: string;
  approvalThreshold: number;
  approvalRule: ApprovalRule;
};

export type ActivityDraft = {
  ward?: string; costNote?: string; reservedSeats?: number; companions?: { name: string; note: string }[]; hostAvatarUrl?: string | null; initialFriendIds?: string[]; itinerary?: ItineraryStep[]; planLink?: string; planAttachment?: PlanAttachment | null; planFile?: PlanFile | null;
  organizerType: 'personal' | 'business';
  coordinates?: import('./locationService').Coordinates | null;
  name: string;
  category: string;
  description: string;
  cover?: ImageSourcePropType | { uri: string };
  replacePhotos?: boolean;
  photos: { uri: string; base64?: string }[];
  date: string;
  endDate: string;
  startTime: string;
  endTime: string;
  registrationDeadline: string;
  deadlineHoursBefore?: number;
  deadlineCustom?: boolean;
  scheduleNote: string;
  province: string;
  district: string;
  address: string;
  meetingPoint: string;
  maxParticipants: string;
  minParticipants?: string;
  participantPreferences?: ParticipantPreferences;
  requirements: string;
  financialConfig: ActivityFinancialConfig;
};

export function vietnamDate(date: string, time = '23:59') {
  const match = date.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Vui lòng nhập ngày và giờ.');
  const iso = `${match[3]}-${match[2]}-${match[1]}T${time}:00+07:00`;
  const value = new Date(iso);
  if (!Number.isFinite(value.getTime()) || new Date(value.getTime() + 7 * 3600000).toISOString().slice(0, 10) !== iso.slice(0, 10)) throw new Error('Ngày không hợp lệ.');
  return value.toISOString();
}

export function deadline(value: string) {
  const parts = value.trim().split(/\s*[·]\s*|\s+/);
  return vietnamDate(parts[0], parts[1] || '23:59');
}

export function draftDeadline(draft: ActivityDraft) {
  if (draft.deadlineCustom && !draft.registrationDeadline.trim()) throw new Error('Chọn ngày và giờ cho hạn nhận yêu cầu.');
  if (draft.deadlineHoursBefore === undefined) return draft.registrationDeadline ? deadline(draft.registrationDeadline) : null;
  return new Date(new Date(vietnamDate(draft.date, draft.startTime)).getTime() - draft.deadlineHoursBefore * 3600000).toISOString();
}

export function validateActivityDraft(draft: ActivityDraft, step: number) {
  if (step === 1) {
    if (draft.name.trim().length < 3 || draft.name.trim().length > 120) throw new Error('Vui lòng nhập tên hoạt động hợp lệ.');
    if (!draft.description.trim()) throw new Error('Vui lòng nhập giới thiệu hoạt động.');
    if (draft.description.trim().length > 3000) throw new Error('Giới thiệu quá dài. Vui lòng viết ngắn gọn hơn.');
    if (!draft.category.trim()) throw new Error('Chọn danh mục cho hoạt động.');
  }
  if (step === 2 || step === 4) {
    const start = vietnamDate(draft.date, draft.startTime);
    const end = vietnamDate(draft.endDate || draft.date, draft.endTime);
    if (new Date(start).getTime() <= Date.now() || end <= start) throw new Error('Chọn thời gian trong tương lai; giờ kết thúc phải sau giờ bắt đầu.');
    if (step === 2 && !draft.address.trim()) throw new Error('Thêm địa chỉ hoặc tên địa điểm gặp mặt.');
    const date = draftDeadline(draft);
    if (date) {
      if (new Date(date).getTime() <= Date.now() || date > start) throw new Error('Hạn đăng ký cần trong tương lai và không muộn hơn giờ bắt đầu.');
    }
  }
  if (step === 3) {
    const min = Number(draft.minParticipants || 2), max = Number(draft.maxParticipants || 1000);
    if (max - (draft.reservedSeats ?? 0) < min) throw new Error('Cần chừa đủ chỗ cho số tài khoản tối thiểu; người đi cùng ngoài GoMate không tính vào điều kiện bắt đầu.');
    if (!Number.isInteger(draft.reservedSeats ?? 0) || (draft.reservedSeats ?? 0) < 0 || 1 + (draft.reservedSeats ?? 0) > max) throw new Error('Số người có sẵn, tính cả host, không được vượt sức chứa tối đa.');
    const preferences = draft.participantPreferences;
    if (preferences && [preferences.minAge, preferences.maxAge].some(age => age !== undefined && age !== 0 && (!Number.isInteger(age) || age < 12 || age > 120))) throw new Error('Độ tuổi tham gia cần từ 12 đến 120.');
    if (preferences?.minAge && preferences.maxAge && preferences.minAge > preferences.maxAge) throw new Error('Tuổi từ không được lớn hơn đến tuổi.');
    if (![min, max].every(value => Number.isInteger(value) && value >= 2 && value <= 1000) || min > max) throw new Error('Số thành viên cần từ 2 đến 1000; tối thiểu không được lớn hơn tối đa.');
  }
  if (step === 4) {
    const config = draft.financialConfig;
    const amounts = config.fundingMode === 'FULL_PREPAYMENT' ? [config.estimatedCostPerMember ?? 0] : [config.estimatedCostMin, config.estimatedCostMax, config.depositAmount];
    if ([...amounts, config.approvalThreshold].some(value => value === undefined || !Number.isInteger(value) || value < 0 || value > 1000000000)) throw new Error('Nhập các khoản tiền hợp lệ, từ 0 đến 1 tỷ đồng.');
    if (config.fundingMode === 'DEPOSIT' && ((config.estimatedCostMin ?? 0) > (config.estimatedCostMax ?? 0) || (config.depositAmount ?? 0) > (config.estimatedCostMax ?? 0))) throw new Error('Chi phí tối thiểu và tiền cọc không được lớn hơn chi phí tối đa.');

  }
}

export async function publishActivityDraft(draft: ActivityDraft, activityId?: string) {
  for (const step of [1, 2, 3, 4]) validateActivityDraft(draft, step);
  const startsAt = vietnamDate(draft.date, draft.startTime);
  const endsAt = vietnamDate(draft.endDate || draft.date, draft.endTime);
  if (new Date(startsAt).getTime() <= Date.now() || endsAt <= startsAt) throw new Error('Hoạt động cần bắt đầu trong tương lai và kết thúc sau giờ bắt đầu.');
  if (draft.photos.length > 6) throw new Error('Chọn tối đa 6 ảnh.');
  for (const photo of draft.photos) {
    if (!photo.base64) throw new Error('Vui lòng chọn lại ảnh.');
    const bytes = photo.base64.length * 3 / 4 - (photo.base64.endsWith('==') ? 2 : photo.base64.endsWith('=') ? 1 : 0);
    if (bytes > 10 * 1024 * 1024) throw new Error('Mỗi ảnh tối đa 10 MB.');
  }
  if (draft.planLink && !safePlanLink(draft.planLink)) throw new Error('Dùng link HTTPS hợp lệ cho kế hoạch.');
  for (const step of draft.itinerary ?? []) {
    const at = new Date(`${step.date}T${step.time}:00+07:00`).getTime();
    if (!step.title.trim() || !Number.isFinite(at) || at < new Date(startsAt).getTime() || at > new Date(endsAt).getTime()) throw new Error('Bổ sung nội dung và chọn thời gian mốc nằm trong hoạt động.');
  }
  const categories = activityCategories;
  const config = draft.financialConfig;
  const payload = {
    organizerType: 'personal',
    ...(draft.coordinates ? { coordinates: { type: 'Point', coordinates: [draft.coordinates.longitude, draft.coordinates.latitude] } } : activityId ? { coordinates: null } : {}),
    title: draft.name, description: draft.description, category: categories.includes(draft.category) ? draft.category : 'Khác',
    tags: categories.includes(draft.category) ? [] : [draft.category],
    address: draft.address, province: draft.province, district: draft.district, ward: draft.ward || '', costNote: draft.costNote || '', reservedSeats: draft.reservedSeats ?? 0, companions: Array.from({ length: draft.reservedSeats ?? 0 }, (_, index) => draft.companions?.[index] ?? { name: '', note: '' }),
    ...(!activityId && draft.initialFriendIds?.length ? { initialFriendIds: draft.initialFriendIds } : {}),
    ...(draft.itinerary?.length ? { itinerary: draft.itinerary } : draft.itinerary ? { itinerary: [] } : {}),
    planLink: draft.planLink || '',
    ...(draft.planAttachment !== undefined ? { planAttachment: draft.planAttachment } : {}),
    location: [draft.address, draft.ward, draft.district, draft.province].filter(Boolean).join(', '), startsAt, endsAt,
    estimatedCost: config.fundingMode === 'FULL_PREPAYMENT' ? config.estimatedCostPerMember ?? 0 : config.estimatedCostMax ?? 0,
    minParticipants: Number(draft.minParticipants || 2), maxParticipants: Number(draft.maxParticipants || 1000),
    ...(draft.participantPreferences ? { participantPreferences: draft.participantPreferences } : {}), requirements: draft.requirements.split('\n').map(item => item.trim()).filter(Boolean),
    plan: draft.scheduleNote.split('\n').map(item => item.trim()).filter(Boolean), meetingPoint: draft.meetingPoint,
    ...(draftDeadline(draft) ? { registrationDeadline: draftDeadline(draft) } : activityId ? { registrationDeadline: null } : {}),
    ...(draft.photos.length || draft.replacePhotos ? { photosBase64: draft.photos.map(photo => photo.base64) } : {}),
  };
  const result = await api<{ activity: ActivityDto }>(activityId ? `/activities/${encodeURIComponent(activityId)}` : '/activities', { method: activityId ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
  return result.activity;
}
