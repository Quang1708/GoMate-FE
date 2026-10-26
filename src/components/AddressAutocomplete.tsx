import { useFeedbackState } from '../services/feedback';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from './FormField';
import { Text } from './LocalizedText';
import { MapAttribution } from './MapAttribution';
import { getMapsConfig, MapPlace, MapsConfig, newPlacesSession, placeDetails, PlacePrediction, placePredictions } from '../services/mapsService';
import type { Coordinates } from '../services/locationService';
import { useRemote } from '../services/useRemote';
import { colors } from '../theme';

export function AddressAutocomplete({ value, bias, onChangeText, onSelect, onSuggestionsLayout }: {
  value: string;
  bias?: Coordinates | null;
  onChangeText: (value: string) => void;
  onSelect: (place: MapPlace) => void;
  onSuggestionsLayout?: () => void;
}) {
  const config = useRemote<MapsConfig | null>(getMapsConfig, null);
  const [query, setQuery] = useState(''), [retry, setRetry] = useState(0);
  const [results, setResults] = useState<{ items: PlacePrediction[]; session: string } | null>(null);
  const [busy, setBusy] = useState(false), [selecting, setSelecting] = useState(false), [error, setError] = useFeedbackState('');
  const session = useRef(''), locked = useRef(false), alive = useRef(true);
  const latitude = bias?.latitude, longitude = bias?.longitude;
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    if (!config.data?.placesEnabled || query !== value || query.trim().length < 2) return;
    let current = true;
    const timer = setTimeout(() => {
      if (!session.current) session.current = newPlacesSession();
      const searchSession = session.current;
      const point = latitude === undefined || longitude === undefined ? undefined : { latitude, longitude };
      void placePredictions(query.trim(), searchSession, point).then(items => {
        if (current) { setResults({ items, session: searchSession }); setError(''); }
      }).catch(reason => { if (current) setError(reason instanceof Error ? reason.message : 'Chưa tải được gợi ý địa chỉ.'); })
        .finally(() => { if (current) setBusy(false); });
    }, 450);
    return () => { current = false; clearTimeout(timer); };
  }, [query, value, retry, latitude, longitude, config.data?.placesEnabled, setError]);

  const edit = (text: string) => {
    onChangeText(text); setQuery(text); setResults(null); setError(''); setBusy(text.trim().length >= 2);
  };
  const dismiss = () => { setQuery(''); setResults(null); setError(''); setBusy(false); };
  const choose = async (item: PlacePrediction, searchSession: string) => {
    if (locked.current) return;
    locked.current = true; setSelecting(true); setError('');
    try {
      const place = await placeDetails(item, searchSession);
      if (alive.current) { onSelect(place); dismiss(); session.current = ''; }
    } catch (reason) {
      if (alive.current) setError(reason instanceof Error ? reason.message : 'Chưa chọn được địa chỉ. Vui lòng tìm lại.');
    } finally { locked.current = false; if (alive.current) setSelecting(false); }
  };
  const expanded = Boolean(config.data?.placesEnabled && query === value && query.trim().length >= 2);
  return <View style={{ gap: 8 }}>
    <FormField icon="location-outline" label="Địa chỉ" value={value} onChangeText={edit} editable={!selecting} maxLength={160} placeholder="Nhập địa chỉ cụ thể" />
    {expanded && <View style={styles.panel} onLayout={onSuggestionsLayout}>
      <View style={styles.heading}><Text style={styles.caption}>Gợi ý địa chỉ</Text><Pressable accessibilityRole="button" accessibilityLabel="Ẩn gợi ý địa chỉ" disabled={selecting} onPress={dismiss} hitSlop={8}><Ionicons name="close" size={20} color={colors.textMuted} /></Pressable></View>
      {busy || selecting ? <View style={styles.status}><ActivityIndicator size="small" color={colors.primary} /><Text style={styles.caption}>{selecting ? 'Đang chọn địa chỉ...' : 'Đang tìm địa chỉ...'}</Text></View> : null}
      {!busy && Boolean(results?.items.length) && <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">{results?.items.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Gợi ý địa chỉ ${item.title}`} disabled={selecting} onPress={() => void choose(item, results.session)} style={styles.result}>
        <Ionicons name="location-outline" size={21} color={colors.primary} /><View style={{ flex: 1, gap: 4 }}><Text style={styles.title}>{item.title}</Text><Text style={styles.caption}>{item.subtitle || item.text}</Text></View><Ionicons name="arrow-up-outline" size={17} color={colors.textMuted} />
      </Pressable>)}</ScrollView>}
      {!busy && !selecting && !error && results && !results.items.length && <Text style={styles.caption}>Không tìm thấy địa chỉ. Bạn vẫn có thể nhập địa chỉ và chọn ghim thủ công.</Text>}
      {error ? <View style={{ gap: 8 }}><Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text><Pressable accessibilityRole="button" disabled={selecting} onPress={() => { setResults(null); setError(''); setBusy(true); session.current = ''; setRetry(count => count + 1); }}><Text style={{ color: colors.primary }}>Thử lại gợi ý địa chỉ</Text></Pressable></View> : null}
      <MapAttribution provider={config.data?.searchProvider} />
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  panel: { padding: 12, gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.surface },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  status: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 8 },
  caption: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  title: { color: colors.text, fontSize: 14, fontWeight: '700' },
  result: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
});
