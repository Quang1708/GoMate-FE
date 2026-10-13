import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { setUnauthorizedHandler } from './src/services/api';
import { LanguageProvider } from './src/i18n/LanguageContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { MainApp } from './src/screens/MainApp';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { OnboardingPermissionsScreen } from './src/screens/OnboardingPermissionsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { VerifyEmailScreen } from './src/screens/VerifyEmailScreen';

type Screen = 'onboarding' | 'auth' | 'verify' | 'profile' | 'permissions' | 'main';

export default function App() {
  const [screen, setScreen] = useState<Screen>('onboarding');

  const [verificationEmail, setVerificationEmail] = useState('');
  useEffect(() => { setUnauthorizedHandler(() => setScreen('auth')); return () => setUnauthorizedHandler(); }, []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <StatusBar style="dark" />
        {screen === 'onboarding' && <OnboardingScreen onDone={() => setScreen('auth')} />}
        {screen === 'auth' && (
          <AuthScreen
            onLogin={() => setScreen('main')}
            onRegister={(email) => { setVerificationEmail(email); setScreen('verify'); }}
          />
        )}
        {screen === 'verify' && (
          <VerifyEmailScreen email={verificationEmail} onBack={() => setScreen('auth')} onVerified={() => setScreen('main')} />
        )}
        {screen === 'profile' && (
          <ProfileScreen
            onFinish={() => setScreen('permissions')}
            onSkip={() => setScreen('permissions')}
          />
        )}
        {screen === 'permissions' && <OnboardingPermissionsScreen onDone={() => setScreen('main')} />}
        {screen === 'main' && <MainApp onLogout={() => setScreen('auth')} />}
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
