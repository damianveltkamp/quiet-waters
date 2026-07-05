import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/theme';
import { pulseFeedback, successFeedback } from '@/lib/haptics';

interface Props { onComplete: () => void; holdDurationMs?: number; }
const SIZE = 140, STROKE = 4, R = (SIZE - STROKE) / 2, C = 2 * Math.PI * R;

export function PrayerButton({ onComplete, holdDurationMs = 3000 }: Props) {
  const [progress, setProgress] = useState(0); // 0..1
  const pulseTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef<number>(0);

  const clearAll = () => {
    if (pulseTimer.current) clearInterval(pulseTimer.current);
    if (progressTimer.current) clearInterval(progressTimer.current);
    pulseTimer.current = null; progressTimer.current = null;
  };
  useEffect(() => clearAll, []);

  const start = () => {
    startedAt.current = Date.now();
    setProgress(0);
    pulseFeedback();                                   // immediate pulse
    pulseTimer.current = setInterval(pulseFeedback, 1000);
    progressTimer.current = setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      const p = Math.min(elapsed / holdDurationMs, 1);
      setProgress(p);
      if (p >= 1) { clearAll(); successFeedback(); onComplete(); }
    }, 50);
  };
  const stop = () => { clearAll(); setProgress(0); };

  return (
    <Pressable testID="prayer-button" onPressIn={start} onPressOut={stop}
      style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Circle cx={SIZE/2} cy={SIZE/2} r={R} stroke={colors.deep} strokeWidth={STROKE} fill="none" />
        <Circle cx={SIZE/2} cy={SIZE/2} r={R} stroke={colors.accent} strokeWidth={STROKE} fill="none"
          strokeDasharray={C} strokeDashoffset={C * (1 - progress)} strokeLinecap="round"
          transform={`rotate(-90 ${SIZE/2} ${SIZE/2})`} />
      </Svg>
      <View style={{ width: SIZE-24, height: SIZE-24, borderRadius: (SIZE-24)/2, backgroundColor: colors.deep, alignItems: 'center', justifyContent: 'center' }}>
        <Image source={require('../../assets/images/symbol-white.png')} style={{ width: 36, height: 36, resizeMode: 'contain' }} />
      </View>
    </Pressable>
  );
}
