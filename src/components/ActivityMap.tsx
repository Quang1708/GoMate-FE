import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { ActivityMapProps, mapUrl } from './ActivityMap.types';
import { validCoordinates } from '../services/locationService';
export function ActivityMap(props: ActivityMapProps) {
  const uri = mapUrl(props);
  const ref = useRef<WebView>(null);
  useEffect(() => { ref.current?.postMessage(JSON.stringify({ type: 'gomate-map-route', route: props.route ?? null })); }, [props.route, uri]);
  return <WebView ref={ref} source={{ uri }} style={{ height: 280, flex: 0, borderRadius: 16 }}
    originWhitelist={['http://*', 'https://*']} javaScriptEnabled
    onLoadEnd={() => ref.current?.postMessage(JSON.stringify({ type: 'gomate-map-route', route: props.route ?? null }))}
    onShouldStartLoadWithRequest={request => {
      if (request.url === uri || request.url === 'about:blank' || request.isTopFrame === false) return true;
      try { const url = new URL(request.url); if (url.protocol === 'https:' && (url.hostname === 'mapbox.com' || url.hostname.endsWith('.mapbox.com') || url.hostname === 'google.com' || url.hostname.endsWith('.google.com') || url.hostname === 'openstreetmap.org' || url.hostname.endsWith('.openstreetmap.org'))) void Linking.openURL(url.toString()).catch(() => {}); } catch { /* Keep navigation inside the map document. */ }
      return false;
    }}
    onMessage={event => { try { const data = JSON.parse(event.nativeEvent.data); if (props.editable && data.type === 'gomate-map-point' && validCoordinates(data.point)) props.onChange?.(data.point); } catch { /* Ignore unrelated messages. */ } }} />;
}
