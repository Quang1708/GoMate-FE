import { useRef, useState } from 'react';
import { useFeedbackState } from '../services/feedback';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
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
    if (!resend && code.some(digit => !digit)) { setFeedback('Vui lòng nhập đủ mã xác nhận 6 số.'); return; }
    setBusy(true); setFeedback('');
    try {
      if (resend) { await post('/auth/resend-verification', { email }); setFeedback('Đã yêu cầu gửi lại mã. Vui lòng đợi ít nhất 60 giây.'); }
      else { await verifyEmail(email, code.join('')); onVerified(); }
    } catch (reason) { setFeedback(reason instanceof Error ? reason.message : 'Xác minh thất bại'); }
    finally { setBusy(false); }
  };
  const inputs = useRef<(TextInput | null)[]>([]);

  const updateDigit = (value: string, index: number) => {
    const digits = value.replace(/\D/g, '').slice(0, CODE_LENGTH);
    const start = digits.length === CODE_LENGTH ? 0 : index;
    setCode(current => {
      const next = [...current];
      if (!digits) next[index] = '';
      else for (let at = 0; at < digits.length && start + at < CODE_LENGTH; at++) next[start + at] = digits[at];
      return next;
    });
    if (digits) inputs.current[Math.min(start + digits.length, CODE_LENGTH - 1)]?.focus();
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
          <View>
            <Text style={styles.title}>Kiểm tra email</Text>
            <Text style={styles.subtitle}>{`Nhập mã xác minh 6 số đã gửi tới ${email}. Xác minh xong, bạn sẽ tự động đăng nhập.`}</Text>
            <View style={styles.codeRow}>
              {code.map((digit, index) => (
                <TextInput
                  accessibilityLabel={`Verification digit ${index + 1}`}
                  key={index}
                  keyboardType="number-pad"
                  maxLength={CODE_LENGTH}
                  textContentType="oneTimeCode"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  editable={!busy}
                  onChangeText={(value) => updateDigit(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  ref={(input) => { inputs.current[index] = input; }}
                  selectTextOnFocus
                  style={styles.codeInput}
                  value={digit}
                />
              ))}
            </View>
            <View style={styles.resendRow}><Text style={styles.resendHint}>Chưa nhận được mã?</Text><Pressable disabled={busy} onPress={() => void submit(true)}><Text style={styles.resend}>Gửi lại mã</Text></Pressable></View>
          </View>
          {feedback ? <Text accessibilityRole="alert">{feedback}</Text> : null}<Pressable accessibilityRole="button" disabled={busy || code.some(digit => !digit)} onPress={() => void submit()} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryButtonLabel}>{busy ? 'Đang xác nhận...' : 'Xác nhận email'}</Text></Pressable>
        </ScrollView></KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  page: { alignSelf: 'center', flex: 1, maxWidth: layout.maxWidth, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', height: 56, justifyContent: 'space-between', paddingHorizontal: 12 },
  headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  body: { flexGrow: 1, gap: 24, justifyContent: 'space-between', paddingBottom: 26, paddingHorizontal: 20, paddingTop: 25 },
  title: { color: colors.text, ...typography.title },
  subtitle: { color: colors.textSecondary, marginTop: 4, maxWidth: 400, ...typography.body },
  codeRow: { flexDirection: 'row', gap: 9, marginTop: 28 },
  codeInput: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.text, flex: 1, fontSize: 25, fontWeight: '700', height: 58, minWidth: 0, maxWidth: 66, padding: 0, textAlign: 'center' },
  resendRow: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 24 },
  resendHint: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  resend: { color: colors.primary, fontSize: 13, fontWeight: '700', lineHeight: 20 },
  primaryButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 999, height: control.buttonHeight, justifyContent: 'center', width: '100%' },
  primaryButtonLabel: { color: colors.white, fontSize: 15, fontWeight: '700', lineHeight: 22 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
});
