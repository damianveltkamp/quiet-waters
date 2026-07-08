import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

export const REVENUECAT_IOS_KEY = extra.revenueCatIosKey ?? 'appl_PLACEHOLDER';
export const POSTHOG_KEY = extra.posthogKey ?? 'phc_PLACEHOLDER';
export const POSTHOG_HOST = extra.posthogHost ?? 'https://us.i.posthog.com';
export const APP_STORE_URL = extra.appStoreUrl ?? 'https://apps.apple.com/app/quiet-waters';
