import { useFeedbackState } from '../services/feedback';
import { ComponentProps, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { FormField } from '../components/FormField';
import { Text } from '../components/LocalizedText';
import { GradientButton } from '../components/GradientButton';
import { RemoteState } from '../components/RemoteState';
import { ScreenHeader } from '../components/ScreenHeader';
import { genderOptions, OptionChips } from '../components/ActivityChoices';
import { BirthDateField, InterestField, LanguageField, RegionField } from '../components/ProfilePickers';
import { ProfileCoverEditor } from '../components/ProfileCoverEditor';
import { ProfilePhotoEditor } from '../components/ProfilePhotoEditor';
import { useProfile } from '../services/ProfileContext';
import { imageUrl, missingFieldLabels, ProfileDraft, saveProfile, uploadAvatar, UserProfile } from '../services/profileService';
import { birthDateDisplay, birthDateIso } from '../services/profileDate';
import { availableTimes, companionGoals, educationOptions, normalizeRegion, profileRegions } from '../data/profileOptions';
import { colors, layout } from '../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];
export function EditProfileScreen({ onBack, onSaved, required = false }: { onBack: () => void; onSaved: () => void; required?: boolean }) {
  const remote = useProfile();
  return <SafeAreaView style={styles.safe}><ScreenHeader title={required ? 'Hoàn thiện hồ sơ' : 'Hồ sơ GoMate'} onBack={required ? undefined : onBack} right={required ? <Pressable accessibilityRole="button" onPress={onBack}><Text style={styles.link}>Đăng xuất</Text></Pressable> : undefined} />
    {remote.loading || remote.error || !remote.profile ? <RemoteState loading={remote.loading} error={remote.error} onRetry={remote.reload} /> : <ProfileForm profile={remote.profile} required={required} onSaved={async () => { await remote.reload(); onSaved(); }} />}
  </SafeAreaView>;
}
function ProfileForm({ profile, required, onSaved }: { profile: UserProfile; required: boolean; onSaved: () => Promise<void> }) {
  const remote = useProfile();
  const [draft, setDraft] = useState<ProfileDraft>(() => ({
    name: profile.name, username: profile.username, bio: profile.bio, location: normalizeRegion(profile.location), interests: profile.interests,
    languages: profile.languages.length ? profile.languages : ['Tiếng Việt'], gender: profile.gender, religion: profile.religion, alcohol: profile.alcohol, birthDate: birthDateDisplay(profile.birthDate),
    occupation: profile.occupation || '', education: profile.education || '', school: profile.school || '', companionGoal: profile.companionGoal || '', availableTimes: profile.availableTimes || [], activityWish: profile.activityWish || '', contribution: profile.contribution || ''
  }));
  const [step, setStep] = useState<'basic' | 'companion' | 'all'>(() => required ? profile.basicProfileComplete ? 'companion' : 'basic' : 'all');
  const [preview, setPreview] = useState(false);
  const [photo, setPhoto] = useState<{ uri: string; base64: string } | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useFeedbackState('');
  const lock = useRef(false);
  const patch = (value: Partial<ProfileDraft>) => setDraft(current => ({ ...current, ...value }));
  const choosePhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], mediaTypes: ['images'], quality: 0.7, base64: true });
      if (!result.canceled) {
        const asset = result.assets[0];
        if (!asset.base64 || (asset.fileSize ?? 0) > 10 * 1024 * 1024 || asset.base64.length * 3 / 4 - (asset.base64.endsWith('==') ? 2 : asset.base64.endsWith('=') ? 1 : 0) > 10 * 1024 * 1024) throw new Error('Mỗi ảnh tối đa 10 MB.');
        setPhoto({ uri: asset.uri, base64: asset.base64 }); setError('');
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không chọn được ảnh'); }
  };
  const save = async () => {
    if (photoBusy || coverBusy) { setError('Đợi ảnh hồ sơ lưu xong rồi tiếp tục.'); return; }
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const birthDate = birthDateIso(draft.birthDate);
      if (draft.name.trim().length < 2) throw new Error('Vui lòng nhập họ tên.');
      if (!draft.gender) throw new Error('Vui lòng chọn giới tính.');
      if (!profileRegions.includes(draft.location)) throw new Error('Vui lòng chọn tỉnh / thành phố.');
      if (!draft.languages.length) throw new Error('Vui lòng chọn ngôn ngữ.');
      if (step !== 'basic' && !draft.bio.trim()) throw new Error('Vui lòng nhập giới thiệu.');
      if (step !== 'basic' && !draft.interests.length) throw new Error('Vui lòng chọn sở thích.');
      let updated = await saveProfile({ ...draft, birthDate });
      if (photo) { updated = await uploadAvatar(photo.base64); setPhoto(null); }
      remote.update(updated);
      if (step === 'basic') { setStep('companion'); return; }
      await onSaved();
    } catch (reason) { setPreview(false); setError(reason instanceof Error ? reason.message : 'Không lưu được hồ sơ'); }
    finally { lock.current = false; setBusy(false); }
  };
  const avatar = photo?.uri || (profile.avatarUrl ? imageUrl(profile.avatarUrl) : null);
  let previewBirthDate = ''; try { previewBirthDate = birthDateIso(draft.birthDate); } catch { /* Incomplete dates are omitted from the preview. */ }
  const previewProfile = { ...profile, ...draft, birthDate: previewBirthDate, avatarUrl: avatar };
  return <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    {required && <View style={styles.intro}><Text style={styles.eyebrow}>BƯỚC {step === 'basic' ? '1' : '2'} / 2</Text><Text style={styles.title}>{step === 'basic' ? 'Bắt đầu từ những điều cơ bản' : 'Để người đồng hành hiểu bạn hơn'}</Text><Text style={styles.note}>{step === 'basic' ? 'Cho GoMate biết bạn là ai và đang ở đâu.' : 'Chia sẻ sở thích, trải nghiệm và điều bạn muốn làm cùng mọi người.'}</Text></View>}
    {step !== 'basic' && <View style={styles.tabs}><Pressable disabled={photoBusy || coverBusy || busy} accessibilityRole="tab" aria-selected={!preview} accessibilityState={{ selected: !preview }} onPress={() => setPreview(false)} style={[styles.tab, !preview && styles.activeTab]}><Text style={styles.link}>Chỉnh sửa hồ sơ</Text></Pressable><Pressable disabled={photoBusy || coverBusy || busy} accessibilityRole="tab" aria-selected={preview} accessibilityState={{ selected: preview }} onPress={() => setPreview(true)} style={[styles.tab, preview && styles.activeTab]}><Text style={styles.link}>Xem trước hồ sơ</Text></Pressable></View>}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {preview ? <ProfilePreview profile={previewProfile} /> : <>
      <View style={styles.avatarArea}>{avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.initial}>{draft.name.charAt(0)}</Text></View>}<Pressable disabled={busy} accessibilityRole="button" onPress={() => void choosePhoto()}><Text style={styles.link}>Chọn ảnh đại diện</Text></Pressable></View>
      {step !== 'companion' && <View style={styles.card}><Text style={styles.title}>Thông tin cơ bản</Text>
        <FormField label="Họ và tên" value={draft.name} onChangeText={name => patch({ name })} />
        <FormField label="Nickname (không bắt buộc)" value={draft.username} onChangeText={username => patch({ username })} placeholder="" />
        <BirthDateField value={draft.birthDate} onChange={birthDate => patch({ birthDate })} />
        <OptionChips label="Giới tính" options={genderOptions} selected={[draft.gender]} single onChange={values => patch({ gender: values[0] || 'undisclosed' })} />
        <RegionField value={draft.location} onChange={location => patch({ location })} />
        <LanguageField value={draft.languages} onChange={languages => patch({ languages })} />
      </View>}
      {step !== 'basic' && <>
        <View style={styles.card}><ProfileCoverEditor onBusyChange={setCoverBusy} /></View>
        <View style={styles.card}><ProfilePhotoEditor onBusyChange={setPhotoBusy} /></View>
        <View style={styles.card}><Text style={styles.title}>Giới thiệu</Text><Text style={styles.note}>Bạn thích trải nghiệm gì? Bạn muốn gặp những người đồng hành như thế nào?</Text><FormField label="Giới thiệu" multiline value={draft.bio} onChangeText={bio => patch({ bio: bio.slice(0, 500) })} placeholder="Ví dụ: Mình thích chạy bộ, cà phê và khám phá những nơi mới." /><Text style={styles.note}>{draft.bio.length}/500</Text></View>
        <View style={styles.card}><InterestField value={draft.interests} onChange={interests => patch({ interests })} /></View>
        <View style={styles.card}><Text style={styles.title}>Đồng hành cùng GoMate</Text><Text style={styles.note}>Thêm một vài gợi ý để mọi người dễ rủ bạn tham gia hơn.</Text>
          <OptionChips label="Bạn đang tìm kiếm điều gì?" options={companionGoals.map(value => [value, value] as const)} selected={draft.companionGoal ? [draft.companionGoal] : []} single onChange={values => patch({ companionGoal: values[0] || '' })} />
          <OptionChips label="Thời gian thường rảnh" options={availableTimes.map(value => [value, value] as const)} selected={draft.availableTimes} onChange={values => patch({ availableTimes: values })} />
          <FormField label="Một hoạt động tôi muốn thử" value={draft.activityWish} onChangeText={activityWish => patch({ activityWish: activityWish.slice(0, 300) })} placeholder="Ví dụ: Cắm trại qua đêm cùng một nhóm nhỏ" multiline />
          <FormField label="Điều tôi có thể chia sẻ với nhóm" value={draft.contribution} onChangeText={contribution => patch({ contribution: contribution.slice(0, 300) })} placeholder="Kinh nghiệm, kỹ năng hoặc một câu chuyện thú vị" multiline />
        </View>
        <View style={styles.card}><Text style={styles.title}>Công việc và học vấn</Text><Text style={styles.note}>Không bắt buộc · chỉ chia sẻ những gì bạn thấy thoải mái.</Text>
          <FormField label="Công việc" value={draft.occupation || ''} onChangeText={occupation => patch({ occupation })} placeholder="Bạn đang làm gì?" />
          <FormField label="Trường học" value={draft.school} onChangeText={school => patch({ school })} placeholder="Trường đại học / cao đẳng / trường nghề" />
          <OptionChips label="Học vấn" options={educationOptions.map(value => [value, value] as const)} selected={draft.education ? [draft.education] : []} single onChange={values => patch({ education: values[0] || '' })} />
        </View>
      </>}
    </>}
    {required && step === 'companion' && <Pressable disabled={busy} accessibilityRole="button" onPress={() => setStep('basic')}><Text style={styles.link}>Chỉnh lại thông tin cơ bản</Text></Pressable>}
    <GradientButton label={busy ? 'Đang lưu...' : step === 'basic' ? 'Tiếp tục' : required ? 'Hoàn tất hồ sơ' : 'Lưu hồ sơ'} onPress={() => void save()} />
  </ScrollView>;
}

export function ProfilePreview({ profile }: { profile: UserProfile }) {
  const [today] = useState(() => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10));
  const age = profile.birthDate ? Number(today.slice(0, 4)) - Number(profile.birthDate.slice(0, 4)) - (today.slice(5) < profile.birthDate.slice(5) ? 1 : 0) : null;
  const lead = profile.photos?.[0]?.url || profile.avatarUrl || profile.coverUrl;
  return <View style={{ gap: 16 }}>
    {profile.coverUrl && <Image source={{ uri: imageUrl(profile.coverUrl) }} style={{ width: '100%', aspectRatio: 8 / 3, borderRadius: 18 }} />}
    {lead ? <Image source={{ uri: imageUrl(lead) }} style={styles.previewHero} /> : <View style={[styles.previewHero, styles.emptyHero]}><Ionicons name="person-outline" size={70} color={colors.primaryLight} /></View>}
    <View style={styles.card}><Text style={styles.profileName}>{profile.name}{age !== null && Number.isFinite(age) ? `, ${age}` : ''}</Text>{profile.username ? <Text style={styles.note}>@{profile.username}</Text> : null}<Text>{profile.bio || 'Thêm một lời giới thiệu về bạn.'}</Text>
      <InfoLine icon="location-outline" text={profile.location} />{profile.companionGoal ? <InfoLine icon="people-outline" text={profile.companionGoal} /> : null}<InfoLine icon="chatbubbles-outline" text={profile.languages.join(' · ')} />
      {profile.occupation ? <InfoLine icon="briefcase-outline" text={profile.occupation} /> : null}{profile.school || profile.education ? <InfoLine icon="school-outline" text={[profile.school, profile.education].filter(Boolean).join(' · ')} /> : null}
    </View>
    <View style={styles.card}><Text style={styles.title}>Sở thích của tôi</Text><View style={styles.chips}>{profile.interests.map(interest => <View key={interest} style={styles.chip}><Text style={styles.link}>{interest}</Text></View>)}</View></View>
    {Boolean(profile.availableTimes?.length) && <View style={styles.card}><Text style={styles.title}>Thường rảnh vào</Text><Text>{profile.availableTimes.join(' · ')}</Text></View>}
    {profile.activityWish ? <View style={styles.card}><Text style={styles.eyebrow}>MỘT HOẠT ĐỘNG TÔI MUỐN THỬ</Text><Text style={styles.quote}>{profile.activityWish}</Text></View> : null}
    {profile.contribution ? <View style={styles.card}><Text style={styles.eyebrow}>TÔI CÓ THỂ CHIA SẺ VỚI NHÓM</Text><Text style={styles.quote}>{profile.contribution}</Text></View> : null}
    {(profile.photos ?? []).slice(1).map(photo => <Image key={photo.id} source={{ uri: imageUrl(photo.url) }} style={styles.previewHero} />)}
  </View>;
}
function InfoLine({ icon, text }: { icon: IconName; text: string }) { return text ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Ionicons name={icon} size={20} color={colors.primary} /><Text style={{ flex: 1 }}>{text}</Text></View> : null; }

export function UserProfileScreen({ onEdit, onPreview, onVerification, onReviews, onMyActivities, onNotifications, onSettings, onFriends }: { onEdit: () => void; onPreview: () => void; onVerification: () => void; onReviews: () => void; onMyActivities: () => void; onFriends: () => void; onNotifications: () => void; onSettings: () => void }) {
  const remote = useProfile(), profile = remote.profile;
  const menu: { label: string; icon: IconName; action: () => void }[] = [
    { label: 'Xác minh tài khoản', icon: 'shield-checkmark-outline', action: onVerification }, { label: 'Điểm đánh giá của tôi', icon: 'star-outline', action: onReviews },
    { label: 'Bạn bè', icon: 'people-outline', action: onFriends }, { label: 'Hoạt động của tôi', icon: 'calendar-outline', action: onMyActivities }, { label: 'Thông báo', icon: 'notifications-outline', action: onNotifications }, { label: 'Cài đặt', icon: 'settings-outline', action: onSettings },
  ];
  return <ScrollView contentContainerStyle={styles.page}><Text style={styles.title}>Hồ sơ của tôi</Text><RemoteState loading={remote.loading} error={remote.error} onRetry={remote.reload} />
    {profile && !remote.loading && !remote.error && <>
      <View style={styles.card}>{profile.coverUrl && <Image source={{ uri: imageUrl(profile.coverUrl) }} style={{ width: '100%', aspectRatio: 8 / 3, borderRadius: 16, marginBottom: 12 }} />}<View style={styles.avatarArea}>{profile.avatarUrl ? <Image source={{ uri: imageUrl(profile.avatarUrl) }} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.initial}>{profile.name.charAt(0)}</Text></View>}<Text style={styles.profileName}>{profile.name}</Text>{profile.username ? <Text style={styles.note}>@{profile.username}</Text> : null}<Text>{profile.location || 'Chưa chọn khu vực'}</Text></View>
        {!profile.profileComplete && <Text style={styles.note}>Cần bổ sung: {profile.missingFields.map(key => missingFieldLabels[key] || key).join(', ')}.</Text>}
        <Text style={styles.note}>{profile.bio || 'Chia sẻ một chút về bạn với người đồng hành.'}</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>{([{ label: 'Chỉnh sửa hồ sơ', icon: 'create-outline', action: onEdit }, { label: 'Xem trước hồ sơ', icon: 'eye-outline', action: onPreview }] as const).map(item => <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.label} onPress={item.action} style={{ flex: 1, backgroundColor: colors.primarySoft, borderRadius: 14, padding: 12, alignItems: 'center', gap: 7 }}><Ionicons name={item.icon} size={20} color={colors.primary} /><Text style={[styles.link, { textAlign: 'center' }]}>{item.label}</Text></Pressable>)}</View>
      </View>
      <View style={styles.menu}>{menu.map(item => <Pressable accessibilityRole="button" accessibilityLabel={item.label} key={item.label} onPress={item.action} style={styles.menuRow}><View style={styles.menuIcon}><Ionicons name={item.icon} size={22} color={colors.primary} /></View><Text style={styles.menuLabel}>{item.label}</Text><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></Pressable>)}</View>
    </>}
  </ScrollView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, page: { alignSelf: 'center', maxWidth: Math.min(layout.maxWidth, 800), width: '100%', padding: 18, gap: 18, paddingBottom: 40 },
  card: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 18, borderRadius: 22, gap: 16 }, intro: { gap: 8, paddingVertical: 8 }, eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  avatarArea: { alignItems: 'center', gap: 10 }, avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  initial: { color: colors.primary, fontSize: 30, fontWeight: '700' }, title: { color: colors.text, fontSize: 21, fontWeight: '700' }, profileName: { fontSize: 27, fontWeight: '800', color: colors.text },
  link: { color: colors.primary, fontWeight: '600' }, note: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 }, error: { color: colors.danger }, tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border }, tab: { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 3, borderBottomColor: 'transparent' }, activeTab: { borderBottomColor: colors.primary },
  previewHero: { width: '100%', aspectRatio: 0.9, maxHeight: 620, borderRadius: 24 }, emptyHero: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { backgroundColor: colors.primarySoft, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9 }, quote: { color: colors.text, fontSize: 21, lineHeight: 30 },
  menu: { backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }, menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, minHeight: 68, borderBottomWidth: 1, borderBottomColor: colors.border }, menuIcon: { backgroundColor: colors.primarySoft, width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
});
