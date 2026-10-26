import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './LocalizedText';
import { subscribeFeedback } from '../services/feedback';
import { colors } from '../theme';

export function AppFeedback() {
  const [message, setMessage] = useState('');
  useEffect(() => subscribeFeedback(setMessage), []);
  return <Modal visible={Boolean(message)} transparent animationType="fade" onRequestClose={() => setMessage('')}>
    <View style={styles.backdrop}><View accessibilityViewIsModal style={styles.card}>
      <Ionicons name="information-circle-outline" color={colors.primary} size={36} />
      <Text style={styles.title}>Thông báo</Text>
      <Text accessibilityRole="alert" style={styles.message}>{message}</Text>
      <Pressable accessibilityRole="button" onPress={() => setMessage('')} style={styles.button}><Text style={styles.buttonText}>Đã hiểu</Text></Pressable>
    </View></View>
  </Modal>;
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#15203388', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 400, backgroundColor: colors.white, borderRadius: 24, padding: 24, gap: 16, alignItems: 'center' },
  title: { fontSize: 21, fontWeight: '700', color: colors.text },
  message: { fontSize: 15, lineHeight: 23, textAlign: 'center', color: colors.textSecondary },
  button: { backgroundColor: colors.primary, borderRadius: 16, padding: 14, alignSelf: 'stretch', alignItems: 'center' },
  buttonText: { color: colors.white, fontWeight: '700' },
});
