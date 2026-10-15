import { Text } from './LocalizedText';
import { StyleSheet, TextInput, View } from 'react-native';
import { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { colors, control, radii, typography } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

type IconName = ComponentProps<typeof Ionicons>['name'];

type FormFieldProps = {
  icon?: IconName;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  editable?: boolean;
  maxLength?: number;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: ComponentProps<typeof TextInput>['keyboardType'];
  multiline?: boolean;
  rightIcon?: IconName;
  onRightPress?: () => void;
};

export function FormField({
  icon,
  label,
  value,
  onChangeText,
  editable,
  maxLength,
  placeholder,
  secureTextEntry,
  keyboardType,
  multiline,
  rightIcon,
  onRightPress,
}: FormFieldProps) {
  const { translate } = useLanguage();
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, multiline && styles.multilineField]}>
        {icon && <Ionicons color={colors.textMuted} name={icon} size={20} />}
        <TextInput
          accessibilityLabel={translate(label)}
          autoCapitalize={keyboardType === 'email-address' || secureTextEntry ? 'none' : 'sentences'}
          autoCorrect={keyboardType !== 'email-address' && !secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          onChangeText={onChangeText}
          editable={editable}
          maxLength={maxLength}
          placeholder={placeholder ? translate(placeholder) : undefined}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          style={[styles.input, !icon && styles.inputWithoutIcon, multiline && styles.multilineInput]}
          value={value}
        />
        {rightIcon && (
          <Ionicons color={colors.textMuted} name={rightIcon} onPress={onRightPress} size={20} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 7,
  },
  label: {
    color: colors.textSecondary,
    ...typography.label,
  },
  field: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.input,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: control.inputHeight,
    paddingHorizontal: 16,
  },
  multilineField: {
    alignItems: 'flex-start',
    minHeight: 76,
    paddingTop: 16,
  },
  input: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    minWidth: 0,
    minHeight: 46,
    marginLeft: 10,
    paddingVertical: 10,
    includeFontPadding: true,
  },
  inputWithoutIcon: { marginLeft: 0 },
  multilineInput: {
    minHeight: 46,
    textAlignVertical: 'top',
  },
});
