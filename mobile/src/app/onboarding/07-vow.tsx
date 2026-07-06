import { View } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Eyebrow, ThemedText, PrayerButton } from "@/components";
import { useOnboardingStore } from "@/store/onboarding";
import { vowHours, formatNumber } from "@/lib/calculations";
import { spacing, colors } from "@/theme";

export default function Vow() {
  const router = useRouter();
  const bucket = useOnboardingStore((s) => s.bucket);
  return (
    <Screen variant="light">
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.lg,
        }}
      >
        <Eyebrow color={colors.soft}>A Quiet Vow</Eyebrow>
        <ThemedText variant="title" color={colors.deep} align="center">
          This year, I'll give{"\n"}
          <ThemedText
            variant="display"
            color={colors.primary}
            style={{ textAlign: "center" }}
          >
            {formatNumber(vowHours(bucket))} hours
          </ThemedText>
          {"\n"}to drawing closer to God.
        </ThemedText>
        <Eyebrow color={colors.soft}>Tap and hold to pray</Eyebrow>
        <PrayerButton onComplete={() => router.push("/onboarding/07-wow")} />
        <ThemedText variant="quote" color={colors.soft} align="center">
          Keep holding and let this become your prayer.
        </ThemedText>
      </View>
    </Screen>
  );
}
