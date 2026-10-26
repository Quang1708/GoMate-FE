import { useFeedbackState } from '../services/feedback';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityMap } from './ActivityMap';
import { Text } from './LocalizedText';
import { MapAttribution } from './MapAttribution';
import { Coordinates, currentCoordinates } from '../services/locationService';
import { directionsUrl, findRoute, getMapsConfig, MapRoute, MapsConfig } from '../services/mapsService';
import { useRemote } from '../services/useRemote';
import { colors } from '../theme';

export function RouteMap({ point }: { point: Coordinates }) { return <RouteMapContent key={`${point.latitude},${point.longitude}`} point={point} />; }
function RouteMapContent({ point }: { point: Coordinates }) {
  const config = useRemote<MapsConfig | null>(getMapsConfig, null);
  const [mode, setMode] = useState<'DRIVE' | 'WALK'>('DRIVE'), [busy, setBusy] = useState(false), [error, setError] = useFeedbackState(''), [route, setRoute] = useState<MapRoute | null>(null), [origin, setOrigin] = useState<Coordinates | null>(null);
  const lock = useRef(false), alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const calculate = async () => {
    if (lock.current) return; lock.current = true; setBusy(true); setError(''); setRoute(null); setOrigin(null);
    try { const location = await currentCoordinates(); if (!alive.current) return; const result = await findRoute(location, point, mode); if (alive.current) { setOrigin(location); setRoute(result); } }
    catch (reason) { if (alive.current) setError(reason instanceof Error ? reason.message : 'Chưa tính được tuyến đường.'); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  };
  const openDirections = async () => { try { await Linking.openURL(directionsUrl(point, origin ?? undefined, mode)); } catch { setError('Chưa mở được ứng dụng bản đồ.'); } };
  const minutes = route ? Math.ceil(route.durationSeconds / 60) : 0;
  return <View style={{ gap: 12 }}><ActivityMap point={point} route={route && origin ? { encodedPolyline: route.encodedPolyline, origin } : null} />
    {config.data?.routesEnabled && <><View style={{ flexDirection: 'row', gap: 10 }}>{([['DRIVE', 'Ô tô'], ['WALK', 'Đi bộ']] as const).map(([key, label]) => <Pressable key={key} accessibilityRole="button" accessibilityLabel={`Chỉ đường: ${label}`} accessibilityState={{ selected: mode === key }} disabled={busy} onPress={() => { setMode(key); setRoute(null); setOrigin(null); setError(''); }} style={{ paddingVertical: 10, paddingHorizontal: 18, borderRadius: 16, backgroundColor: mode === key ? colors.primarySoft : colors.surfaceMuted }}><Text style={{ color: mode === key ? colors.primary : colors.textSecondary }}>{label}</Text></Pressable>)}</View><Pressable accessibilityRole="button" disabled={busy} onPress={() => void calculate()} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 8 }}>{busy ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="navigate-outline" color={colors.primary} size={20} />}<Text style={{ color: colors.primary, flex: 1 }}>{busy ? 'Đang tìm đường...' : 'Tính đường từ vị trí của tôi'}</Text></Pressable>{route && <View style={{ padding: 14, borderRadius: 16, backgroundColor: colors.surfaceMuted }}><Text style={{ fontWeight: '700', fontSize: 16 }}>{(route.distanceMeters / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} km · {minutes >= 60 ? `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút` : `${minutes} phút`}</Text><Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>Thời gian ước tính theo tuyến đường; có thể thay đổi khi di chuyển.</Text><MapAttribution /></View>}</>}
    <Pressable accessibilityRole="button" onPress={() => void openDirections()} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 8 }}><Ionicons name="open-outline" color={colors.primary} size={19} /><Text style={{ color: colors.primary }}>Mở bản đồ bên ngoài</Text></Pressable>
    {config.error && <Pressable onPress={() => void config.reload()}><Text style={{ color: colors.textMuted }}>Chưa tải được tùy chọn chỉ đường · Thử lại</Text></Pressable>}{error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}
  </View>;
}
