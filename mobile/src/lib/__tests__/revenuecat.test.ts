import Purchases from 'react-native-purchases';
import {
  hasPro, PRO_ENTITLEMENT, initPurchases, purchasePackage, restore, getCurrentOffering,
} from '@/lib/revenuecat';

const infoWith = (active: Record<string, unknown>) => ({ entitlements: { active } }) as any;

test('hasPro is true only when the pro entitlement is active', () => {
  expect(hasPro(infoWith({ [PRO_ENTITLEMENT]: {} }))).toBe(true);
  expect(hasPro(infoWith({}))).toBe(false);
  expect(hasPro(infoWith({ other: {} }))).toBe(false);
});

test('initPurchases configures with the publishable key', () => {
  initPurchases(null);
  expect(Purchases.configure).toHaveBeenCalledWith(
    expect.objectContaining({ apiKey: expect.stringMatching(/^appl_/), appUserID: null }),
  );
});

test('purchasePackage returns the updated customerInfo', async () => {
  const info = infoWith({ [PRO_ENTITLEMENT]: {} });
  (Purchases.purchasePackage as jest.Mock).mockResolvedValueOnce({ customerInfo: info });
  await expect(purchasePackage({} as any)).resolves.toBe(info);
});

test('getCurrentOffering returns null when there is no current offering', async () => {
  await expect(getCurrentOffering()).resolves.toBeNull();
});

test('restore resolves to customerInfo', async () => {
  await expect(restore()).resolves.toEqual({ entitlements: { active: {} } });
});
