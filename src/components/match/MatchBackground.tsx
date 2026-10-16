import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

// Feathered layers keep the shapes soft on native too, where iOS view filters
// do not support Gaussian blur. Web adds a small blur to blend the feathering.
function SoftCircle({ color, size }: { color: string; size: number }) {
  return <View style={{ width: size, height: size }}>{Array.from({ length: 18 }, (_, index) => {
    const inset = index * size * 0.019;
    return <View key={index} style={{ position: 'absolute', top: inset, right: inset, bottom: inset, left: inset, borderRadius: size, backgroundColor: color, opacity: 0.065 }} />;
  })}</View>;
}

export function MatchBackground() {
  const { width } = useWindowDimensions();
  const size = Math.min(640, Math.max(320, width * 0.72));
  return <View pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.background}>
    <LinearGradient colors={['#F5F3FF', '#EAE7FF', '#F9F9FF']} locations={[0, 0.48, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
    <LinearGradient colors={['rgba(255,255,255,.8)', 'rgba(255,255,255,0)', 'rgba(215,223,255,.18)']} locations={[0, 0.44, 1]} start={{ x: 0, y: 0 }} end={{ x: 0.85, y: 1 }} style={StyleSheet.absoluteFill} />
    <View style={[styles.softShape, { top: '-15%', right: -size * 0.38, opacity: 0.35 }]}><SoftCircle color="#BDB4F4" size={size * 1.35} /></View>
    <View style={[styles.softShape, { top: '19%', left: -size * 0.7, opacity: 0.35 }]}><SoftCircle color="#C5D1FA" size={size * 1.55} /></View>
    <View style={[styles.softShape, { top: '42%', right: -size * 0.73, opacity: 0.3 }]}><SoftCircle color="#DCD8FF" size={size * 1.65} /></View>
    <View style={[styles.softShape, { bottom: -size * 0.5, left: -size * 0.4, opacity: 0.35 }]}><SoftCircle color="#CDC4F9" size={size * 1.65} /></View>
    <View style={[styles.softShape, { top: '8%', left: -size * 0.45, opacity: 0.75 }]}><SoftCircle color="#FFFFFF" size={size * 1.55} /></View>
    <View style={[styles.softShape, { bottom: -size * 0.1, right: -size * 0.75, opacity: 0.65 }]}><SoftCircle color="#FFFFFF" size={size * 1.85} /></View>
    <View style={[styles.curves, { width: size * 1.7, height: size * 1.2, borderRadius: size, right: -size * 0.95, top: '17%', transform: [{ rotate: '-28deg' }] }]}>
      <View style={[StyleSheet.absoluteFill, styles.lavenderArc]} />
      <View style={[styles.innerArc, { borderRadius: size }]} />
    </View>
    <View style={[styles.ribbon, { width: size * 1.65, height: size * 1.15, borderRadius: size, left: -size * 1.05, bottom: '9%', transform: [{ rotate: '32deg' }] }]} />
    <View style={[styles.highlightArc, { width: size * 0.7, height: size * 0.68, borderRadius: size, top: -size * 0.23, right: -size * 0.08, transform: [{ rotate: '24deg' }] }]} />
  </View>;
}
const styles = StyleSheet.create({
  background: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden', backgroundColor: '#F5F3FF' },
  softShape: { position: 'absolute', ...(Platform.OS === 'web' ? { filter: 'blur(18px)' } : {}) },
  curves: { position: 'absolute', opacity: 0.35, ...(Platform.OS === 'web' ? { filter: 'blur(12px)' } : {}) },
  ribbon: { position: 'absolute', borderWidth: 34, borderColor: 'rgba(215,223,255,.28)', ...(Platform.OS === 'web' ? { filter: 'blur(14px)' } : {}) },
  lavenderArc: { borderRadius: 1000, borderWidth: 26, borderColor: 'rgba(220,216,255,0.42)' },
  innerArc: { position: 'absolute', top: 12, bottom: 12, left: 12, right: 12, borderWidth: 12, borderColor: 'rgba(215,223,255,0.35)' },
  highlightArc: { position: 'absolute', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', ...(Platform.OS === 'web' ? { filter: 'blur(1.5px)' } : {}) },
});
