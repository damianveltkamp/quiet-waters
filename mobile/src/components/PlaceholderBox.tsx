import { View, Image } from 'react-native';
import { ThemedText } from './ThemedText';
import { colors, spacing } from '@/theme';

interface Props {
  label: string;
  sublabel: string;
}

export function PlaceholderBox({ label, sublabel }: Props) {
  return (
    <View
      style={{
        flex: 1,
        borderWidth: 1.5,
        borderColor: colors.pale,
        borderStyle: 'dashed',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        padding: spacing.lg,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.pale,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={require('../../assets/images/symbol-slate.png')}
          style={{ width: 24, height: 24, resizeMode: 'contain' }}
        />
      </View>
      <ThemedText variant="eyebrow" color={colors.mid} align="center">
        {label}
      </ThemedText>
      <ThemedText variant="caption" color={colors.textFaint} align="center">
        {sublabel}
      </ThemedText>
    </View>
  );
}
