import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';
import { REVENUECAT_IOS_KEY } from './config';

export const PRO_ENTITLEMENT = 'pro';

export function initPurchases(appUserId: string | null = null): void {
  Purchases.configure({ apiKey: REVENUECAT_IOS_KEY, appUserID: appUserId });
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}

export async function getAppUserId(): Promise<string> {
  return Purchases.getAppUserID();
}

export function hasPro(info: CustomerInfo): boolean {
  return info.entitlements.active[PRO_ENTITLEMENT] !== undefined;
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restore(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}
