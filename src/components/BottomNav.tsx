import { UnreadDot } from './UnreadDot';
import { Text } from './LocalizedText';
import { Pressable, StyleSheet, View } from 'react-native';
import { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, layout, shadows } from '../theme';

export type MainTab = 'home' | 'match' | 'create' | 'messages' | 'profile';
type IconName = ComponentProps<typeof Ionicons>['name'];

type BottomNavProps = {
  activeTab: MainTab;
  onChange: (tab: MainTab) => void;
};

const items: { activeIcon: IconName; icon: IconName; label: string; tab: MainTab }[] = [
  { activeIcon: 'home', icon: 'home-outline', label: 'Trang chủ', tab: 'home' },
  { activeIcon: 'layers', icon: 'layers-outline', label: 'Match', tab: 'match' },
  { activeIcon: 'add', icon: 'add', label: 'Tạo', tab: 'create' },
  { activeIcon: 'chatbubble', icon: 'chatbubble-outline', label: 'Tin nhắn', tab: 'messages' },
  { activeIcon: 'person', icon: 'person-outline', label: 'Hồ sơ', tab: 'profile' },
];

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <View style={styles.nav}>
      {items.map((item) => {
        const active = item.tab === activeTab;
        const create = item.tab === 'create';
        return (
          <Pressable
            accessibilityRole="tab"
            aria-selected={active}
            accessibilityState={{ selected: active }}
            key={item.tab}
            onPress={() => onChange(item.tab)}
            style={styles.item}
          >
            {create ? (
              <View style={[styles.createIcon, active && styles.activeCreateIcon]}>
                <Ionicons color={colors.white} name="add" size={29} />
              </View>
            ) : (
              <View style={styles.regularIcon}>
                <Ionicons
                  color={active ? colors.primary : colors.textMuted}
                  name={active ? item.activeIcon : item.icon}
                  size={22}
                />
                {item.tab === 'messages' && <UnreadDot kind="messages" style={styles.messageDot} />}
              </View>
            )}
            <Text style={[styles.label, active && styles.activeLabel]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: layout.maxWidth,
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    minHeight: 72,
    paddingHorizontal: 6,
    paddingTop: 9,
  },
  item: { alignItems: 'center', flex: 1 },
  regularIcon: { alignItems: 'center', height: 32, justifyContent: 'center', position: 'relative', width: 42 },
  createIcon: { alignItems: 'center', backgroundColor: colors.primary, borderColor: colors.surface, borderRadius: 25, borderWidth: 4, height: 50, justifyContent: 'center', marginTop: -22, width: 50, ...shadows.floating },
  activeCreateIcon: { transform: [{ scale: 1.05 }] },
  messageDot: { backgroundColor: colors.match, borderColor: colors.surface, borderRadius: 5, borderWidth: 1.5, height: 8, position: 'absolute', right: 6, top: 3, width: 8 },
  label: { color: colors.textMuted, fontSize: 10, fontWeight: '500', marginTop: 2 },
  activeLabel: { color: colors.primary, fontWeight: '800' },
});
