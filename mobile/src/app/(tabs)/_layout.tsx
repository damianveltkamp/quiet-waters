import { Tabs } from 'expo-router';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { colors } from '@/theme';

function HomeIcon({ color }: { color: ColorValue }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8.5Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

function CreateIcon({ color }: { color: ColorValue }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={4} width={16} height={16} rx={3} stroke={color} strokeWidth={1.8} />
      <Path d="M12 9v6M9 12h6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function YouIcon({ color }: { color: ColorValue }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={1.8} />
      <Path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function ReadIcon({ color }: { color: ColorValue }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M12 6c-1.8-1.2-4.2-2-6.5-2H3v14h2.5c2.3 0 4.7.8 6.5 2 1.8-1.2 4.2-2 6.5-2H21V4h-2.5C16.2 4 13.8 4.8 12 6Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M12 6v14" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.paleAlt },
        tabBarLabelStyle: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 11 },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Today', tabBarIcon: ({ color }) => <HomeIcon color={color} /> }} />
      <Tabs.Screen name="create" options={{ title: 'Create', tabBarIcon: ({ color }) => <CreateIcon color={color} /> }} />
      <Tabs.Screen name="you" options={{ title: 'You', tabBarIcon: ({ color }) => <YouIcon color={color} /> }} />
      <Tabs.Screen name="read" options={{ title: 'Read', tabBarIcon: ({ color }) => <ReadIcon color={color} /> }} />
      {/* Reachable from the Home "Verse widget" row; keeps the tab bar visible but has no tab button. */}
      <Tabs.Screen name="widget-config" options={{ href: null }} />
    </Tabs>
  );
}
