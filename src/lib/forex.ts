export const SUPPORTED_CURRENCIES = [
  'THB',
  'USD',
  'CNY',
  'TWD',
  'RUB',
  'MMK',
  'EUR',
  'JPY',
  'GBP',
  'AUD',
  'CAD',
  'CHF',
  'HKD',
  'NZD',
  'SEK',
  'KRW',
  'SGD',
  'NOK',
  'MXN',
  'INR',
  'ZAR',
  'TRY',
  'BRL',
  'DKK',
  'PLN',
  'IDR',
  'HUF',
  'CZK',
  'ILS',
  'SAR',
  'AED',
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const THB_RATES: Record<CurrencyCode, number> = {
  THB: 1,
  USD: 36.5,
  CNY: 5.0,
  TWD: 1.15,
  RUB: 0.4,
  MMK: 0.017,
  EUR: 39,
  JPY: 0.25,
  GBP: 45,
  AUD: 24,
  CAD: 27,
  CHF: 41,
  HKD: 4.7,
  NZD: 22,
  SEK: 3.5,
  KRW: 0.028,
  SGD: 27,
  NOK: 3.4,
  MXN: 2.1,
  INR: 0.44,
  ZAR: 1.9,
  TRY: 1.1,
  BRL: 7,
  DKK: 5.2,
  PLN: 9.2,
  IDR: 0.0023,
  HUF: 0.11,
  CZK: 1.6,
  ILS: 9.8,
  SAR: 9.7,
  AED: 10,
};

const currencySet = new Set(SUPPORTED_CURRENCIES);

export function isSupportedCurrency(x: string): x is CurrencyCode {
  return currencySet.has(x.toUpperCase() as CurrencyCode);
}

export function toTHB(currency: CurrencyCode, amount: number): number {
  const rate = THB_RATES[currency];
  const value = rate * amount;
  return Math.round(value * 100) / 100;
}

export function tryToTHB(currency: string, amount: number): number | null {
  const code = currency.toUpperCase();
  if (!isSupportedCurrency(code)) {
    return null;
  }
  return toTHB(code, amount);
}

export function formatApproxTHB(amountTHB: number, locale?: string): string {
  const formatter = new Intl.NumberFormat(locale ?? 'th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `≈ ${formatter.format(amountTHB)} บาท`;
}
