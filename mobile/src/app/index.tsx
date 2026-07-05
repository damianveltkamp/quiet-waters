import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { isOnboardingComplete } from '@/lib/storage';

export default function Index() {
  const [done, setDone] = useState<boolean | null>(null);
  useEffect(() => {
    isOnboardingComplete().then(setDone);
  }, []);
  if (done === null) return null;
  return <Redirect href={done ? '/home' : '/onboarding/01-aspiration'} />;
}
