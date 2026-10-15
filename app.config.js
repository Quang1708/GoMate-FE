module.exports = ({ config }) => {
  // Native Google sign-in is opt-in until provider credentials are supplied.
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  const enabled = process.env.EXPO_PUBLIC_GOOGLE_NATIVE_ENABLED === 'true';
  return { ...config, plugins: [...(config.plugins || []), 'expo-secure-store', ...(enabled && iosClientId ? [[
    '@react-native-google-signin/google-signin',
    { iosUrlScheme: iosClientId.split('.').reverse().join('.') },
  ]] : [])] };
};
