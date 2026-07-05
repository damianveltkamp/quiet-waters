import { View } from 'react-native';
import { colors, spacing } from '@/theme';

interface Props {
  values: number[];
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const BAR_WIDTH = 22;
const MAX_HEIGHT = 72;

export function BarChart({ values }: Props) {
  const max = Math.max(...values, 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.xs }}>
      {values.map((value, index) => (
        <View key={index} style={{ alignItems: 'center', gap: spacing.xs }}>
          <View
            style={{
              width: BAR_WIDTH,
              height: Math.max((value / max) * MAX_HEIGHT, 6),
              borderRadius: 6,
              backgroundColor: colors.accent,
            }}
          />
        </View>
      ))}
    </View>
  );
}

export { DAY_LETTERS };
