import { useFeedbackState } from '../services/feedback';
import { PlacePicker } from './PlacePicker';
import { getMapsConfig, MapPlace, MapsConfig } from '../services/mapsService';
import { useRemote } from '../services/useRemote';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ActivityMap } from './ActivityMap';
import { Text } from './LocalizedText';
import { Coordinates, currentCoordinates } from '../services/locationService';
import { colors } from '../theme';
export function LocationField({ value, onChange, radiusKm, onPlaceSelected }: { value?: Coordinates | null; onChange: (point: Coordinates | null) => void; radiusKm?: number; onPlaceSelected?: (place: MapPlace) => void }) {
  const config = useRemote<MapsConfig | null>(getMapsConfig, null);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useFeedbackState('');
  const lock = useRef(false);
  const locate = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { onChange(await currentCoordinates()); setOpen(true); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không lấy được GPS'); }
    finally { lock.current = false; setBusy(false); }
  };
  return <View style={{ gap: 12 }}>
    {config.data?.placesEnabled && <Pressable accessibilityRole="button" accessibilityLabel="Tìm địa chỉ" onPress={() => setSearching(true)} style={{ padding: 14, borderRadius: 14, backgroundColor: colors.primarySoft }}><Text style={{ color: colors.primary }}>Tìm địa chỉ</Text></Pressable>}
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => void locate()}><Text style={{ color: colors.primary }}>{busy ? 'Đang lấy GPS...' : 'Dùng vị trí hiện tại'}</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => setOpen(!open)}><Text style={{ color: colors.primary }}>{open ? 'Ẩn bản đồ' : 'Chọn trên bản đồ'}</Text></Pressable>
      {value && <Pressable accessibilityRole="button" onPress={() => onChange(null)}><Text>Xóa vị trí đã chọn</Text></Pressable>}
    </View>
    {value && <Text>{value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}</Text>}
    {open && <><Text>Chạm bản đồ để chọn điểm chính xác.</Text><ActivityMap point={value ?? { latitude: 10.7769, longitude: 106.7009 }} radiusKm={radiusKm} editable onChange={onChange} /></>}
    {searching && <PlacePicker bias={value} onClose={() => setSearching(false)} onSelect={place => { onChange(place.point); onPlaceSelected?.(place); setOpen(true); setSearching(false); }} />}
    {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
  </View>;
}
