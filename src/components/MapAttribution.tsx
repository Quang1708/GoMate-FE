import { Linking, Text } from 'react-native';
import type { SearchProvider } from '../services/mapsService';
export function MapAttribution({ provider }: { provider?: SearchProvider | 'none' }) { return <Text accessibilityRole="link" onPress={() => { void Linking.openURL(provider === 'vietmap' ? 'https://maps.vietmap.vn/' : 'https://www.mapbox.com/about/maps/').catch(() => {}); }} style={{ fontSize: 12, color: '#5E5E5E', paddingVertical: 10 }}>{provider === 'vietmap' ? 'Địa điểm từ VIETMAP' : '© Mapbox'}</Text>; }
