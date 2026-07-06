import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('expo-notifications', () => ({ requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'denied' }) }));

import Permissions from '@/app/onboarding/10-permissions';

test('requests permission and advances even if denied', async () => {
  await render(<Permissions />);
  fireEvent.press(screen.getByText('Get daily scriptures'));
  await waitFor(() => {
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/onboarding/11-paywall-intro');
  });
});
