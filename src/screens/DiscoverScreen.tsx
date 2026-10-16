import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { ApiActivityDetailScreen } from './ActivityManagerScreen';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/LocalizedText';
import { MatchScreen } from './MatchScreen';
import { Activity } from '../data/activities';
import { activityCard, ActivityFilters, Coordinates, searchActivities } from '../services/discoveryService';

export type DiscoveryContext = { query: string; coords?: Coordinates };
export function DiscoverScreen({ filters, onBack, onFilterPress, context, onContextChange }: {
  filters: ActivityFilters; onBack: () => void; onFilterPress: () => void;
  context: DiscoveryContext; onContextChange: (value: DiscoveryContext) => void;
}) {
  const [input, setInput] = useState(context.query);
  const [query, setQuery] = useState(context.query);
  const [coords, setCoords] = useState<Coordinates | undefined>(context.coords);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [items, setItems] = useState<Activity[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [detailId, setDetailId] = useState<string>();
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(() => controller.abort(), 20000);
    searchActivities(filters, query, page, coords, controller.signal).then(data => {
      if (!active) return;
      setItems(current => page === 1 ? data.items.map(activityCard) : [...current, ...data.items.filter(item => !current.some(existing => existing.id === item.id)).map(activityCard)]);
      setHasMore(data.hasMore); setError('');
    }).catch(reason => {
      if (active) setError(reason?.status === 401 ? 'Phiên hết hạn. Vui lòng đăng nhập lại.' : 'Không tải được hoạt động. Vui lòng thử lại.');
    }).finally(() => { clearTimeout(timer); if (active) setLoading(false); });
    return () => { active = false; controller.abort(); clearTimeout(timer); };
  }, [filters, query, page, coords, retry]);
  const locate = async () => {
    setLocating(true); setLocationError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error('Bạn chưa cho phép vị trí. Vẫn có thể tìm không giới hạn khoảng cách.');
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLoading(true); setPage(1); setItems([]); setCoords(position.coords);
      onContextChange({ query, coords: position.coords });
    } catch { setLocationError('Không lấy được vị trí. Kiểm tra quyền vị trí/GPS hoặc tìm trên mọi khu vực.'); }
    finally { setLocating(false); }
  };
  if (detailId) return <ApiActivityDetailScreen id={detailId} onBack={() => setDetailId(undefined)} />;
  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
    <View style={{ padding: 12, gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TextInput accessibilityLabel="Tìm hoạt động" maxLength={100} placeholder="Tên hoạt động, địa điểm, từ khóa…" value={input} onChangeText={setInput} style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8 }} />
        <Pressable disabled={loading} onPress={() => { setLoading(true); setPage(1); setItems([]); setQuery(input.trim()); onContextChange({ query: input.trim(), coords }); setRetry(value => value + 1); }}><Text>Tìm kiếm</Text></Pressable>
      </View>
      <Pressable disabled={locating} onPress={() => void locate()}><Text>{locating ? 'Đang lấy vị trí…' : coords ? `Cập nhật vị trí · trong ${filters.distance} km` : 'Dùng vị trí của tôi để tìm gần đây'}</Text></Pressable>
      {coords && <Pressable onPress={() => { setLoading(true); setPage(1); setItems([]); setCoords(undefined); onContextChange({ query }); }}><Text>Tìm mọi khu vực</Text></Pressable>}
      {!!locationError && <Text accessibilityRole="alert">{locationError}</Text>}
      {!!error && <Pressable onPress={() => { setLoading(true); setRetry(value => value + 1); }}><Text accessibilityRole="alert">{error} · Thử lại</Text></Pressable>}
    </View>
    <MatchScreen key={`${query}:${coords?.latitude}:${coords?.longitude}:${retry}`} activityItems={items} state={loading ? 'loading' : error ? 'network-error' : 'ready'}
      locationLabel={coords ? `Trong ${filters.distance} km` : 'Mọi khu vực'} onBack={onBack} onFilterPress={onFilterPress}
      onMatched={async activity => { setDetailId(activity.id); return false; }} />
    {hasMore && !loading && !error && <Pressable style={{ padding: 14, alignItems: 'center' }} onPress={() => { setLoading(true); setPage(value => value + 1); }}><Text>Tải thêm hoạt động</Text></Pressable>}
  </SafeAreaView>;
}
