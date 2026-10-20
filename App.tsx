import PortalEntry from './src/PortalEntry';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { api, getSession, initializeSession, setUnauthorizedHandler } from './src/services/api';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LanguageProvider } from './src/i18n/LanguageContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { MainApp } from './src/screens/MainApp';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { OnboardingPermissionsScreen } from './src/screens/OnboardingPermissionsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { VerifyEmailScreen } from './src/screens/VerifyEmailScreen';
import { WebWorkspace } from './src/components/WebWorkspace';

function pendingEmail() { try { return sessionStorage.getItem('gomate.verificationEmail') || ''; } catch { return ''; } }

type Screen = 'onboarding' | 'auth' | 'verify' | 'profile' | 'permissions' | 'main';

export default function App() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const pathname = window.location.pathname.replace(/\/$/, '');
    if (['/portal', '/business'].includes(pathname)) return <WebWorkspace mode="portal" />;
    if (/^\/(portal|admin|staff|business)(\/|$)/.test(window.location.pathname)) return <PortalEntry />;
  }
  return <UserApp />;
}

function UserApp() {
  const [booting, setBooting] = useState(Platform.OS !== 'web');
  const [bootError, setBootError] = useState('');
  const [retry, setRetry] = useState(0);
  const [screen, setScreen] = useState<Screen>(() => getSession() ? 'main' : Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hash ? (window.location.hash === '#/auth/verify' && pendingEmail() ? 'verify' : 'auth') : 'onboarding');

  const [verificationEmail, setVerificationEmail] = useState(pendingEmail);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let alive = true;
    void initializeSession().then(() => { if (alive) { setBootError(''); if (getSession()) setScreen('main'); setBooting(false); } }).catch(() => { if (alive) setBootError('Không đọc được phiên đăng nhập đã lưu. Vui lòng thử lại.'); });
    return () => { alive = false; };
  }, [retry]);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const restore = () => { if (!getSession()) setScreen(window.location.hash === '#/auth/verify' && pendingEmail() ? 'verify' : 'auth'); };
    window.addEventListener('popstate', restore); window.addEventListener('hashchange', restore);
    return () => { window.removeEventListener('popstate', restore); window.removeEventListener('hashchange', restore); };
  }, []);
  useEffect(() => { setUnauthorizedHandler(() => setScreen('auth')); return () => setUnauthorizedHandler(); }, []);

  if (Platform.OS === 'web' && ['/portal', '/demo'].includes(window.location.pathname.replace(/\/$/, ''))) return <WebWorkspace mode={window.location.pathname.startsWith('/portal') ? 'portal' : 'demo'} />;

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <StatusBar style="dark" />
        <View style={styles.app}>
        {booting ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>{bootError ? <><Text>{bootError}</Text><Pressable onPress={() => setRetry(value => value + 1)}><Text>Thử lại</Text></Pressable></> : <ActivityIndicator color="#6C5CE7" />}</View> : <>
        {screen === 'onboarding' && <OnboardingScreen onDone={() => setScreen('auth')} />}
        {screen === 'auth' && (
          <AuthScreen
            onLogin={() => setScreen('main')}
            onRegister={(email) => {
              setVerificationEmail(email);
              if (Platform.OS === 'web') { try { sessionStorage.setItem('gomate.verificationEmail', email); } catch { /* Optional draft. */ } window.history.pushState(null, '', '#/auth/verify'); }
              setScreen('verify');
            }}
          />
        )}
        {screen === 'verify' && (
          <VerifyEmailScreen email={verificationEmail} onBack={() => setScreen('auth')} onVerified={() => { try { sessionStorage.removeItem('gomate.verificationEmail'); } catch { /* Optional draft. */ } setScreen('main'); }} />
        )}
        {screen === 'profile' && (
          <ProfileScreen
            onFinish={() => setScreen('permissions')}
            onSkip={() => setScreen('permissions')}
          />
        )}
        {screen === 'permissions' && <OnboardingPermissionsScreen onDone={() => setScreen('main')} />}
        {screen === 'main' && <RoleGate onLogout={() => setScreen('auth')} />}
        </>}
        </View>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

function RoleGate({ onLogout }: { onLogout: () => void }) {
  const [ready, setReady] = useState(false), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    api<{ role: string; email?: string }>('/portal/me').then(user => {
      if (!alive) return;
      if (Platform.OS === 'web' && ['admin', 'staff', 'business'].includes(user.role) && !window.location.hash.startsWith('#/app/')) {
        window.location.replace('/' + user.role);
      } else if (['admin', 'staff', 'business'].includes(user.role) && Platform.OS !== 'web') {
        setError('Vui lòng mở trang /' + user.role + ' trên website GoMate để sử dụng không gian làm việc.');
      } else setReady(true);
    }).catch(reason => { if (alive) setError(reason.message); });
    return () => { alive = false; };
  }, [retry]);
  if (ready) return <MainApp onLogout={onLogout} />;
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>{error ? <><Text>{error}</Text><Pressable onPress={() => { setError(''); setRetry(v => v + 1); }}><Text>Thử lại</Text></Pressable><Pressable onPress={onLogout}><Text>Về đăng nhập</Text></Pressable></> : <ActivityIndicator accessibilityLabel="Đang kiểm tra quyền truy cập" />}</View>;
}

const styles = StyleSheet.create({ app: { flex: 1, width: '100%', alignSelf: 'center', maxWidth: 1440, backgroundColor: '#F8F9FC' } });
