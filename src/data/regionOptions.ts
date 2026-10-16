import current from './regions.json';
import legacy from './legacyDistricts.json';
import { normalizeRegion, profileRegions, searchKey } from './profileOptions';
const normalize = (name: string) => normalizeRegion(name.replace(/^(Tỉnh|Thành phố)\s+/, ''));
export const regionOptions = profileRegions;
export function wardsFor(province: string) {
  return [...new Set(current.find(region => normalize(region.name) === province)?.wards ?? [])];
}
export function districtsFor(province: string) {
  const key = Object.keys(legacy).find(name => searchKey(normalize(name)) === searchKey(province));
  return key ? (legacy as Record<string, string[]>)[key] : [];
}
