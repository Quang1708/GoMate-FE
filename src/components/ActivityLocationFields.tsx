import { View } from 'react-native';
import { StringSelectionField } from './SelectionField';
import { districtsFor, regionOptions, wardsFor } from '../data/regionOptions';
import { Text } from './LocalizedText';
import { colors } from '../theme';
export function ActivityLocationFields({ province, district, ward, onChange, filter = false }: { province: string; district: string; ward?: string; filter?: boolean; onChange: (patch: { province?: string; district?: string; ward?: string }) => void }) {
  return <View style={{ gap: 14 }}>
    <StringSelectionField label="Tỉnh / thành phố" options={filter ? ['Tất cả', ...regionOptions] : regionOptions} value={province} onChange={value => onChange({ province: value || (filter ? 'Tất cả' : ''), district: filter ? 'Tất cả' : '', ward: '' })} />
    {province && province !== 'Tất cả' && <><StringSelectionField label="Quận / khu vực (tùy chọn)" options={filter ? ['Tất cả', ...districtsFor(province)] : districtsFor(province)} value={district} onChange={value => onChange({ district: value || (filter ? 'Tất cả' : '') })} emptyLabel={filter ? 'Tất cả' : 'Chọn địa danh quen thuộc'} />
      <StringSelectionField label="Phường / xã (tùy chọn)" options={filter ? ['Tất cả', ...wardsFor(province)] : wardsFor(province)} value={ward || ''} onChange={value => onChange({ ward: value === 'Tất cả' ? '' : value })} emptyLabel={filter ? 'Tất cả' : 'Chọn phường / xã'} />
      <Text style={{ color: colors.textMuted, fontSize: 12 }}></Text></>}
  </View>;
}
