import { Ionicons } from '@expo/vector-icons';
import { useFeedbackState } from '../services/feedback';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './LocalizedText';
import { api } from '../services/api';
import { finishGoogleLogin } from '../services/googleLogin';
import { colors } from '../theme';
type GoogleIdentity = { initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void; renderButton: (node: HTMLElement, options: Record<string, unknown>) => void };
declare global { interface Window { google?: { accounts: { id: GoogleIdentity } } } }
let scriptPromise: Promise<GoogleIdentity> | undefined;
function loadGoogle() {
  if (window.google?.accounts.id) return Promise.resolve(window.google.accounts.id);
  return scriptPromise ??= new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.async = true;
    const timeout = setTimeout(() => { script.remove(); scriptPromise = undefined; reject(new Error('Google tải quá lâu. Kiểm tra mạng và thử lại.')); }, 15000);
    script.onload = () => { clearTimeout(timeout); if (window.google?.accounts.id) resolve(window.google.accounts.id); else { scriptPromise = undefined; reject(new Error('Không tải được Google')); } };
    script.onerror = () => { clearTimeout(timeout); script.remove(); scriptPromise = undefined; reject(new Error('Không tải được Google. Kiểm tra mạng.')); };
    document.head.appendChild(script);
  });
}
export function GoogleLoginButton({ onLogin }: { onLogin: () => void }) {
  const node = useRef<HTMLDivElement>(null), callback = useRef(onLogin), lock = useRef(false);
  useEffect(() => { callback.current = onLogin; }, [onLogin]);
  const [error, setError] = useFeedbackState(''), [configured, setConfigured] = useState(false), [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    void api<{ clientId: string | null }>('/auth/google/config').then(async ({ clientId }) => {
      if (!clientId || !alive) return;
      setConfigured(true);
      const identity = await loadGoogle();
      if (!alive || !node.current) return;
      identity.initialize({ client_id: clientId, callback: response => {
        if (lock.current || !alive) return;
        lock.current = true; setError('');
        void finishGoogleLogin(response.credential).then(() => { if (alive) callback.current(); }).catch(reason => { if (alive) setError(reason instanceof Error ? reason.message : 'Không đăng nhập được Google'); }).finally(() => { lock.current = false; });
      } });
      identity.renderButton(node.current, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: 300 });
    }).catch(reason => { if (alive) setError(reason instanceof Error ? reason.message : 'Không tải được Google'); });
    return () => { alive = false; };
  }, [retry, setError]);
  return <View style={{ gap: 8, alignItems: 'center' }}><div ref={node} />
    {!configured && <Pressable accessibilityRole="button" onPress={() => setError('Đăng nhập Google chưa được bật. Vui lòng dùng email.')} style={{ padding: 14, borderRadius: 24, borderWidth: 1, borderColor: colors.border, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10, width: '100%' }}><Ionicons name="logo-google" size={22} color="#4285F4" /><Text>Continue with Google</Text></Pressable>}
    {error ? <><Text style={{ color: colors.danger }}>{error}</Text>{configured && <Pressable accessibilityRole="button" onPress={() => { setError(''); setRetry(value => value + 1); }}><Text style={{ color: colors.primary }}>Thử lại Google</Text></Pressable>}</> : null}
  </View>;
}
