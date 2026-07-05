import { View } from 'react-native';
import { ThemedText } from './ThemedText';
import { BarChart, DAY_LETTERS } from './BarChart';
import { colors, spacing } from '@/theme';

interface Props {
  hoursLabel: string;
  caption: string;
  values?: number[];
}

const DEFAULT_VALUES = [3, 2, 4, 3, 3, 5, 5];

export function ScreenTimeCard({ hoursLabel, caption, values = DEFAULT_VALUES }: Props) {
  return (
    <View
      style={{
        backgroundColor: colors.primary,
        borderRadius: 24,
        padding: spacing.lg,
        gap: spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <ThemedText variant="eyebrow" color={colors.pale}>
          Screen time
        </ThemedText>
        <ThemedText variant="eyebrow" color={colors.soft}>
          Global average
        </ThemedText>
      </View>
      <ThemedText variant="display" color={colors.white} style={{ fontSize: 44, lineHeight: 48 }}>
        {hoursLabel}
      </ThemedText>
      <ThemedText variant="caption" color={colors.pale}>
        {caption}
      </ThemedText>
      <View style={{ marginTop: spacing.sm }}>
        <BarChart values={values} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
          {DAY_LETTERS.map((letter, index) => (
            <ThemedText key={index} variant="caption" color={colors.soft} style={{ width: 22, textAlign: 'center' }}>
              {letter}
            </ThemedText>
          ))}
        </View>
      </View>
    </View>
  );
}
