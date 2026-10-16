import { Text } from './LocalizedText';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { ReactNode } from 'react';

import { colors, control, radii, typography } from '../theme';

type GradientButtonProps = {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  trailing?: ReactNode;
};

export function GradientButton({ disabled = false, label, onPress, style, trailing }: GradientButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      accessibilityState={{ disabled }}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.shadow, style, disabled && { opacity: 0.5 }, pressed && styles.pressed]}
    >
      <View style={styles.gradient}>
        <Text style={styles.label}>{label}</Text>
        {trailing === undefined ? <Text style={styles.arrow}>→</Text> : trailing}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: radii.button,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  gradient: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    flexDirection: 'row',
    height: control.buttonHeight,
    justifyContent: 'center',
  },
  label: {
    color: colors.white,
    ...typography.heading,
  },
  arrow: {
    color: colors.white,
    fontSize: 23,
    fontWeight: '300',
    marginLeft: 12,
    marginTop: -2,
  },
});
