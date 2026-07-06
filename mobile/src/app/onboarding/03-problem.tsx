import { View } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Eyebrow, ThemedText, Divider, CTAButton } from "@/components";
import { spacing, colors } from "@/theme";

export default function Problem() {
  const router = useRouter();
  return (
    <Screen variant="light">
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: spacing.md,
        }}
      >
        <Eyebrow color={colors.soft} style={{ textAlign: "center" }}>
          The Modern Day
        </Eyebrow>

        <View style={{ alignItems: "center", gap: spacing.xs }}>
          <ThemedText variant="body" color={colors.textMuted} align="center">
            The average person spends
          </ThemedText>
          <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
            <ThemedText variant="display">4</ThemedText>
            <ThemedText variant="title" style={{ marginBottom: spacing.sm }}>
              h+
            </ThemedText>
          </View>
          <ThemedText variant="body" color={colors.textMuted} align="center">
            a day on their phone.
          </ThemedText>
        </View>

        <Divider />

        <View style={{ alignItems: "center", gap: spacing.xs }}>
          <ThemedText variant="body" color={colors.textMuted} align="center">
            That's
          </ThemedText>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              gap: spacing.sm,
            }}
          >
            <ThemedText variant="display">61</ThemedText>
            <ThemedText variant="title" style={{ marginBottom: spacing.sm }}>
              days
            </ThemedText>
          </View>
          <ThemedText variant="body" color={colors.textMuted} align="center">
            a year.
          </ThemedText>
        </View>

        <ThemedText variant="quote" color={colors.textMuted} align="center">
          Time that could be spent getting closer to God.
        </ThemedText>
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton
          label="I want that"
          variant="primary"
          onPress={() => router.push("/onboarding/04-question")}
        />
      </View>
    </Screen>
  );
}
