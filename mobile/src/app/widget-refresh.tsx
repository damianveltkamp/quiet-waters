import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components';
import { colors, spacing } from '@/theme';
import { useWidgetStore } from '@/features/widget/widgetStore';
import { refreshSummary } from '@/features/widget/summary';
import type { RefreshSetting } from '@/features/widget/config';

const DAILY_TIMES = ['06:00', '07:00', '08:00', '12:00', '18:00', '21:00'];

interface OptionProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function Option({ label, active, onPress }: OptionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: 12,
        backgroundColor: active ? colors.primary : colors.white,
        marginBottom: spacing.sm,
      }}
    >
      <ThemedText variant="body" color={active ? colors.white : colors.primary}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export default function WidgetRefreshScreen() {
  const router = useRouter();
  const refresh = useWidgetStore((s) => s.config.refresh);
  const setRefresh = useWidgetStore((s) => s.setRefresh);

  const choose = (r: RefreshSetting) => {
    setRefresh(r);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, padding: spacing.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
        <ThemedText variant="title">Refresh</ThemedText>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Close"
          style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.paleAlt, alignItems: 'center', justifyContent: 'center' }}
        >
          <ThemedText variant="body" color={colors.textMuted}>×</ThemedText>
        </Pressable>
      </View>
      <ScrollView style={{ flex: 1 }}>
        <Option
          label="Every hour"
          active={refresh.mode === 'hourly'}
          onPress={() => choose({ mode: 'hourly', time: refresh.time })}
        />
        <ThemedText variant="caption" color={colors.textMuted} style={{ marginVertical: spacing.sm }}>
          DAILY AT
        </ThemedText>
        {DAILY_TIMES.map((t) => (
          <Option
            key={t}
            label={refreshSummary({ backgroundId: '', refresh: { mode: 'daily', time: t } })}
            active={refresh.mode === 'daily' && refresh.time === t}
            onPress={() => choose({ mode: 'daily', time: t })}
          />
        ))}
      </ScrollView>
    </View>
  );
}
