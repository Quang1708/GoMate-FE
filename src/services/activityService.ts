import { ImageSourcePropType } from 'react-native';
import { getSession, post } from './api';
import { ActivityDto } from './activityApi';
import type { ParticipantPreferences } from '../components/ActivityChoices';

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
  name: string;
  category: string;
  description: string;
  cover?: ImageSourcePropType | { uri: string };
  photos: { uri: string; base64?: string }[];
  date: string;
  endDate: string;
  startTime: string;
  endTime: string;
  registrationDeadline: string;
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
  if (!match || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Nhập ngày DD/MM/YYYY và giờ HH:mm.');
  const iso = `${match[3]}-${match[2]}-${match[1]}T${time}:00+07:00`;
  const value = new Date(iso);
  if (!Number.isFinite(value.getTime()) || new Date(value.getTime() + 7 * 3600000).toISOString().slice(0, 10) !== iso.slice(0, 10)) throw new Error('Ngày không hợp lệ.');
  return value.toISOString();
}

export function deadline(value: string) {
  const parts = value.trim().split(/\s*[·]\s*|\s+/);
  return vietnamDate(parts[0], parts[1] || '23:59');
}

export function validateActivityDraft(draft: ActivityDraft, step: number) {
  if (step === 1) {
    if (draft.name.trim().length < 3 || draft.name.trim().length > 120) throw new Error('Tên hoạt động cần từ 3 đến 120 ký tự.');
    if (!draft.description.trim() || draft.description.trim().length > 3000) throw new Error('Thêm mô tả hoạt động (tối đa 3000 ký tự).');
    if (!draft.category.trim()) throw new Error('Chọn danh mục cho hoạt động.');
  }
  if (step === 2 || step === 4) {
    const start = vietnamDate(draft.date, draft.startTime);
    const end = vietnamDate(draft.endDate || draft.date, draft.endTime);
    if (new Date(start).getTime() <= Date.now() || end <= start) throw new Error('Chọn thời gian trong tương lai; giờ kết thúc phải sau giờ bắt đầu.');
    if (step === 2 && !draft.address.trim()) throw new Error('Thêm địa chỉ hoặc tên địa điểm gặp mặt.');
    for (const value of [draft.registrationDeadline, ...(step === 4 ? [draft.financialConfig.paymentDeadline] : [])]) if (value) {
      const date = deadline(value);
      if (new Date(date).getTime() <= Date.now() || date > start) throw new Error('Hạn đăng ký/đóng tiền cần trong tương lai và không muộn hơn giờ bắt đầu.');
    }
  }
  if (step === 3) {
    const min = Number(draft.minParticipants || 2), max = Number(draft.maxParticipants || 1000);
    if (![min, max].every(value => Number.isInteger(value) && value >= 2 && value <= 1000) || min > max) throw new Error('Số thành viên cần từ 2 đến 1000; tối thiểu không được lớn hơn tối đa.');
  }
  if (step === 4) {
    const config = draft.financialConfig;
    const amounts = config.fundingMode === 'FULL_PREPAYMENT' ? [config.estimatedCostPerMember ?? 0] : [config.estimatedCostMin, config.estimatedCostMax, config.depositAmount];
    if ([...amounts, config.approvalThreshold].some(value => value === undefined || !Number.isInteger(value) || value < 0 || value > 1000000000)) throw new Error('Nhập các khoản tiền hợp lệ, từ 0 đến 1 tỷ đồng.');
    if (config.fundingMode === 'DEPOSIT' && ((config.estimatedCostMin ?? 0) > (config.estimatedCostMax ?? 0) || (config.depositAmount ?? 0) > (config.estimatedCostMax ?? 0))) throw new Error('Chi phí tối thiểu và tiền cọc không được lớn hơn chi phí tối đa.');
    if (amounts.some(value => Number(value) > 0) && !config.paymentDeadline) throw new Error('Chọn hạn đóng tiền hoặc tiền cọc.');
  }
}

export async function publishActivityDraft(draft: ActivityDraft) {
  for (const step of [1, 2, 3, 4]) validateActivityDraft(draft, step);
  const startsAt = vietnamDate(draft.date, draft.startTime);
  const endsAt = vietnamDate(draft.endDate || draft.date, draft.endTime);
  if (new Date(startsAt).getTime() <= Date.now() || endsAt <= startsAt) throw new Error('Hoạt động cần bắt đầu trong tương lai và kết thúc sau giờ bắt đầu.');
  if (draft.photos.length > 1) throw new Error('Hiện chỉ hỗ trợ một ảnh bìa.');
  const coverBase64 = draft.photos[0]?.base64;
  if (draft.photos.length && !coverBase64) throw new Error('Vui lòng chọn lại ảnh bìa.');
  if (coverBase64 && coverBase64.length > 2796204) throw new Error('Ảnh bìa phải nhỏ hơn 2 MB.');
  const categories = ['Ăn uống', 'Thể thao', 'Du lịch', 'Giải trí', 'Học tập', 'Gaming', 'Âm nhạc', 'Nghệ thuật', 'Thiên nhiên', 'Tình nguyện', 'Công nghệ', 'Networking', 'Khác'];
  const config = draft.financialConfig;
  const result = await post<{ activity: ActivityDto }>('/activities', {
    title: draft.name, description: draft.description, category: categories.includes(draft.category) ? draft.category : 'Khác',
    tags: categories.includes(draft.category) ? [] : [draft.category],
    location: [draft.address, draft.district, draft.province].filter(Boolean).join(', '), startsAt, endsAt,
    estimatedCost: config.fundingMode === 'FULL_PREPAYMENT' ? config.estimatedCostPerMember ?? 0 : config.estimatedCostMax ?? 0,
    minParticipants: Number(draft.minParticipants || 2), maxParticipants: Number(draft.maxParticipants || 1000),
    ...(draft.participantPreferences ? { participantPreferences: draft.participantPreferences } : {}), requirements: draft.requirements.split('\n').map(item => item.trim()).filter(Boolean),
    plan: draft.scheduleNote.split('\n').map(item => item.trim()).filter(Boolean), meetingPoint: draft.meetingPoint,
    ...(draft.registrationDeadline ? { registrationDeadline: deadline(draft.registrationDeadline) } : {}),
    financialConfig: { ...config, estimatedCostPerMember: config.fundingMode === 'FULL_PREPAYMENT' ? config.estimatedCostPerMember ?? 0 : undefined,
      treasurerUserId: getSession()?.user.id, paymentDeadline: config.paymentDeadline ? deadline(config.paymentDeadline) : startsAt },
    ...(coverBase64 ? { coverBase64 } : {}),
  });
  return result.activity;
}
