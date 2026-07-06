import { View } from "react-native";
import { useRouter } from "expo-router";
import {
  Screen,
  Eyebrow,
  ThemedText,
  CTAButton,
  ScreenTimeCard,
} from "@/components";
import { spacing, colors } from "@/theme";

export default function Problem() {
  const router = useRouter();
  return (
    <Screen variant="light">
      <View style={{ flex: 1, justifyContent: "center", gap: spacing.xl }}>
        <Eyebrow style={{ textAlign: "center" }} color={colors.soft}>
          The Modern Day
        </Eyebrow>
        <ScreenTimeCard
          hoursLabel="4h+"
          caption="the average person spends more than 4 hours per day on their phone"
        />
        <ThemedText variant="quote" color={colors.textMuted} align="center">
          That time could be spent getting closer to God.
        </ThemedText>
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton
          label="I want that"
          variant="primary"
          onPress={() => router.push("/onboarding/03-question")}
        />
      </View>
    </Screen>
  );
}
