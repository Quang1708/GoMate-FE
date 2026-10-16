import { ComponentProps, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '../components/FormField';
import { GradientButton } from '../components/GradientButton';
import { Text } from '../components/LocalizedText';
import { useLanguage } from '../i18n/LanguageContext';
import { colors, layout, radii, typography } from '../theme';
import { Profile, updateProfile, uploadAvatar } from '../services/legacyProfileService';
import { useProfile } from '../hooks/useProfile';

type IconName = ComponentProps<typeof Ionicons>['name'];

const interests: { icon: IconName; label: string }[] = [
  { icon: 'cafe-outline', label: 'Coffee' }, { icon: 'restaurant-outline', label: 'Food' },
  { icon: 'fitness-outline', label: 'Sports' }, { icon: 'football-outline', label: 'Football' },
  { icon: 'airplane-outline', label: 'Travel' }, { icon: 'trail-sign-outline', label: 'Trekking' },
  { icon: 'film-outline', label: 'Movies' }, { icon: 'musical-notes-outline', label: 'Concerts' },
  { icon: 'dice-outline', label: 'Board games' }, { icon: 'book-outline', label: 'Study' },
  { icon: 'game-controller-outline', label: 'Gaming' }, { icon: 'camera-outline', label: 'Photography' },
];

type Props = { onFinish: () => void; onSkip: () => void; editing?: boolean };

export function ProfileScreen(props: Props) {
  const { profile, error, retry } = useProfile();
  if (!profile) return <SafeAreaView style={styles.safeArea}><View style={styles.page}>
    <Text accessibilityRole="alert">{error || 'Đang tải hồ sơ…'}</Text>
    {!!error && <Pressable onPress={retry}><Text>Thử lại</Text></Pressable>}
    <Pressable onPress={props.onSkip}><Text>Quay lại / Bỏ qua</Text></Pressable>
  </View></SafeAreaView>;
  return <ProfileForm {...props} initial={profile} />;
}

function ProfileForm({ onFinish, onSkip, editing, initial }: Props & { initial: Profile }) {
  const { language } = useLanguage();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(initial.name);
  const [username, setUsername] = useState(initial.username);
  const [bio, setBio] = useState(initial.bio);
  const [location, setLocation] = useState(initial.location);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initial.interests));
  const [avatarUri, setAvatarUri] = useState<string | undefined>(initial.avatarUrl ?? undefined);
  const [avatarData, setAvatarData] = useState<string>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);

  const save = async () => {
    if (saving.current) return;
    saving.current = true; setBusy(true); setError('');
    try {
      await updateProfile({ name, username, bio, location, interests: [...selected] });
      if (avatarData) {
        try { await uploadAvatar(avatarData); }
        catch (reason) { throw new Error(`Đã lưu thông tin, nhưng ảnh chưa được lưu. ${reason instanceof Error ? reason.message : 'Vui lòng thử lại.'}`); }
      }
      onFinish();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể lưu hồ sơ.'); }
    finally { saving.current = false; setBusy(false); }
  };

  const pickAvatar = async () => {
    if (saving.current) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], mediaTypes: ['images'], quality: 0.7, base64: true });
      if (!result.canceled) {
        const asset = result.assets[0];
        if (!asset.base64 || asset.base64.length > 2796204) throw new Error('Vui lòng chọn ảnh JPEG, PNG hoặc WebP tối đa 2 MB.');
        setAvatarUri(asset.uri); setAvatarData(asset.base64); setError('');
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể chọn ảnh.'); }
  };

  const toggle = (label: string) => setSelected((current) => { const next = new Set(current); if (next.has(label)) next.delete(label); else next.add(label); return next; });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View pointerEvents={busy ? 'none' : 'auto'} style={styles.header}>
          <View style={styles.headerSide}>{step === 2 && <Pressable onPress={() => setStep(1)} style={styles.iconButton}><Ionicons color={colors.text} name="chevron-back" size={24} /></Pressable>}</View>
          <Text style={styles.headerTitle}>{step === 1 ? (editing ? 'Chỉnh sửa hồ sơ' : 'Create profile') : 'Your interests'}</Text>
          <Pressable onPress={onSkip} style={styles.headerSide}><Text style={styles.skip}>{editing ? 'Hủy' : 'Skip'}</Text></Pressable>
        </View>

        {!!error && <Text accessibilityRole="alert" style={{ paddingHorizontal: 16 }}>{error}</Text>}
        <ScrollView pointerEvents={busy ? 'none' : 'auto'} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
                <FormField label="Khu vực" onChangeText={setLocation} value={location} placeholder="Thành phố / khu vực" />
              </>
            )}
          </View>
        </ScrollView>

        <View pointerEvents={busy ? 'none' : 'auto'} style={styles.footer}><GradientButton label={busy ? 'Đang lưu…' : step === 1 ? 'Continue' : language === 'vi' ? `Lưu hồ sơ · đã chọn ${selected.size}` : `Save · ${selected.size} selected`} onPress={() => step === 1 ? setStep(2) : void save()} trailing={null} /></View>
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
