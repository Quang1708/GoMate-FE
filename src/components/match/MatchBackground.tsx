import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

// Feathered layers keep the shapes soft on native too, where iOS view filters
// do not support Gaussian blur. Web adds a small blur to blend the feathering.
function SoftCircle({ color, size }: { color: string; size: number }) {
  return <View style={{ width: size, height: size }}>{Array.from({ length: 10 }, (_, index) => {
    const inset = index * size * 0.012;
    return <View key={index} style={{ position: 'absolute', top: inset, right: inset, bottom: inset, left: inset, borderRadius: size, backgroundColor: color, opacity: 0.13 }} />;
  })}</View>;
}

export function MatchBackground() {
  const { width } = useWindowDimensions();
  const size = Math.min(640, Math.max(320, width * 0.72));
  return <View pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.background}>
    <LinearGradient colors={['#F5F3FF', '#EAE7FF', '#F9F9FF']} locations={[0, 0.48, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
    <View style={[styles.softShape, { top: '-8%', right: -size * 0.32, opacity: 0.3 }]}><SoftCircle color="#DCD8FF" size={size} /></View>
    <View style={[styles.softShape, { top: '34%', left: -size * 0.58, opacity: 0.28 }]}><SoftCircle color="#D7DFFF" size={size * 1.22} /></View>
    <View style={[styles.softShape, { bottom: -size * 0.42, right: -size * 0.38, opacity: 0.24 }]}><SoftCircle color="#DCD8FF" size={size * 1.45} /></View>
    <View style={[styles.curves, { width: size * 1.7, height: size * 1.2, borderRadius: size, right: -size * 0.95, top: '17%', transform: [{ rotate: '-28deg' }] }]}>
      <View style={[StyleSheet.absoluteFill, styles.lavenderArc]} />
      <View style={[styles.innerArc, { borderRadius: size }]} />
    </View>
    <View style={[styles.highlightArc, { width: size * 0.7, height: size * 0.68, borderRadius: size, top: -size * 0.23, right: -size * 0.08, transform: [{ rotate: '24deg' }] }]} />
  </View>;
}
const styles = StyleSheet.create({
  background: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden', backgroundColor: '#F5F3FF' },
  softShape: { position: 'absolute', ...(Platform.OS === 'web' ? { filter: 'blur(12px)' } : {}) },
  curves: { position: 'absolute', opacity: 0.2, ...(Platform.OS === 'web' ? { filter: 'blur(8px)' } : {}) },
  lavenderArc: { borderRadius: 1000, borderWidth: 26, borderColor: 'rgba(220,216,255,0.42)' },
  innerArc: { position: 'absolute', top: 12, bottom: 12, left: 12, right: 12, borderWidth: 12, borderColor: 'rgba(215,223,255,0.35)' },
  highlightArc: { position: 'absolute', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', ...(Platform.OS === 'web' ? { filter: 'blur(1.5px)' } : {}) },
});
