import { Coordinates } from '../services/locationService';
import { apiBaseUrl } from '../services/api';
import type { MapRouteOverlay } from '../services/mapsService';
export type ActivityMapProps = { point: Coordinates; radiusKm?: number; editable?: boolean; onChange?: (point: Coordinates) => void; route?: MapRouteOverlay | null };
export function mapUrl({ point, radiusKm, editable }: ActivityMapProps) {
  return `${apiBaseUrl.replace(/\/api$/, '')}/map.html?lat=${point.latitude}&lng=${point.longitude}&radius=${radiusKm || 0}&pick=${editable ? 1 : 0}`;
}
