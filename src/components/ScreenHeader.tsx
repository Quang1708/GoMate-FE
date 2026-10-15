import { Text } from './LocalizedText';
import { Pressable, StyleSheet, View } from 'react-native';
import { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { colors, control, typography } from '../theme';

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  subtitle?: string;
};

export function ScreenHeader({ title, onBack, right, subtitle }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {onBack && (
          <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={onBack} style={styles.backButton}>
            <Ionicons color={colors.text} name="chevron-back" size={24} />
          </Pressable>
        )}
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', backgroundColor: colors.background, flexDirection: 'row', minHeight: 56, paddingHorizontal: 12 },
  side: { minWidth: 44 },
  right: { alignItems: 'flex-end' },
  backButton: { alignItems: 'center', borderRadius: control.iconButton / 2, height: control.iconButton, justifyContent: 'center', width: control.iconButton },
  copy: { alignItems: 'center', flex: 1 },
  title: { color: colors.text, ...typography.heading },
  subtitle: { color: colors.textSecondary, fontSize: 10, lineHeight: 14, marginTop: 1 },
});
