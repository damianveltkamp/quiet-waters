import { useFeatureFlag } from 'posthog-react-native';
import { EXPERIMENTS, type ExperimentKey, type VariantOf } from '@/lib/experiments';

export function useVariant<K extends ExperimentKey>(key: K): VariantOf<K> {
  const raw = useFeatureFlag(key);
  const exp = EXPERIMENTS[key];
  const resolved =
    typeof raw === 'string' && (exp.variants as readonly string[]).includes(raw)
      ? (raw as VariantOf<K>)
      : (exp.default as VariantOf<K>);
  if (__DEV__ && process.env.NODE_ENV !== 'test') {
    // Dev-only diagnostic: raw=undefined => flags not loaded (bootstrap fallback in use)
    console.log(`[useVariant] ${key}: raw=${JSON.stringify(raw)} resolved=${resolved}`);
  }
  return resolved;
}
