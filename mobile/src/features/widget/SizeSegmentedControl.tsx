import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components';
import { colors, spacing } from '@/theme';
import { tapFeedback } from '@/lib/haptics';
import { WIDGET_FAMILIES, type WidgetFamily } from './widgetLayout';

export interface SizeSegmentedControlProps {
  value: WidgetFamily;
  onChange: (family: WidgetFamily) => void;
}

const label = (f: WidgetFamily) => f.charAt(0).toUpperCase() + f.slice(1);

/** Pill segmented control for choosing which widget size the preview shows. */
export function SizeSegmentedControl({ value, onChange }: SizeSegmentedControlProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignSelf: 'center',
        backgroundColor: colors.white,
        borderRadius: 999,
        padding: spacing.xs,
      }}
    >
      {WIDGET_FAMILIES.map((family) => {
        const selected = family === value;
        return (
          <Pressable
            key={family}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              tapFeedback();
              onChange(family);
            }}
            style={{
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.lg,
              borderRadius: 999,
              backgroundColor: selected ? colors.primary : 'transparent',
            }}
          >
            <ThemedText variant="body" color={selected ? colors.white : colors.textMuted}>
              {label(family)}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
