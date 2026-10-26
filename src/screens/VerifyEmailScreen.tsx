import { useRef, useState } from 'react';
import { useFeedbackState } from '../services/feedback';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '../components/LocalizedText';
import { post, verifyEmail } from '../services/api';
import { colors, control, layout, typography } from '../theme';

const CODE_LENGTH = 6;

export function VerifyEmailScreen({ email, onVerified, onBack }: { email: string; onVerified: () => void; onBack: () => void }) {
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useFeedbackState('');
  const submit = async (resend = false) => {
    if (busy) return;
    setBusy(true); setFeedback('');
    try {
      if (resend) { await post('/auth/resend-verification', { email }); setFeedback('Đã yêu cầu gửi lại mã. Vui lòng đợi ít nhất 60 giây.'); }
      else { await verifyEmail(email, code.join('')); onVerified(); }
    } catch (reason) { setFeedback(reason instanceof Error ? reason.message : 'Xác minh thất bại'); }
    finally { setBusy(false); }
  };
  const inputs = useRef<(TextInput | null)[]>([]);

  const updateDigit = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setCode((current) => current.map((item, itemIndex) => itemIndex === index ? digit : item));
    if (digit && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) inputs.current[index - 1]?.focus();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Back" hitSlop={8} onPress={onBack} style={styles.headerButton}><Ionicons color={colors.textSecondary} name="chevron-back" size={24} /></Pressable>
          <Pressable accessibilityLabel="More options" hitSlop={8} style={styles.headerButton}><Ionicons color={colors.text} name="ellipsis-horizontal" size={22} /></Pressable>
        </View>
        <View style={styles.body}>
          <View>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.subtitle}>{`Nhập mã xác minh 6 số đã gửi tới ${email}. Xác minh xong, bạn sẽ tự động đăng nhập.`}</Text>
            <View style={styles.codeRow}>
              {code.map((digit, index) => (
                <TextInput
                  accessibilityLabel={`Verification digit ${index + 1}`}
                  key={index}
                  keyboardType="number-pad"
                  maxLength={1}
                  onChangeText={(value) => updateDigit(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  ref={(input) => { inputs.current[index] = input; }}
                  selectTextOnFocus
                  style={styles.codeInput}
                  value={digit}
                />
              ))}
            </View>
            <View style={styles.resendRow}><Text style={styles.resendHint}>Did not get it?</Text><Pressable disabled={busy} onPress={() => void submit(true)}><Text style={styles.resend}>Resend code</Text></Pressable></View>
          </View>
          {feedback ? <Text>{feedback}</Text> : null}<Pressable disabled={busy} onPress={() => void submit()} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryButtonLabel}>Verify email</Text></Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  page: { alignSelf: 'center', flex: 1, maxWidth: layout.maxWidth, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', height: 56, justifyContent: 'space-between', paddingHorizontal: 12 },
  headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  body: { flex: 1, justifyContent: 'space-between', minHeight: 570, paddingBottom: 26, paddingHorizontal: 20, paddingTop: 25 },
  title: { color: colors.text, ...typography.title },
  subtitle: { color: colors.textSecondary, marginTop: 4, maxWidth: 400, ...typography.body },
  codeRow: { flexDirection: 'row', gap: 9, marginTop: 28 },
  codeInput: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.text, flex: 1, fontSize: 25, fontWeight: '700', height: 58, maxWidth: 66, padding: 0, textAlign: 'center' },
  resendRow: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 24 },
  resendHint: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  resend: { color: colors.primary, fontSize: 13, fontWeight: '700', lineHeight: 20 },
  primaryButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 999, height: control.buttonHeight, justifyContent: 'center', width: '100%' },
  primaryButtonLabel: { color: colors.white, fontSize: 15, fontWeight: '700', lineHeight: 22 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
});
