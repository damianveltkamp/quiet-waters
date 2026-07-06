import { render, screen } from '@testing-library/react-native';
import { LockScreenPreview, NotificationPreview, PlaceholderBox, PlanCard, TimelineStep } from '@/components';

test('LockScreenPreview shows verse and reference', async () => {
  await render(<LockScreenPreview verse="He leads me beside quiet waters." reference="Psalm 23:2" />);
  expect(screen.getByText('He leads me beside quiet waters.')).toBeOnTheScreen();
  expect(screen.getByText('Psalm 23:2')).toBeOnTheScreen();
});
test('NotificationPreview shows title and body', async () => {
  await render(<NotificationPreview title="Your verse for today" body="Be still, and know that I am God." />);
  expect(screen.getByText('Your verse for today')).toBeOnTheScreen();
});
test('PlaceholderBox shows label', async () => {
  await render(<PlaceholderBox label="Wallpaper Creator" sublabel="feature UI to be placed here" />);
  expect(screen.getByText('Wallpaper Creator')).toBeOnTheScreen();
});
test('PlanCard shows price and badge', async () => {
  await render(<PlanCard title="Yearly" priceLabel="$59.99" subLabel="Only $1.15 / week" periodLabel="/ year" selected badge="SAVE 92%" onPress={() => {}} />);
  expect(screen.getByText('$59.99')).toBeOnTheScreen();
  expect(screen.getByText('SAVE 92%')).toBeOnTheScreen();
});
test('TimelineStep shows title and body', async () => {
  await render(<TimelineStep icon="lock" title="Today" body="Unlock full access to Quiet Waters" />);
  expect(screen.getByText('Today')).toBeOnTheScreen();
});
