import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CTAButton, Eyebrow, ThemedText } from '@/components';
import { colors, spacing } from '@/theme';
import { BACKGROUNDS } from '@/features/wallpaper/backgrounds';
import { useWidgetStore } from '@/features/widget/widgetStore';
import { refreshSummary } from '@/features/widget/summary';
import { pushWidgetTimeline } from '@/features/widget/pushTimeline';
import { WidgetPreview } from '@/features/widget/WidgetPreview';
import { SizeSegmentedControl } from '@/features/widget/SizeSegmentedControl';
import type { WidgetFamily } from '@/features/widget/widgetLayout';

interface RowProps {
  label: string;
  value: string;
  onPress: () => void;
  swatch?: readonly [string, string];
}

function Row({ label, value, onPress, swatch }: RowProps) {
  return (
    <Pressable onPress={onPress} style={{ paddingVertical: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Eyebrow>{label}</Eyebrow>
          <ThemedText variant="body">{value}</ThemedText>
        </View>
        {swatch && (
          <LinearGradient
            colors={swatch}
            style={{ width: 36, height: 36, borderRadius: 8, marginRight: spacing.sm }}
          />
        )}
        <ThemedText variant="body" color={colors.textFaint}>
          ›
        </ThemedText>
      </View>
    </Pressable>
  );
}

export default function WidgetConfigScreen() {
  const router = useRouter();
  const config = useWidgetStore((s) => s.config);
  const bg = BACKGROUNDS.find((b) => b.id === config.backgroundId) ?? BACKGROUNDS[0];
  const [family, setFamily] = useState<WidgetFamily>('medium');

  const onSave = () => {
    pushWidgetTimeline();
    Alert.alert(
      'Widget saved',
      'Long-press your home screen, tap +, and add the Quiet Waters "Daily Verse" widget.',
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top', 'left', 'right']}>
      <View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
        {/* Preview floats with breathing room in the upper-middle of the screen */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <WidgetPreview
            family={family}
            background={bg}
            verseText="“Come to me, all who labor and are heavy laden, and I will give you rest.”"
            reference="Matthew 11:28"
          />
        </View>

        {/* Size toggle sits directly above the settings card */}
        <View style={{ marginBottom: spacing.md }}>
          <SizeSegmentedControl value={family} onChange={setFamily} />
        </View>

        {/* Settings + save anchored to the bottom */}
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: 20,
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.md,
          }}
        >
          <Row
            label="BACKGROUND"
            value={bg.name}
            swatch={bg.kind === 'gradient' ? bg.colors : [bg.fallbackColor, bg.fallbackColor]}
            onPress={() => router.push('/widget-background')}
          />
          <View style={{ height: 1, backgroundColor: colors.paleAlt }} />
          <Row
            label="REFRESH"
            value={refreshSummary(config)}
            onPress={() => router.push('/widget-refresh')}
          />
        </View>

        <CTAButton label="Save widget" onPress={onSave} />
      </View>
    </SafeAreaView>
  );
}
