import * as Location from 'expo-location';
export type Coordinates = { latitude: number; longitude: number };
export function validCoordinates(value: unknown): value is Coordinates {
  const point = value as Coordinates | undefined;
  return Boolean(point && Number.isFinite(point.latitude) && Number.isFinite(point.longitude) && Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180);
}
export async function currentCoordinates(): Promise<Coordinates> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) throw new Error('Chưa được cấp quyền vị trí. Bạn có thể chọn điểm trên bản đồ hoặc bật quyền trong cài đặt.');
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('Chưa lấy được GPS. Thử lại ngoài trời hoặc chọn trên bản đồ.')), 20000); }),
    ]);
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } finally { clearTimeout(timeout); }
}
