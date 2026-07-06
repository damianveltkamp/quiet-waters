import { useFeatureFlag } from 'posthog-react-native';
import { EXPERIMENTS, type ExperimentKey, type VariantOf } from '@/lib/experiments';

export function useVariant<K extends ExperimentKey>(key: K): VariantOf<K> {
  const raw = useFeatureFlag(key);
  const exp = EXPERIMENTS[key];
  if (typeof raw === 'string' && (exp.variants as readonly string[]).includes(raw)) {
    return raw as VariantOf<K>;
  }
  return exp.default as VariantOf<K>;
}
