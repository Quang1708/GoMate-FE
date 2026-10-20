export type PersonProfile = {
  id: string;
  name: string;
  initial: string;
  age: number;
  location: string;
  bio: string;
  interests: string[];
  activitiesJoined: number;
  rating: number;
  attendanceRate: number;
  verified?: boolean;
  role?: 'host' | 'member';
};
export const currentUserProfile: PersonProfile = {
  id: 'current-user',
  name: 'Minh',
  initial: 'M',
  age: 22,
  location: 'TP.HCM',
  bio: 'Thích khám phá những quán cà phê mới, chơi thể thao và đi du lịch. Luôn sẵn sàng kết nối với những người bạn mới có cùng sở thích!',
  interests: ['Cà phê', 'Du lịch', 'Thể thao', 'Ẩm thực', 'Gaming', 'Chụp ảnh'],
  activitiesJoined: 12,
  rating: 4.8,
  attendanceRate: 96,
  verified: true,
  role: 'member',
};

export const communityMembers: PersonProfile[] = [
  {
    id: 'mai-anh',
    name: 'Mai Anh',
    initial: 'M',
    age: 24,
    location: 'Quận 3, TP.HCM',
    bio: 'Thích du lịch, nhiếp ảnh và những buổi cà phê cuối tuần.',
    interests: ['Du lịch', 'Nhiếp ảnh', 'Coffee'],
    activitiesJoined: 9,
    rating: 4.9,
    attendanceRate: 98,
    verified: true,
    role: 'member',
  },
  {
    id: 'tuan-minh',
    name: 'Tuấn Minh',
    initial: 'T',
    age: 27,
    location: 'Phú Nhuận, TP.HCM',
    bio: 'Runner, coffee lover và luôn sẵn sàng thử một môn thể thao mới.',
    interests: ['Running', 'Coffee', 'Thể thao'],
    activitiesJoined: 15,
    rating: 4.8,
    attendanceRate: 96,
    verified: true,
    role: 'member',
  },
  {
    id: 'an-nhien',
    name: 'An Nhiên',
    initial: 'A',
    age: 23,
    location: 'Bình Thạnh, TP.HCM',
    bio: 'Tìm những người bạn tích cực để cùng khám phá thành phố.',
    interests: ['Ẩm thực', 'Board game', 'Concert'],
    activitiesJoined: 12,
    rating: 4.7,
    attendanceRate: 92,
    role: 'member',
  },
];

export function createHostProfile(name: string): PersonProfile {
  return {
    id: `host-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    initial: name.charAt(0),
    age: 26,
    location: 'TP. Hồ Chí Minh',
    bio: 'Host yêu thích việc tạo ra những hoạt động an toàn và kết nối mọi người.',
    interests: ['Kết nối', 'Du lịch', 'Thể thao'],
    activitiesJoined: 18,
    rating: 4.9,
    attendanceRate: 99,
    verified: true,
    role: 'host',
  };
}
