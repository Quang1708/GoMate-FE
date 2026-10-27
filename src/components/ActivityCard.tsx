import { ImageBackground, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Activity } from '../data/activities';
import { useLanguage } from '../i18n/LanguageContext';
import { colors, radii, typography } from '../theme';
import { Text } from './LocalizedText';
import { BusinessIdentity } from './BusinessIdentity';

type SwipeActivityCardProps = {
  activity: Activity;
  height: number;
  fullScreen?: boolean;
};

export function SwipeActivityCard({ activity, height, fullScreen = false }: SwipeActivityCardProps) {
  const { language } = useLanguage();
  return (
    <View style={[styles.card, fullScreen && styles.fullScreenCard, { height }]}>
      <ImageBackground imageStyle={fullScreen ? undefined : styles.image} source={activity.image} style={styles.cover}>
        <LinearGradient colors={[colors.overlaySubtle, colors.overlayLight, colors.overlayHeavy]} locations={[0, 0.48, 1]} style={styles.overlay}>
          <View style={styles.topRow}>
            <View style={styles.category}><Text style={styles.categoryText}>{activity.category}</Text></View>
            <View style={styles.distance}><Ionicons color={colors.white} name="navigate" size={14} /><Text style={styles.distanceText}>{activity.distance}</Text></View>
          </View>

          <View style={styles.summary}>
            <BusinessIdentity activity={activity} />
            <Text style={styles.title}>{activity.title}</Text>
            <View style={styles.hostRow}>
              <View style={styles.hostAvatar}><Text style={styles.hostInitial}>{activity.host.charAt(0)}</Text></View>
              <Text style={styles.hostName}>{language === 'vi' ? 'Host: ' : 'Hosted by '}{activity.host}</Text>
              <Ionicons color={colors.success} name="checkmark-circle" size={17} />
            </View>
            <View style={styles.metaGrid}>
              <Meta icon="calendar-outline" text={activity.time} />
              <Meta icon="location-outline" text={activity.location} />
              <Meta icon="people-outline" text={`${activity.members} ${language === 'vi' ? 'thành viên' : 'members'}`} />
              {activity.organizerType === 'business' && <Meta icon="wallet-outline" text={activity.estimatedCost} />}
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

function Meta({ icon, text }: { icon: 'calendar-outline' | 'location-outline' | 'people-outline' | 'wallet-outline'; text: string }) {
  return <View style={styles.meta}><Ionicons color="rgba(255,255,255,0.82)" name={icon} size={15} /><Text numberOfLines={1} style={styles.metaText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.largeCard, overflow: 'hidden', width: '100%' },
  fullScreenCard: { borderRadius: 0 },
  cover: { flex: 1 },
  image: { borderRadius: radii.largeCard },
  overlay: { flex: 1, justifyContent: 'space-between', padding: 18 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  category: { backgroundColor: colors.white, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 7 },
  categoryText: { color: colors.primary, fontSize: 11, fontWeight: '700', lineHeight: 16 },
  distance: { alignItems: 'center', backgroundColor: colors.overlayMedium, borderRadius: radii.pill, flexDirection: 'row', gap: 5, paddingHorizontal: 10, paddingVertical: 7 },
  distanceText: { color: colors.white, fontSize: 11, fontWeight: '600' },
  summary: { paddingBottom: 96 },
  title: { color: colors.white, ...typography.display },
  hostRow: { alignItems: 'center', flexDirection: 'row', marginTop: 10 },
  hostAvatar: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
  hostInitial: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  hostName: { color: colors.white, fontSize: 13, fontWeight: '600', marginLeft: 8, marginRight: 5 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, rowGap: 9 },
  meta: { alignItems: 'center', flexDirection: 'row', width: '50%' },
  metaText: { color: colors.whiteMuted, flex: 1, fontSize: 11.5, lineHeight: 16, marginLeft: 6, paddingRight: 8 },
});
