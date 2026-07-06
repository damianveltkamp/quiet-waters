jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    setLogLevel: jest.fn(),
    LOG_LEVEL: { DEBUG: 'DEBUG' },
    getOfferings: jest.fn().mockResolvedValue({ current: null }),
    getCustomerInfo: jest.fn().mockResolvedValue({ entitlements: { active: {} } }),
    getAppUserID: jest.fn().mockResolvedValue('anon-test'),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn().mockResolvedValue({ entitlements: { active: {} } }),
  },
}));

jest.mock('posthog-react-native', () => ({
  PostHog: jest.fn().mockImplementation(() => ({ identify: jest.fn(), capture: jest.fn() })),
  PostHogProvider: ({ children }) => children,
  usePostHog: () => ({ identify: jest.fn(), capture: jest.fn() }),
  useFeatureFlag: () => undefined,
  useFeatureFlagWithPayload: () => [undefined, undefined],
}));
