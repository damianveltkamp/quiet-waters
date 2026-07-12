import type { ImageSourcePropType } from 'react-native';
import { IMAGE_ASSETS } from './backgroundImages.generated';

interface BackgroundBase {
  id: string;
  name: string;
  textColor: string; // verse + cross color
  mutedColor: string; // reference eyebrow color
}

export interface GradientBackground extends BackgroundBase {
  kind: 'gradient';
  colors: readonly [string, string]; // [top, bottom] for LinearGradient
}

export interface ImageBackground extends BackgroundBase {
  kind: 'image';
  source: ImageSourcePropType; // require('...') — RN canvas + picker thumbnail
  widgetAsset: string; // native widget asset-catalog name
  fallbackColor: string; // dominant color, shown if the asset can't load
  scrim?: number; // dark-overlay strength 0..1, default 0.4
}

export type Background = GradientBackground | ImageBackground;
/** @deprecated Prefer `Background`. Kept as an alias for existing imports. */
export type WallpaperBackground = Background;

const GRADIENT_BACKGROUNDS: readonly GradientBackground[] = [
  { kind: 'gradient', id: 'deep-night',   name: 'Deep Night',   colors: ['#1C3344', '#0F1F2B'], textColor: '#FFFFFF', mutedColor: '#C9DCE5' },
  { kind: 'gradient', id: 'still-water',  name: 'Still Water',  colors: ['#5E8298', '#3A5568'], textColor: '#FFFFFF', mutedColor: '#DCEAF0' },
  { kind: 'gradient', id: 'first-light',  name: 'First Light',  colors: ['#8AA2B0', '#C9DCE5'], textColor: '#1C3344', mutedColor: '#4C5C67' },
  { kind: 'gradient', id: 'open-sky',     name: 'Open Sky',     colors: ['#C9DCE5', '#9CC0D4'], textColor: '#1C3344', mutedColor: '#4C5C67' },
  { kind: 'gradient', id: 'morning-mist', name: 'Morning Mist', colors: ['#F4F8F9', '#D6E3E9'], textColor: '#1C3344', mutedColor: '#4C5C67' },
  { kind: 'gradient', id: 'horizon',      name: 'Horizon',      colors: ['#5E8298', '#1C3344'], textColor: '#FFFFFF', mutedColor: '#C9DCE5' },
];

// Optional friendly display names, keyed by generated id. Fill in as desired;
// unset ids fall back to "Scene N".
const IMAGE_NAMES: Record<string, string> = {};

function defaultName(id: string): string {
  const n = Number(id.replace(/\D/g, ''));
  return `Scene ${n}`;
}

const IMAGE_BACKGROUNDS: readonly ImageBackground[] = IMAGE_ASSETS.map((a) => ({
  kind: 'image',
  id: a.id,
  name: IMAGE_NAMES[a.id] ?? defaultName(a.id),
  source: a.source,
  widgetAsset: a.id,
  fallbackColor: a.fallbackColor,
  textColor: '#FFFFFF',
  mutedColor: '#E8EEF2',
}));

export const BACKGROUNDS: readonly Background[] = [...GRADIENT_BACKGROUNDS, ...IMAGE_BACKGROUNDS];

export const DEFAULT_BACKGROUND: Background = GRADIENT_BACKGROUNDS[0];
