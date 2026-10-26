import { ComponentProps, useState } from 'react';
import { useFeedbackState } from '../services/feedback';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '../components/FormField';
import { GradientButton } from '../components/GradientButton';
import { Text } from '../components/LocalizedText';
import { useLanguage } from '../i18n/LanguageContext';
import { colors, layout, radii, typography } from '../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const interests: { icon: IconName; label: string }[] = [
  { icon: 'cafe-outline', label: 'Coffee' }, { icon: 'restaurant-outline', label: 'Food' },
  { icon: 'fitness-outline', label: 'Sports' }, { icon: 'football-outline', label: 'Football' },
  { icon: 'airplane-outline', label: 'Travel' }, { icon: 'trail-sign-outline', label: 'Trekking' },
  { icon: 'film-outline', label: 'Movies' }, { icon: 'musical-notes-outline', label: 'Concerts' },
  { icon: 'dice-outline', label: 'Board games' }, { icon: 'book-outline', label: 'Study' },
  { icon: 'game-controller-outline', label: 'Gaming' }, { icon: 'camera-outline', label: 'Photography' },
];

export function ProfileScreen({ onFinish, onSkip }: { onFinish: () => void; onSkip: () => void }) {
  const { language } = useLanguage();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('Ho Chi Minh City');
  const [selected, setSelected] = useState<Set<string>>(() => new Set(['Coffee', 'Travel']));
  const [avatarUri, setAvatarUri] = useState<string>();
  const [, setPhotoError] = useFeedbackState('');

  const pickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], mediaTypes: ['images'], quality: 0.85, base64: true });
      if (!result.canceled) {
        const asset = result.assets[0], value = asset.base64;
        if (!value || (asset.fileSize ?? 0) > 10 * 1024 * 1024 || value.length * 3 / 4 - (value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0) > 10 * 1024 * 1024) throw new Error('Mỗi ảnh tối đa 10 MB.');
        setAvatarUri(asset.uri);
      }
    } catch (reason) { setPhotoError(reason instanceof Error ? reason.message : 'Không chọn được ảnh.'); }
  };

  const toggle = (label: string) => setSelected((current) => { const next = new Set(current); if (next.has(label)) next.delete(label); else next.add(label); return next; });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <View style={styles.headerSide}>{step === 2 && <Pressable onPress={() => setStep(1)} style={styles.iconButton}><Ionicons color={colors.text} name="chevron-back" size={24} /></Pressable>}</View>
          <Text style={styles.headerTitle}>{step === 1 ? 'Create profile' : 'Your interests'}</Text>
          <Pressable onPress={onSkip} style={styles.headerSide}><Text style={styles.skip}>Skip</Text></Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.page}>
            {step === 1 ? (
              <>
                <View style={styles.avatarArea}>
                  <Pressable onPress={pickAvatar} style={styles.avatarButton}>
                    {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.avatar} /> : <View style={styles.avatarPlaceholder}><Ionicons color={colors.white} name="camera-outline" size={27} /></View>}
                  </Pressable>
                  <Text style={styles.addPhoto}>Add a photo</Text>
                </View>
                <View style={styles.fields}>
                  <FormField label="Full name" onChangeText={setName} placeholder="Your full name" value={name} />
                  <FormField label="Username" onChangeText={setUsername} placeholder="@username" value={username} />
                  <FormField label="Bio" multiline onChangeText={setBio} placeholder="A short introduction about you" value={bio} />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.title}>What are you into?</Text>
                <Text style={styles.subtitle}>Pick a few interests so GoMate can recommend activities that fit you.</Text>
                <Text style={styles.sectionLabel}>INTERESTS</Text>
                <View style={styles.chips}>{interests.map((item) => { const active = selected.has(item.label); return <Pressable key={item.label} onPress={() => toggle(item.label)} style={[styles.chip, active && styles.activeChip]}><Ionicons color={active ? colors.white : colors.textSecondary} name={item.icon} size={14} /><Text style={[styles.chipText, active && styles.activeChipText]}>{item.label}</Text></Pressable>; })}</View>
                <Text style={styles.sectionLabel}>LOCATION</Text>
                <View style={styles.locationCard}><Ionicons color={colors.primary} name="location" size={20} /><View style={styles.locationCopy}><Text style={styles.locationLabel}>Current area</Text><Text style={styles.locationValue}>{location}</Text></View><Pressable onPress={() => setLocation(location === 'Ho Chi Minh City' ? 'Ha Noi' : 'Ho Chi Minh City')}><Text style={styles.change}>Change</Text></Pressable></View>
              </>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}><GradientButton label={step === 1 ? 'Continue' : language === 'vi' ? `Hoàn tất · đã chọn ${selected.size}` : `Finish · ${selected.size} selected`} onPress={() => step === 1 ? setStep(2) : onFinish()} trailing={null} /></View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  flex: { flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', height: 56, paddingHorizontal: 12 },
  headerSide: { alignItems: 'center', justifyContent: 'center', width: 54 },
  iconButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  headerTitle: { color: colors.text, flex: 1, textAlign: 'center', ...typography.heading },
  skip: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  scrollContent: { flexGrow: 1, paddingBottom: 24 },
  page: { alignSelf: 'center', maxWidth: layout.maxWidth, paddingHorizontal: 16, paddingTop: 34, width: '100%' },
  avatarArea: { alignItems: 'center' },
  avatarButton: { borderRadius: 49, height: 98, overflow: 'hidden', width: 98 },
  avatar: { height: '100%', width: '100%' },
  avatarPlaceholder: { alignItems: 'center', backgroundColor: colors.primary, flex: 1, justifyContent: 'center' },
  addPhoto: { color: colors.primary, fontSize: 13, fontWeight: '500', lineHeight: 18, marginTop: 10 },
  fields: { gap: 18, marginTop: 36 },
  title: { color: colors.text, ...typography.title },
  subtitle: { color: colors.textSecondary, marginTop: 6, maxWidth: 340, ...typography.body },
  sectionLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.1, marginBottom: 10, marginTop: 30 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  chip: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.pill, borderWidth: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 9 },
  activeChip: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '500' },
  activeChipText: { color: colors.white },
  locationCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.input, borderWidth: 1, flexDirection: 'row', padding: 14 },
  locationCopy: { flex: 1, marginLeft: 10 },
  locationLabel: { color: colors.textMuted, fontSize: 10 },
  locationValue: { color: colors.text, fontSize: 13, fontWeight: '600', marginTop: 3 },
  change: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  footer: { backgroundColor: colors.background, paddingBottom: 12, paddingHorizontal: 16, paddingTop: 10 },
});
