import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { CTAButton, Eyebrow, ThemedText } from '@/components';
import { colors, spacing } from '@/theme';
import { BACKGROUNDS } from '@/features/wallpaper/backgrounds';
import { useWidgetStore } from '@/features/widget/widgetStore';
import { refreshSummary } from '@/features/widget/summary';
import { pushWidgetTimeline } from '@/features/widget/pushTimeline';

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
  const [saved, setSaved] = useState(false);

  const onSave = () => {
    pushWidgetTimeline();
    setSaved(true);
    Alert.alert(
      'Widget saved',
      'Long-press your home screen, tap +, and add the Quiet Waters "Daily Verse" widget.',
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        {/* Preview (single representative size) */}
        <LinearGradient
          colors={bg.colors}
          style={{
            height: 170,
            borderRadius: 20,
            padding: spacing.lg,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ThemedText variant="body" color={bg.mutedColor}>
            ✝
          </ThemedText>
          <ThemedText
            variant="title"
            color={bg.textColor}
            style={{ textAlign: 'center', marginTop: spacing.sm }}
          >
            “Come to me, all who labor and are heavy laden, and I will give you rest.”
          </ThemedText>
          <ThemedText variant="caption" color={bg.mutedColor} style={{ marginTop: spacing.sm }}>
            MATTHEW 11:28
          </ThemedText>
        </LinearGradient>

        <View style={{ backgroundColor: colors.white, borderRadius: 16, paddingHorizontal: spacing.lg }}>
          <Row
            label="BACKGROUND"
            value={bg.name}
            swatch={bg.colors}
            onPress={() => router.push('/widget-background' as Href)}
          />
          <Row
            label="REFRESH"
            value={refreshSummary(config)}
            onPress={() => router.push('/widget-refresh' as Href)}
          />
        </View>
      </ScrollView>

      <View style={{ padding: spacing.lg }}>
        <CTAButton label={saved ? 'Saved' : 'Save widget'} onPress={onSave} />
      </View>
    </View>
  );
}
