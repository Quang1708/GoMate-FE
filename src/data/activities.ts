import { ImageSourcePropType } from 'react-native';

export type Activity = {
  business?: { name: string; verified: boolean; discountPercent: number; offer: string; terms: string };
  memberAvatars?: { userId: string; name: string; avatarUrl?: string | null }[];
  version?: number; reservedSeats?: number; companions?: { name: string; note: string }[]; hostAvatarUrl?: string | null; costNote?: string; itinerary?: import('../services/planService').ItineraryStep[]; planLink?: string; planFile?: import('../services/planService').PlanFile | null;
  organizerType?: 'personal' | 'business';
  coordinates?: import('../services/locationService').Coordinates | null;
  id: string;
  hostId?: string;
  minParticipants?: number;
  participantPreferences?: import('../components/ActivityChoices').ParticipantPreferences;
  meetingPoint?: string;
  startsAt?: string;
  endsAt?: string;
  requestStatus?: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'left' | 'removed';
  backendStatus?: 'published' | 'in-progress' | 'completed' | 'expired';
  title: string;
  host: string;
  location: string;
  time: string;
  members: string;
  distance: string;
  category: string;
  tags: string[];
  description: string;
  estimatedCost: string;
  requirements: string[];
  plan: string[];
  hostRating: number;
  hostCompletedActivities: number;
  status?: 'pending' | 'confirmed' | 'in-progress' | 'completed';
  image: ImageSourcePropType;
  images?: ImageSourcePropType[];
};

export const activities: Activity[] = [
  {
    id: 'weekend-coffee',
    title: 'Cà phê cuối tuần',
    host: 'Minh Anh',
    location: 'Quận 1, TP.HCM',
    time: 'Thứ Bảy • 09:00',
    members: '3/5',
    distance: '2.5 km',
    category: 'Ăn uống',
    tags: ['Coffee', 'Trò chuyện'],
    description: 'Khám phá một quán cà phê yên tĩnh và làm quen với những người bạn mới.',
    estimatedCost: '120.000đ/người',
    requirements: ['Đến đúng giờ', 'Tôn trọng không gian chung'],
    plan: ['09:00 Gặp tại quán', '09:15 Làm quen', '10:30 Chụp ảnh nhóm'],
    hostRating: 4.9,
    hostCompletedActivities: 18,
    status: 'confirmed',
    image: require('../assets/Activity-image/cafe.jpg'),
  },
  {
    id: 'badminton-social',
    title: 'Giao lưu cầu lông',
    host: 'Tuấn Kiệt',
    location: 'Phú Nhuận, TP.HCM',
    time: 'Thứ Tư • 19:00',
    members: '4/6',
    distance: '4.1 km',
    category: 'Thể thao',
    tags: ['Cầu lông', 'Năng động'],
    description: 'Một buổi đánh đôi nhẹ nhàng, phù hợp cả với người mới bắt đầu.',
    estimatedCost: '90.000đ/người',
    requirements: ['Mang giày thể thao', 'Có mặt trước 15 phút'],
    plan: ['18:45 Khởi động', '19:00 Chia cặp', '20:30 Tổng kết'],
    hostRating: 4.8,
    hostCompletedActivities: 24,
    status: 'pending',
    image: require('../assets/Activity-image/caulong.jpg'),
  },
  {
    id: 'dalat-clouds',
    title: 'Săn mây Đà Lạt',
    host: 'Linh Nguyễn',
    location: 'Đà Lạt, Lâm Đồng',
    time: 'Chủ Nhật • 04:30',
    members: '4/6',
    distance: '28 km',
    category: 'Du lịch',
    tags: ['Đà Lạt', 'Thiên nhiên'],
    description: 'Đón bình minh giữa biển mây và ghi lại một buổi sáng thật đáng nhớ.',
    estimatedCost: '650.000đ/người',
    requirements: ['Thể lực cơ bản', 'Mang áo ấm và giày bám tốt'],
    plan: ['04:30 Tập trung', '05:00 Di chuyển', '06:00 Ngắm bình minh'],
    hostRating: 4.9,
    hostCompletedActivities: 12,
    status: 'confirmed',
    image: require('../assets/Activity-image/dalat-travel.jpeg'),
  },
  {
    id: 'pickleball-session',
    title: 'Pickleball sau giờ làm',
    host: 'Hoàng Nam',
    location: 'Thủ Đức, TP.HCM',
    time: 'Thứ Sáu • 18:30',
    members: '6/8',
    distance: '7.8 km',
    category: 'Thể thao',
    tags: ['Pickleball', 'Giao lưu'],
    description: 'Chơi vài trận vui vẻ, vận động nhẹ và kết nối thêm đồng đội mới.',
    estimatedCost: '110.000đ/người',
    requirements: ['Trang phục thể thao', 'Người mới được chào đón'],
    plan: ['18:30 Check-in', '18:45 Làm nóng', '19:00 Bắt đầu trận'],
    hostRating: 4.7,
    hostCompletedActivities: 9,
    status: 'in-progress',
    image: require('../assets/Activity-image/pickerball.jpg'),
  },
];
