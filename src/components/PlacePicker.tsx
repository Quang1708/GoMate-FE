import { useFeedbackState } from '../services/feedback';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './LocalizedText';
import { MapAttribution } from './MapAttribution';
import { ScreenHeader } from './ScreenHeader';
import { ActivityMap } from './ActivityMap';
import { GradientButton } from './GradientButton';
import type { Coordinates } from '../services/locationService';
import { getMapsConfig, MapPlace, MapsConfig, newPlacesSession, placeDetails, PlacePrediction, placePredictions } from '../services/mapsService';
import { colors, layout } from '../theme';
import { useRemote } from '../services/useRemote';

export function PlacePicker({ bias, onSelect, onClose }: { bias?: Coordinates | null; onSelect: (place: MapPlace) => void; onClose: () => void }) {
  const config = useRemote<MapsConfig | null>(getMapsConfig, null);
  const [query, setQuery] = useState(''), [items, setItems] = useState<PlacePrediction[]>([]), [busy, setBusy] = useState(false), [selecting, setSelecting] = useState(false), [error, setError] = useFeedbackState(''), [detail, setDetail] = useState<MapPlace | null>(null), [retry, setRetry] = useState(0);
  const session = useRef(''), expires = useRef(0), lock = useRef(false);
  useEffect(() => {
    if (query.trim().length < 2 || detail) return;
    let alive = true;
    const timer = setTimeout(() => {
      if (Date.now() > expires.current) { session.current = newPlacesSession(); expires.current = Date.now() + 180000; }
      void placePredictions(query.trim(), session.current, bias).then(rows => { if (alive) { setItems(rows); setError(''); } }).catch(reason => { if (alive) setError(reason.message); }).finally(() => { if (alive) setBusy(false); });
    }, 450);
    return () => { alive = false; clearTimeout(timer); };
  }, [query, bias, detail, retry, setError]);
  const choose = async (item: PlacePrediction) => {
    if (lock.current) return; lock.current = true; setSelecting(true); setError('');
    try { setDetail(await placeDetails(item, session.current)); session.current = ''; expires.current = 0; }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Chưa chọn được địa điểm.'); }
    finally { lock.current = false; setSelecting(false); }
  };
  const search = (value: string) => { setQuery(value); setItems([]); setError(''); setBusy(value.trim().length >= 2); };
  return <Modal visible animationType="slide" onRequestClose={() => { if (!selecting) onClose(); }}><SafeAreaView style={styles.safe}><ScreenHeader title="Tìm địa điểm" onBack={selecting ? undefined : onClose} /><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
    {!detail ? <><View style={styles.search}><Ionicons name="search-outline" color={colors.primary} size={22} /><TextInput accessibilityLabel="Tìm địa chỉ hoặc địa điểm" value={query} onChangeText={search} editable={!selecting} placeholder={config.data?.searchProvider === 'vietmap' ? 'Tên quán, số nhà, tên đường...' : 'Số nhà, đường hoặc thành phố...'} maxLength={160} autoFocus style={styles.input} /></View><Text style={styles.note}>Chọn kết quả phù hợp và kiểm tra vị trí trên bản đồ trước khi xác nhận.</Text>{busy || selecting ? <ActivityIndicator color={colors.primary} /> : null}{!busy && !selecting && query.trim().length >= 2 && !error && !items.length && <Text>Chưa tìm thấy địa điểm. Thử thêm tên đường hoặc thành phố.</Text>}{items.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Chọn địa điểm ${item.title}`} disabled={selecting} onPress={() => void choose(item)} style={styles.result}><Ionicons name="location-outline" color={colors.primary} size={24} /><View style={{ flex: 1, gap: 5 }}><Text style={styles.title}>{item.title}</Text><Text style={styles.note}>{item.subtitle || item.text}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></Pressable>)}<MapAttribution provider={config.data?.searchProvider} /></> : <><Text style={styles.title}>{detail.title}</Text><Text>{detail.address}</Text><ActivityMap point={detail.point} /><MapAttribution provider={detail.provider} />{detail.attributions.map((item, index) => <Pressable key={index} accessibilityRole="link" onPress={() => { try { const url = new URL(item.providerUri); if (url.protocol === 'https:' && !url.username && !url.password) void Linking.openURL(url.toString()).catch(() => setError('Chưa mở được nguồn địa điểm.')); } catch { setError('Chưa mở được nguồn địa điểm.'); } }}><Text style={styles.note}>{item.provider}</Text></Pressable>)}<GradientButton label="Dùng địa điểm này" onPress={() => onSelect(detail)} /><Pressable accessibilityRole="button" onPress={() => { setDetail(null); search(''); }} style={{ padding: 14, alignItems: 'center' }}><Text style={{ color: colors.primary }}>Chọn địa điểm khác</Text></Pressable></>}
    {error ? <View style={{ gap: 12 }}><Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text>{!detail && <Pressable accessibilityRole="button" onPress={() => { setError(''); setBusy(query.trim().length >= 2); setRetry(value => value + 1); }}><Text style={{ color: colors.primary }}>Thử lại tìm địa điểm</Text></Pressable>}</View> : null}
  </ScrollView></KeyboardAvoidingView></SafeAreaView></Modal>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, page: { padding: 18, gap: 16, maxWidth: layout.maxWidth, width: '100%', alignSelf: 'center', paddingBottom: 32 }, search: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, input: { flex: 1, fontSize: 15, paddingVertical: 15, color: colors.text }, note: { color: colors.textMuted, fontSize: 12, lineHeight: 19 }, result: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, title: { fontSize: 16, fontWeight: '700', color: colors.text } });
