import { useEffect, useRef } from 'react';
import { ActivityMapProps, mapUrl } from './ActivityMap.types';
import { validCoordinates } from '../services/locationService';
export function ActivityMap(props: ActivityMapProps) {
  const { editable, onChange } = props;
  const ref = useRef<HTMLIFrameElement>(null);
  const source = `${mapUrl(props)}&parentOrigin=${encodeURIComponent(window.location.origin)}`;
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== ref.current?.contentWindow || event.origin !== new URL(source, window.location.href).origin) return;
      if (editable && event.data?.type === 'gomate-map-point' && validCoordinates(event.data.point)) onChange?.(event.data.point);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [editable, onChange, source]);
  useEffect(() => { ref.current?.contentWindow?.postMessage({ type: 'gomate-map-route', route: props.route ?? null }, new URL(source, window.location.href).origin); }, [props.route, source]);
  return <iframe ref={ref} title={props.editable ? 'Chọn điểm trên bản đồ' : 'Bản đồ hoạt động'} src={source} onLoad={() => ref.current?.contentWindow?.postMessage({ type: 'gomate-map-route', route: props.route ?? null }, new URL(source, window.location.href).origin)} style={{ border: 0, borderRadius: 16, width: '100%', height: 280 }} />;
}
