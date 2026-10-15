import { WebView } from 'react-native-webview';
import { ActivityMapProps, mapUrl } from './ActivityMap.types';
import { validCoordinates } from '../services/locationService';
export function ActivityMap(props: ActivityMapProps) {
  const uri = mapUrl(props);
  return <WebView source={{ uri }} style={{ height: 280, flex: 0, borderRadius: 16 }}
    originWhitelist={['http://*', 'https://*']} javaScriptEnabled
    onShouldStartLoadWithRequest={request => request.url === uri || request.url === 'about:blank'}
    onMessage={event => { try { const data = JSON.parse(event.nativeEvent.data); if (props.editable && data.type === 'gomate-map-point' && validCoordinates(data.point)) props.onChange?.(data.point); } catch { /* Ignore unrelated messages. */ } }} />;
}
