export interface WallpaperBackground {
  id: string;
  name: string;
  colors: readonly [string, string]; // [top, bottom] for LinearGradient
  textColor: string;                 // verse + cross color
  mutedColor: string;                // reference eyebrow color
}

export const BACKGROUNDS: readonly WallpaperBackground[] = [
  { id: 'deep-night',   name: 'Deep Night',   colors: ['#1C3344', '#0F1F2B'], textColor: '#FFFFFF', mutedColor: '#C9DCE5' },
  { id: 'still-water',  name: 'Still Water',  colors: ['#5E8298', '#3A5568'], textColor: '#FFFFFF', mutedColor: '#DCEAF0' },
  { id: 'first-light',  name: 'First Light',  colors: ['#8AA2B0', '#C9DCE5'], textColor: '#1C3344', mutedColor: '#4C5C67' },
  { id: 'open-sky',     name: 'Open Sky',     colors: ['#C9DCE5', '#9CC0D4'], textColor: '#1C3344', mutedColor: '#4C5C67' },
  { id: 'morning-mist', name: 'Morning Mist', colors: ['#F4F8F9', '#D6E3E9'], textColor: '#1C3344', mutedColor: '#4C5C67' },
  { id: 'horizon',      name: 'Horizon',      colors: ['#5E8298', '#1C3344'], textColor: '#FFFFFF', mutedColor: '#C9DCE5' },
] as const;

export const DEFAULT_BACKGROUND: WallpaperBackground = BACKGROUNDS[0];
