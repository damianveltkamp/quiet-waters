import { Pressable, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { colors, spacing } from '@/theme';

interface Props { label: string; selected: boolean; onPress: () => void; }
export function RadioOption({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
        backgroundColor: selected ? colors.primary : colors.white,
        borderRadius: 16, paddingVertical: spacing.md, paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
      }}
    >
      <View style={{
        width: 22, height: 22, borderRadius: 11, borderWidth: 2,
        borderColor: selected ? colors.white : colors.soft,
        alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.white }} />}
      </View>
      <ThemedText variant="body" color={selected ? colors.white : colors.primary}>{label}</ThemedText>
    </Pressable>
  );
}
