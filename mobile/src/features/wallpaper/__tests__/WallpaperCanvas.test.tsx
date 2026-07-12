import { render, screen } from '@testing-library/react-native';
import { WallpaperCanvas } from '@/features/wallpaper/WallpaperCanvas';
import { BACKGROUNDS } from '@/features/wallpaper/backgrounds';

function flatStyle(node: { props: Record<string, unknown> }) {
  const style = node.props.style;
  return Array.isArray(style) ? Object.assign({}, ...(style as object[]).flat()) : (style as Record<string, unknown>);
}

test('renders the verse and reference', async () => {
  await render(
    <WallpaperCanvas verseText="He leads me beside quiet waters." reference="Psalm 23:2" background={BACKGROUNDS[0]} textColor="#FFFFFF" backdropOpacity={0.45} />,
  );
  expect(screen.getByText(/He leads me beside quiet waters\./)).toBeOnTheScreen();
  expect(screen.getByText('Psalm 23:2')).toBeOnTheScreen();
});

test('applies the chosen text color to the verse', async () => {
  await render(<WallpaperCanvas verseText="Test verse" reference="Ref 1:1" background={BACKGROUNDS[0]} textColor="#C9A96A" backdropOpacity={0.45} />);
  expect(flatStyle(screen.getByText(/Test verse/)).color).toBe('#C9A96A');
});

test('renders a scrim over a gradient background', async () => {
  await render(<WallpaperCanvas verseText="Test verse" reference="Ref 1:1" background={BACKGROUNDS[0]} textColor="#FFFFFF" backdropOpacity={0.45} />);
  expect(screen.getByTestId('wallpaper-scrim')).toBeOnTheScreen();
});

test('scrim is fully transparent at backdropOpacity 0 and darkens with opacity', async () => {
  await render(<WallpaperCanvas verseText="Test verse" reference="Ref 1:1" background={BACKGROUNDS[0]} textColor="#FFFFFF" backdropOpacity={0} />);
  expect(flatStyle(screen.getByTestId('wallpaper-scrim')).backgroundColor).toBe('rgba(0,0,0,0)');
});

test('scrim is a uniform overlay at the given opacity', async () => {
  await render(<WallpaperCanvas verseText="Test verse" reference="Ref 1:1" background={BACKGROUNDS[0]} textColor="#FFFFFF" backdropOpacity={0.45} />);
  expect(flatStyle(screen.getByTestId('wallpaper-scrim')).backgroundColor).toBe('rgba(0,0,0,0.45)');
});

test('renders an image background with a scrim', async () => {
  const image = BACKGROUNDS.find((b) => b.kind === 'image')!;
  await render(<WallpaperCanvas verseText="Test verse" reference="Ref 1:1" background={image} textColor="#FFFFFF" backdropOpacity={0.45} />);
  expect(screen.getByTestId('wallpaper-image')).toBeOnTheScreen();
  expect(screen.getByTestId('wallpaper-scrim')).toBeOnTheScreen();
});
