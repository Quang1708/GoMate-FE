import { Ionicons } from '@expo/vector-icons';
import { useFeedbackState } from '../services/feedback';
import { useRef, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Text } from './LocalizedText';
import { api } from '../services/api';
import { finishGoogleLogin } from '../services/googleLogin';
import { colors } from '../theme';
export function GoogleLoginButton({ onLogin }: { onLogin: () => void }) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false), [error, setError] = useFeedbackState('');
  const signIn = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      if (process.env.EXPO_PUBLIC_GOOGLE_NATIVE_ENABLED !== 'true') throw new Error('Đăng nhập Google chưa được bật. Vui lòng dùng email.');
      const { clientId } = await api<{ clientId: string | null }>('/auth/google/config');
      if (!clientId) throw new Error('Đăng nhập Google chưa được bật. Vui lòng dùng email.');
      const { GoogleSignin, isSuccessResponse } = await import('@react-native-google-signin/google-signin');
      GoogleSignin.configure({ webClientId: clientId, iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID });
      if (Platform.OS === 'android') await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (isSuccessResponse(response)) {
        if (!response.data.idToken) throw new Error('Google không trả về mã đăng nhập. Vui lòng thử lại.');
        await finishGoogleLogin(response.data.idToken); onLogin();
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không đăng nhập được Google'); }
    finally { lock.current = false; setBusy(false); }
  };
  return <View style={{ gap: 8 }}><Pressable accessibilityRole="button" disabled={busy} onPress={() => void signIn()} style={{ padding: 14, borderRadius: 24, borderWidth: 1, borderColor: colors.border, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 }}><Ionicons name="logo-google" size={22} color="#4285F4" /><Text>{busy ? 'Đang đăng nhập...' : 'Continue with Google'}</Text></Pressable>{error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}</View>;
}
