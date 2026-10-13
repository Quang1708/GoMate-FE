import { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { FormField } from '../components/FormField';
import { Text } from '../components/LocalizedText';
import { GradientButton } from '../components/GradientButton';
import { RemoteState } from '../components/RemoteState';
import { ScreenHeader } from '../components/ScreenHeader';
import { genderOptions, interestOptions, languageOptions, OptionChips, religionOptions } from '../components/ActivityChoices';
import { useProfile } from '../services/ProfileContext';
import { imageUrl, missingFieldLabels, ProfileDraft, saveProfile, uploadAvatar, UserProfile } from '../services/profileService';
import { colors, layout } from '../theme';

export function EditProfileScreen({ onBack, onSaved }: { onBack: () => void; onSaved: () => void }) {
  const remote = useProfile();
  return <SafeAreaView style={styles.safe}><ScreenHeader title="Chỉnh sửa hồ sơ" onBack={onBack} />
    {remote.loading || remote.error || !remote.profile ? <RemoteState loading={remote.loading} error={remote.error} onRetry={remote.reload} /> : <ProfileForm profile={remote.profile} onSaved={async () => { await remote.reload(); onSaved(); }} />}
  </SafeAreaView>;
}

function ProfileForm({ profile, onSaved }: { profile: UserProfile; onSaved: () => Promise<void> }) {
  const [draft, setDraft] = useState<ProfileDraft>(() => ({ name: profile.name, username: profile.username, bio: profile.bio, location: profile.location, interests: profile.interests,
    languages: profile.languages, gender: profile.gender, religion: profile.religion, alcohol: profile.alcohol, birthDate: profile.birthDate }));
  const [photo, setPhoto] = useState<{ uri: string; base64: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const lock = useRef(false);
  const patch = (value: Partial<ProfileDraft>) => setDraft(current => ({ ...current, ...value }));
  const choosePhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], mediaTypes: ['images'], quality: 0.7, base64: true });
      if (!result.canceled) {
        const asset = result.assets[0];
        if (!asset.base64 || asset.base64.length > 2796204) throw new Error('Chọn ảnh JPEG/PNG/WebP tối đa 2 MB.');
        setPhoto({ uri: asset.uri, base64: asset.base64 }); setError('');
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không chọn được ảnh'); }
  };
  const save = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      await saveProfile(draft);
      if (photo) { try { await uploadAvatar(photo.base64); } catch (reason) { throw new Error(`Thông tin đã lưu, nhưng chưa tải được ảnh: ${reason instanceof Error ? reason.message : ''}`); } }
      await onSaved();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không lưu được hồ sơ'); }
    finally { lock.current = false; setBusy(false); }
  };
  const avatar = photo?.uri || (profile.avatarUrl ? imageUrl(profile.avatarUrl) : null);
  return <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <View style={styles.avatarArea}>{avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.initial}>{draft.name.charAt(0)}</Text></View>}<Pressable disabled={busy} onPress={() => void choosePhoto()}><Text style={styles.link}>Chọn ảnh đại diện</Text></Pressable></View>
    <Text style={styles.note}>Hoàn thiện họ tên, khu vực, giới thiệu, sở thích và ngôn ngữ. Các thông tin cá nhân nâng cao đều không bắt buộc.</Text>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <View style={styles.card}>
      <FormField label="Họ và tên" value={draft.name} onChangeText={name => patch({ name })} />
      <FormField label="Tên người dùng (không bắt buộc)" value={draft.username} onChangeText={username => patch({ username })} placeholder="gomate_user" />
      <FormField label="Khu vực" value={draft.location} onChangeText={location => patch({ location })} placeholder="Quận 1, TP. Hồ Chí Minh" />
      <FormField label="Giới thiệu" multiline value={draft.bio} onChangeText={bio => patch({ bio })} placeholder="Bạn thích trải nghiệm gì cùng người đồng hành?" />
      <OptionChips label="Sở thích" options={interestOptions} selected={draft.interests} onChange={interests => patch({ interests })} />
      <OptionChips label="Ngôn ngữ giao tiếp" options={languageOptions} selected={draft.languages} onChange={languages => patch({ languages })} />
    </View>
    <Pressable style={styles.card} accessibilityState={{ expanded: advanced }} onPress={() => setAdvanced(!advanced)}><Text style={styles.link}>Thông tin cá nhân nâng cao {advanced ? '−' : '+'}</Text></Pressable>
    {advanced && <View style={styles.card}>
      <OptionChips label="Giới tính" options={genderOptions} selected={[draft.gender]} single onChange={values => patch({ gender: values[0] })} />
      <FormField label="Ngày sinh (không bắt buộc)" placeholder="YYYY-MM-DD" value={draft.birthDate} onChangeText={birthDate => patch({ birthDate })} />
      <OptionChips label="Quan điểm tôn giáo" options={religionOptions} selected={[draft.religion]} single onChange={values => patch({ religion: values[0] })} />
      <OptionChips label="Khả năng uống rượu" options={[[ 'yes', 'Có thể uống' ], ['no', 'Không uống'], ['undisclosed', 'Không tiết lộ']]} selected={[draft.alcohol]} single onChange={values => patch({ alcohol: values[0] })} />
    </View>}
    <GradientButton label={busy ? 'Đang lưu...' : 'Lưu hồ sơ'} onPress={() => void save()} />
  </ScrollView>;
}

export function UserProfileScreen({ onEdit, onMyActivities, onNotifications, onSettings }: { onEdit: () => void; onMyActivities: () => void; onNotifications: () => void; onSettings: () => void }) {
  const remote = useProfile(); const profile = remote.profile;
  return <ScrollView contentContainerStyle={styles.page}><View style={styles.heading}><Text style={styles.title}>Hồ sơ của tôi</Text><Pressable onPress={onSettings}><Text style={styles.link}>Cài đặt</Text></Pressable></View>
    <RemoteState loading={remote.loading} error={remote.error} onRetry={remote.reload} />
    {profile && !remote.loading && !remote.error && <>
      {profile.coverUrl ? <Image source={{ uri: imageUrl(profile.coverUrl) }} style={{ width: '100%', height: 160, borderRadius: 20 }} /> : null}
      <View style={styles.card}><View style={styles.avatarArea}>{profile.avatarUrl ? <Image source={{ uri: imageUrl(profile.avatarUrl) }} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.initial}>{profile.name.charAt(0)}</Text></View>}
        <Text style={styles.title}>{profile.name}</Text>{profile.username ? <Text>@{profile.username}</Text> : null}<Text>{profile.location || 'Chưa có khu vực'}</Text></View>
        <Text>{profile.bio || 'Chưa có giới thiệu'}</Text><Text>Sở thích: {profile.interests.join(', ') || 'Chưa chọn'}</Text><Text>Ngôn ngữ: {profile.languages.join(', ') || 'Chưa chọn'}</Text>
        {profile.occupation ? <Text>Nghề nghiệp: {profile.occupation}</Text> : null}
        {profile.demo ? <Text style={styles.note}>Hồ sơ demo hư cấu · ảnh minh họa trực tuyến</Text> : null}
        {!profile.profileComplete && <Text style={styles.note}>Cần bổ sung: {profile.missingFields.map(key => missingFieldLabels[key] || key).join(', ')}.</Text>}
        <GradientButton label={profile.profileComplete ? 'Chỉnh sửa hồ sơ' : 'Hoàn thiện hồ sơ'} onPress={onEdit} />
      </View>
      <Pressable style={styles.card} onPress={onMyActivities}><Text style={styles.link}>Hoạt động của tôi →</Text></Pressable>
      <Pressable style={styles.card} onPress={onNotifications}><Text style={styles.link}>Thông báo →</Text></Pressable>
    </>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, page: { alignSelf: 'center', maxWidth: layout.maxWidth, width: '100%', padding: 18, gap: 16, paddingBottom: 30 },
  card: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 18, borderRadius: 20, gap: 14 },
  avatarArea: { alignItems: 'center', gap: 10 }, avatar: { width: 86, height: 86, borderRadius: 43, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  initial: { color: colors.primary, fontSize: 30, fontWeight: '700' }, title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  link: { color: colors.primary, fontWeight: '700' }, note: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 }, error: { color: colors.danger },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
