import { api, post } from './api';
import type { Coordinates } from './locationService';
import { normalizeRegion, searchKey } from '../data/profileOptions';
import { districtsFor, regionOptions, wardsFor } from '../data/regionOptions';

export type SearchProvider = 'mapbox' | 'vietmap';
export type MapsConfig = { provider: 'mapbox' | 'osm'; searchProvider: SearchProvider | 'none'; placesEnabled: boolean; routesEnabled: boolean };
export type PlacePrediction = { id: string; text: string; title: string; subtitle: string };
export type MapPlace = { id: string; provider?: SearchProvider; address: string; point: Coordinates; title: string; components: { name: string; types: string[] }[]; attributions: { provider: string; providerUri: string }[] };
export type MapRoute = { distanceMeters: number; durationSeconds: number; encodedPolyline: string };
export type MapRouteOverlay = { encodedPolyline: string; origin: Coordinates };
export const getMapsConfig = () => api<MapsConfig>('/maps/config');
export const placePredictions = async (input: string, sessionToken: string, bias?: Coordinates | null) => (await post<{ items: PlacePrediction[] }>('/maps/places/autocomplete', { input, sessionToken, ...(bias ? { bias } : {}) })).items;
export const placeDetails = async (prediction: PlacePrediction, sessionToken: string) => ({ ...(await post<{ place: Omit<MapPlace, 'title'> }>('/maps/places/details', { id: prediction.id, sessionToken })).place, title: prediction.title });
export const findRoute = async (origin: Coordinates, destination: Coordinates, mode: 'DRIVE' | 'WALK') => (await post<{ route: MapRoute }>('/maps/routes', { origin: { latitude: origin.latitude, longitude: origin.longitude }, destination: { latitude: destination.latitude, longitude: destination.longitude }, mode })).route;
export type DirectionsMode = 'DRIVE' | 'MOTORCYCLE' | 'WALK';
export function directionsUrl(point: Coordinates, origin?: Coordinates, mode: DirectionsMode = 'DRIVE') {
  const travelmode = mode === 'WALK' ? 'walking' : mode === 'MOTORCYCLE' ? 'two-wheeler' : 'driving';
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(point.latitude + ',' + point.longitude)}&travelmode=${travelmode}${origin ? '&origin=' + encodeURIComponent(origin.latitude + ',' + origin.longitude) : ''}`;
}

// Groups address selections; this token never grants authentication/access. Mapbox Geocoding bills per request.
export function newPlacesSession() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => { const digit = Math.floor(Math.random() * 16); return (char === 'x' ? digit : (digit & 3) | 8).toString(16); });
}
export function placeRegionFields(place: MapPlace, currentProvince: string) {
  const strip = (value: string) => searchKey(normalizeRegion(value.replace(/^(Tỉnh|Thành phố|Province|City)\s+/i, '').replace(/\s+(Province|City)$/i, '')));
  const component = (type: string) => place.components.find(item => item.types.includes(type))?.name || '';
  const candidate = component('administrative_area_level_1') || component('locality');
  const province = regionOptions.find(value => strip(value) === strip(candidate));
  const base = province || currentProvince;
  const district = districtsFor(base).find(value => strip(value) === strip(component('administrative_area_level_2'))) || '';
  const wardName = component('administrative_area_level_3') || component('sublocality_level_1') || component('sublocality');
  const ward = wardsFor(base).find(value => strip(value) === strip(wardName)) || '';
  const addressKey = (value: string) => searchKey(value.replace(/^(Tỉnh|Thành phố|Quận|Huyện|Thị xã|Phường|Xã|Thị trấn)\s+/i, '').trim());
  const administrative = new Set(place.components.filter(item => item.types.some(type => type.startsWith('administrative_area_') || ['country', 'locality', 'sublocality', 'sublocality_level_1'].includes(type))).map(item => addressKey(item.name)));
  const streetAddress = place.address.split(',').map(value => value.trim()).filter(value => !administrative.has(addressKey(value))).join(', ') || place.address;
  const address = streetAddress.includes(place.title) ? streetAddress : `${place.title} · ${streetAddress}`;
  return { ...(province ? { province } : {}), district, ward, address };
}
