import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Activity } from '../data/activities';
import { Text } from './LocalizedText';
import { colors } from '../theme';

export function BusinessIdentity({ activity, details = false, showOffer = false }: { activity: Activity; details?: boolean; showOffer?: boolean }) {
  if (activity.organizerType !== 'business') return null;
  const business = activity.business;
  return <View style={[styles.wrap, details && styles.details]}>
    <View style={styles.row}><View style={styles.verified}><Ionicons name={business?.verified ? 'shield-checkmark' : 'business-outline'} color="#147D68" size={14} /><Text style={styles.label}>{business?.verified ? 'Doanh nghiệp đã xác minh' : 'Doanh nghiệp tổ chức'}</Text></View>{Boolean(business?.discountPercent) && <View style={styles.discount}><Text style={styles.discountText}>−{business!.discountPercent}%</Text></View>}</View>
    {details && <Text style={styles.name}>{business?.name || activity.host}</Text>}
    {(details || showOffer) && business?.offer ? <View style={styles.row}><Ionicons name="gift-outline" color="#147D68" size={18} /><Text numberOfLines={details ? undefined : 2} style={styles.offer}>{business.offer}</Text></View> : null}
    {details && <>{business?.terms ? <Text style={styles.terms}>{business.terms}</Text> : null}<Text style={styles.terms}>Ưu đãi do doanh nghiệp cung cấp. GoMate chưa thu tiền hoặc xử lý thanh toán.</Text></>}
  </View>;
}
const styles = StyleSheet.create({ wrap: { gap: 10, marginBottom: 10 }, details: { marginTop: 14, borderWidth: 1, borderColor: '#B6DFD4', backgroundColor: '#EFFAF6', borderRadius: 20, padding: 16 }, row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' }, verified: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 10, backgroundColor: '#E1F4EC' }, label: { color: '#147D68', fontSize: 10, fontWeight: '700' }, discount: { backgroundColor: '#147D68', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }, discountText: { color: colors.white, fontWeight: '800', fontSize: 13 }, name: { fontWeight: '800', fontSize: 18, color: '#125E50' }, offer: { flex: 1, fontSize: 13, lineHeight: 20, color: '#125E50' }, terms: { color: colors.textSecondary, fontSize: 11, lineHeight: 18 } });
