import { useFeedbackState } from '../services/feedback';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '../components/BrandLogo';
import { FormField } from '../components/FormField';
import { Text } from '../components/LocalizedText';
import { useWebNavigation } from '../services/webNavigation';
import { login, post } from '../services/api';
import { colors, control, typography } from '../theme';

type AuthStage = 'welcome' | 'login' | 'signup' | 'forgot' | 'reset' | 'success';

const encodeAuth = (stage: AuthStage) => `/auth/${stage}`;
const decodeAuth = (path: string): AuthStage => { const stage = path.split('/')[2]; return ['welcome', 'login', 'signup', 'forgot', 'reset', 'success'].includes(stage) ? stage as AuthStage : 'welcome'; };

type AuthScreenProps = {
  onLogin: () => void;
  onRegister: (email: string) => void;
};

export function AuthScreen({ onLogin, onRegister }: AuthScreenProps) {
  const [stage, setStage] = useWebNavigation<AuthStage>('welcome', encodeAuth, decodeAuth, 'guest');
  const [name, setName] = useState('');
  const [email, setEmailValue] = useState(() => { try { return sessionStorage.getItem('gomate.authEmail') || ''; } catch { return ''; } });
  const setEmail = (value: string) => { setEmailValue(value); try { sessionStorage.setItem('gomate.authEmail', value); } catch { /* Optional draft. */ } };
  const [loginPassword, setLoginPassword] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useFeedbackState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  useEffect(() => {
    if (!resendSeconds) return;
    const timer = setTimeout(() => setResendSeconds(seconds => Math.max(0, seconds - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);
  const [resetCode, setResetCode] = useState('');
  const run = async (action: () => Promise<void>) => {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true); setError('');
    try { await action(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Yêu cầu thất bại'); }
    finally { submitting.current = false; setBusy(false); }
  };
  const handleLogin = () => void run(async () => { await login(email, loginPassword); onLogin(); });
  const handleRegister = () => void run(async () => { await post('/auth/register', { name, email: email.trim(), password: signupPassword }); onRegister(email.trim()); });
  const unavailable = () => setError('Đăng nhập mạng xã hội chưa được cấu hình. Vui lòng dùng email.');

  if (stage === 'welcome') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.welcomePage}>
          <View style={styles.welcomeBrand}>
            <BrandLogo markOnly />
            <Text style={styles.welcomeTitle}>Join GoMate</Text>
            <Text style={styles.welcomeSubtitle}>Create your account and find activities worth showing up for.</Text>
          </View>
          <View style={styles.welcomeActions}>{error ? <Text style={{ color: colors.match }}>{error}</Text> : null}
            <MethodButton icon="mail-outline" label="Continue with email" onPress={() => setStage('signup')} primary />
            <GoogleLoginButton onLogin={onLogin} />
            <MethodButton icon="logo-apple" label="Continue with Apple" onPress={unavailable} />
            <InlinePrompt action="Log in" label="Already have an account?" onPress={() => setStage('login')} />
            {Platform.OS === 'web' && <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }}><Pressable accessibilityRole="link" style={{ padding: 12 }} onPress={() => window.location.assign('/demo')}><Text style={{ color: colors.primary, fontSize: 12 }}>Bộ demo GoMate</Text></Pressable><Pressable accessibilityRole="link" style={{ padding: 12 }} onPress={() => window.location.assign('/portal')}><Text style={{ color: colors.primary, fontSize: 12 }}>Dành cho doanh nghiệp</Text></Pressable></View>}
          </View>
          <Text style={styles.legal}>By continuing you agree to our Terms of Service and Privacy Policy.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (stage === 'success') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successPage}>
          <View style={styles.successContent}>
            <View style={styles.successIconBack} />
            <View style={styles.successIcon}><Ionicons color={colors.white} name="checkmark" size={27} /></View>
            <Text style={styles.successTitle}>All done!</Text>
            <Text style={styles.successSubtitle}>Your password has been reset. You can now log in with your new password.</Text>
          </View>
          <PrimaryButton label="Back to log in" onPress={() => setStage('login')} />
        </View>
      </SafeAreaView>
    );
  }

  const goBack = () => {
    if (stage === 'reset') setStage('forgot');
    else setStage('welcome');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <AuthHeader onBack={goBack} />{error ? <Text style={{ color: colors.match, padding: 16 }}>{error}</Text> : null}
        <ScrollView bounces={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {stage === 'login' && (
            <View style={styles.screenPage}>
              <View>
                <AuthHeading subtitle="Log in to pick up where you left off." title="Welcome back" />
                <View style={styles.fields}>
                  <FormField keyboardType="email-address" label="Email" onChangeText={setEmail} value={email} />
                  <FormField label="Password" onChangeText={setLoginPassword} secureTextEntry value={loginPassword} />
                </View>
                <Pressable onPress={() => setStage('forgot')} style={styles.forgotLink}><Text style={styles.linkText}>Forgot password?</Text></Pressable>
                <PrimaryButton disabled={busy} label={busy ? "Đang đăng nhập..." : "Log in"} onPress={handleLogin} />
                <Text style={styles.orText}>or</Text>
                <View style={styles.socialButtons}>
                  <GoogleLoginButton onLogin={onLogin} />
                  <MethodButton icon="logo-apple" label="Continue with Apple" onPress={unavailable} />
                </View>
              </View>
              <InlinePrompt action="Sign up" label="New to GoMate?" onPress={() => setStage('signup')} />
            </View>
          )}

          {stage === 'signup' && (
            <View style={styles.formPage}>
              <AuthHeading subtitle="Join GoMate and find your communities." title="Create your account" />
              <View style={styles.fields}>
                <FormField label="Full name" onChangeText={setName} value={name} />
                <FormField keyboardType="email-address" label="Email" onChangeText={setEmail} value={email} />
                <FormField label="Password" onChangeText={setSignupPassword} placeholder="Create a password" secureTextEntry value={signupPassword} />
                <Text style={styles.requirementText}>Từ 6 ký tự; không bắt buộc chữ hoa, số hoặc ký tự đặc biệt.</Text>
              </View>
              <Pressable style={styles.consent}>
                <View style={styles.checkbox}><Ionicons color={colors.white} name="checkmark" size={14} /></View>
                <Text style={styles.consentText}>I agree to the Terms of Service and Privacy Policy.</Text>
              </Pressable>
              <PrimaryButton disabled={busy} label={busy ? "Đang tạo tài khoản..." : "Create account"} onPress={handleRegister} />
              <View style={styles.signupPrompt}><InlinePrompt action="Log in" label="Already have an account?" onPress={() => setStage('login')} /></View>
            </View>
          )}

          {stage === 'forgot' && (
            <View style={styles.formPage}>
              <AuthHeading subtitle="Nhập email tài khoản để nhận mã OTP gồm 6 chữ số." title="Forgot password?" />
              <View style={styles.forgotField}><FormField keyboardType="email-address" label="Email" onChangeText={setEmail} value={email} /></View>
              <PrimaryButton disabled={busy} label={busy ? 'Đang gửi...' : 'Gửi mã OTP'} onPress={() => void run(async () => { await post('/auth/forgot-password', { email: email.trim() }); setResetCode(''); setResendSeconds(60); setStage('reset'); })} />
              <Pressable onPress={() => setStage('login')} style={styles.backToLogin}><Text style={styles.mutedAction}>Back to log in</Text></Pressable>
            </View>
          )}

          {stage === 'reset' && (
            <View style={styles.screenPage}>
              <View>
                <AuthHeading subtitle="Nhập mã OTP đã gửi đến email và mật khẩu mới từ 6 ký tự." title="Create new password" />
                <View style={styles.fields}>
                  <FormField label="Mã xác nhận 6 số" keyboardType="number-pad" value={resetCode} onChangeText={value => setResetCode(value.replace(/\D/g, '').slice(0, 6))} />
                  <FormField label="New password" onChangeText={setNewPassword} secureTextEntry value={newPassword} />
                  <FormField label="Confirm password" onChangeText={setConfirmPassword} secureTextEntry value={confirmPassword} />
                </View>
                <View style={styles.requirements}>
                  <Requirement label="Từ 6 ký tự" valid={newPassword.length >= 6} />


                </View>
              </View>
              <Pressable disabled={busy || resendSeconds > 0} onPress={() => void run(async () => { await post('/auth/forgot-password', { email: email.trim() }); setResendSeconds(60); setError('Đã yêu cầu gửi lại mã OTP. Kiểm tra hộp thư của bạn.'); })}><Text style={styles.linkText}>{resendSeconds ? `Gửi lại mã sau ${resendSeconds}s` : 'Gửi lại mã OTP'}</Text></Pressable>
              <PrimaryButton disabled={busy} label={busy ? 'Đang xử lý...' : 'Reset password'} onPress={() => void run(async () => { if (!/^\d{6}$/.test(resetCode)) throw new Error('Nhập mã OTP gồm 6 chữ số'); if (newPassword.length < 6 || newPassword.length > 128) throw new Error('Mật khẩu cần từ 6 đến 128 ký tự'); if (newPassword !== confirmPassword) throw new Error('Mật khẩu xác nhận không khớp'); await post('/auth/reset-password', { email: email.trim(), code: resetCode, newPassword }); setNewPassword(''); setConfirmPassword(''); setResetCode(''); setLoginPassword(''); setStage('success'); })} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function AuthHeader({ onBack }: { onBack: () => void }) {
  return <View style={styles.header}>
    <Pressable accessibilityLabel="Back" hitSlop={8} onPress={onBack} style={styles.headerButton}><Ionicons color={colors.textSecondary} name="chevron-back" size={24} /></Pressable>
    <Pressable accessibilityLabel="More options" hitSlop={8} style={styles.headerButton}><Ionicons color={colors.text} name="ellipsis-horizontal" size={22} /></Pressable>
  </View>;
}

function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return <View><Text style={styles.formTitle}>{title}</Text><Text style={styles.formSubtitle}>{subtitle}</Text></View>;
}

function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primaryButton, disabled && { opacity: 0.5 }, pressed && styles.pressed]}><Text style={styles.primaryButtonLabel}>{label}</Text></Pressable>;
}

function InlinePrompt({ action, label, onPress }: { action: string; label: string; onPress: () => void }) {
  return <View style={styles.inlinePrompt}><Text style={styles.promptText}>{label}</Text><Pressable onPress={onPress}><Text style={styles.linkText}>{action}</Text></Pressable></View>;
}

function MethodButton({ icon, label, primary = false, onPress }: { icon: 'mail-outline' | 'logo-google' | 'logo-apple'; label: string; primary?: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.methodButton, primary && styles.primaryMethod, pressed && styles.pressed]}>
    <Ionicons color={primary ? colors.white : icon === 'logo-google' ? colors.google : colors.text} name={icon} size={21} />
    <Text style={[styles.methodLabel, primary && styles.primaryButtonLabel]}>{label}</Text>
  </Pressable>;
}

function Requirement({ label, valid = false }: { label: string; valid?: boolean }) {
  return <View style={styles.requirementRow}><Ionicons color={valid ? colors.google : colors.textMuted} name="checkmark" size={17} /><Text style={styles.requirementText}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  flex: { flex: 1 },
  welcomePage: { alignSelf: 'center', flex: 1, justifyContent: 'space-between', maxWidth: 540, paddingBottom: 20, paddingHorizontal: 32, paddingTop: 82, width: '100%' },
  welcomeBrand: { alignItems: 'center' },
  welcomeTitle: { color: colors.text, marginTop: 16, ...typography.display },
  welcomeSubtitle: { color: colors.textSecondary, marginTop: 12, maxWidth: 310, textAlign: 'center', ...typography.bodyLarge },
  welcomeActions: { gap: 12 },
  legal: { color: colors.textMuted, fontSize: 12, lineHeight: 16, paddingHorizontal: 10, textAlign: 'center' },
  header: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', height: 56, justifyContent: 'space-between', maxWidth: 540, paddingHorizontal: 12, width: '100%' },
  headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  scrollContent: { flexGrow: 1 },
  screenPage: { alignSelf: 'center', flex: 1, justifyContent: 'space-between', maxWidth: 540, minHeight: 570, paddingBottom: 26, paddingHorizontal: 20, paddingTop: 25, width: '100%' },
  formPage: { alignSelf: 'center', maxWidth: 540, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 25, width: '100%' },
  formTitle: { color: colors.text, ...typography.title },
  formSubtitle: { color: colors.textSecondary, marginTop: 4, maxWidth: 390, ...typography.body },
  fields: { gap: 14, marginTop: 28 },
  forgotField: { marginBottom: 28, marginTop: 28 },
  forgotLink: { alignSelf: 'flex-end', marginBottom: 24, marginTop: 16 },
  primaryButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 999, height: control.buttonHeight, justifyContent: 'center', width: '100%' },
  primaryButtonLabel: { color: colors.white, fontSize: 15, fontWeight: '700', lineHeight: 22 },
  methodButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 999, borderWidth: 1, flexDirection: 'row', height: control.buttonHeight, justifyContent: 'center' },
  primaryMethod: { backgroundColor: colors.primary, borderColor: colors.primary },
  methodLabel: { color: colors.text, fontSize: 15, fontWeight: '600', lineHeight: 22, marginLeft: 9 },
  socialButtons: { gap: 12 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
  inlinePrompt: { alignItems: 'center', flexDirection: 'row', gap: 4, justifyContent: 'center' },
  signupPrompt: { marginTop: 18 },
  promptText: { color: colors.textSecondary, ...typography.body },
  linkText: { color: colors.primary, fontSize: 14, fontWeight: '600', lineHeight: 22 },
  orText: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginVertical: 9, textAlign: 'center' },
  consent: { alignItems: 'center', flexDirection: 'row', marginBottom: 26, marginTop: 22 },
  checkbox: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 5, height: 20, justifyContent: 'center', width: 20 },
  consentText: { color: colors.textSecondary, flex: 1, fontSize: 13, lineHeight: 18, marginLeft: 10 },
  backToLogin: { alignItems: 'center', paddingTop: 14 },
  mutedAction: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  requirements: { gap: 5, marginTop: 14 },
  requirementRow: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  requirementText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  successPage: { alignSelf: 'center', flex: 1, justifyContent: 'space-between', maxWidth: 540, paddingBottom: 26, paddingHorizontal: 20, paddingTop: 210, width: '100%' },
  successContent: { alignItems: 'center', position: 'relative' },
  successIconBack: { backgroundColor: '#9BE9D8', borderRadius: 13, height: 48, left: '50%', marginLeft: -29, position: 'absolute', top: 7, transform: [{ rotate: '-5deg' }], width: 48 },
  successIcon: { alignItems: 'center', backgroundColor: colors.success, borderRadius: 13, height: 48, justifyContent: 'center', transform: [{ rotate: '8deg' }], width: 48 },
  successTitle: { color: colors.text, fontSize: 25, fontWeight: '800', letterSpacing: -0.4, lineHeight: 32, marginTop: 28 },
  successSubtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 8, maxWidth: 310, textAlign: 'center' },
});
