import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityMap } from './ActivityMap';
import { Text } from './LocalizedText';
import { Coordinates } from '../services/locationService';
import { directionsUrl, DirectionsMode } from '../services/mapsService';
import { colors } from '../theme';

export function RouteMap({ point }: { point: Coordinates }) {
  const [error, setError] = useState('');
  const open = async (mode: DirectionsMode) => {
    setError('');
    try { await Linking.openURL(directionsUrl(point, undefined, mode)); }
    catch { setError('Chưa mở được Google Maps. Vui lòng thử lại.'); }
  };
  return <View style={{ gap: 12 }}><ActivityMap point={point} />
    <Text style={{ color: colors.textSecondary }}>Chỉ đường bằng Google Maps</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {([['DRIVE', 'Ô tô', 'car-outline'], ['MOTORCYCLE', 'Xe máy', 'bicycle-outline'], ['WALK', 'Đi bộ', 'walk-outline']] as const).map(([mode, label, icon]) => <Pressable key={mode} accessibilityRole="button" accessibilityLabel={`Chỉ đường: ${label}`} onPress={() => void open(mode)} style={{ flexDirection: 'row', gap: 6, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: colors.primarySoft }}><Ionicons name={icon} color={colors.primary} size={20} /><Text style={{ color: colors.primary }}>{label}</Text></Pressable>)}
    </View>
    {error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}
  </View>;
}
