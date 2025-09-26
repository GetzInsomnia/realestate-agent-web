import type { CurrencyCode } from './forex';

export type Country = {
  code: string; // ISO-3166-1 alpha-2, uppercase
  name: string; // English display name (UI will localize separately)
  dialCode: string; // e.g., "+66"
  currency: CurrencyCode;
  flag: string; // emoji
};

const PRIORITY_ISO2 = [
  'CN',
  'HK',
  'TW',
  'SG',
  'MY',
  'JP',
  'KR',
  'US',
  'GB',
  'FR',
  'DE',
  'RU',
  'AU',
  'NZ',
  'IN',
  'AE',
  'SA',
  'QA',
  'KW',
  'OM',
  'BH',
  'TR',
  'IL',
  'ZA',
  'CA',
  'BR',
  'MX',
  'ES',
  'IT',
  'NL',
  'SE',
  'NO',
  'DK',
  'FI',
  'PL',
  'CZ',
  'HU',
  'AT',
  'CH',
  'BE',
  'IE',
  'PT',
  'GR',
  'UA',
  'KZ',
  'UZ',
  'AZ',
  'EG',
  'MA',
  'TN',
  'DZ',
  'KE',
  'NG',
  'GH',
  'ET',
  'AR',
  'CL',
  'PE',
  'CO',
  'VE',
  'UY',
  'PA',
  'CR',
  'DO',
  'JM',
  'PH',
  'VN',
  'ID',
  'KH',
  'LA',
  'MM',
  'LK',
  'BD',
  'NP',
  'PK',
  'IR',
  'IQ',
  'JO',
  'LB',
  'MO',
  'TH',
  'BN',
];

const BASE_COUNTRY_MAP = {
  TH: { name: 'Thailand', dialCode: '+66', currency: 'THB', flag: '🇹🇭' },
  US: { name: 'United States', dialCode: '+1', currency: 'USD', flag: '🇺🇸' },
  CN: { name: 'China', dialCode: '+86', currency: 'CNY', flag: '🇨🇳' },
  HK: { name: 'Hong Kong', dialCode: '+852', currency: 'HKD', flag: '🇭🇰' },
  MO: { name: 'Macao', dialCode: '+853', currency: 'HKD', flag: '🇲🇴' },
  TW: { name: 'Taiwan', dialCode: '+886', currency: 'TWD', flag: '🇹🇼' },
  SG: { name: 'Singapore', dialCode: '+65', currency: 'SGD', flag: '🇸🇬' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  MY: { name: 'Malaysia', dialCode: '+60', currency: 'USD', flag: '🇲🇾' },
  JP: { name: 'Japan', dialCode: '+81', currency: 'JPY', flag: '🇯🇵' },
  KR: { name: 'South Korea', dialCode: '+82', currency: 'KRW', flag: '🇰🇷' },
  IN: { name: 'India', dialCode: '+91', currency: 'INR', flag: '🇮🇳' },
  AE: { name: 'United Arab Emirates', dialCode: '+971', currency: 'AED', flag: '🇦🇪' },
  SA: { name: 'Saudi Arabia', dialCode: '+966', currency: 'SAR', flag: '🇸🇦' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  QA: { name: 'Qatar', dialCode: '+974', currency: 'USD', flag: '🇶🇦' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  KW: { name: 'Kuwait', dialCode: '+965', currency: 'USD', flag: '🇰🇼' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  OM: { name: 'Oman', dialCode: '+968', currency: 'USD', flag: '🇴🇲' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  BH: { name: 'Bahrain', dialCode: '+973', currency: 'USD', flag: '🇧🇭' },
  TR: { name: 'Turkey', dialCode: '+90', currency: 'TRY', flag: '🇹🇷' },
  IL: { name: 'Israel', dialCode: '+972', currency: 'ILS', flag: '🇮🇱' },
  ZA: { name: 'South Africa', dialCode: '+27', currency: 'ZAR', flag: '🇿🇦' },
  CA: { name: 'Canada', dialCode: '+1', currency: 'CAD', flag: '🇨🇦' },
  BR: { name: 'Brazil', dialCode: '+55', currency: 'BRL', flag: '🇧🇷' },
  MX: { name: 'Mexico', dialCode: '+52', currency: 'MXN', flag: '🇲🇽' },
  GB: { name: 'United Kingdom', dialCode: '+44', currency: 'GBP', flag: '🇬🇧' },
  FR: { name: 'France', dialCode: '+33', currency: 'EUR', flag: '🇫🇷' },
  DE: { name: 'Germany', dialCode: '+49', currency: 'EUR', flag: '🇩🇪' },
  ES: { name: 'Spain', dialCode: '+34', currency: 'EUR', flag: '🇪🇸' },
  IT: { name: 'Italy', dialCode: '+39', currency: 'EUR', flag: '🇮🇹' },
  NL: { name: 'Netherlands', dialCode: '+31', currency: 'EUR', flag: '🇳🇱' },
  SE: { name: 'Sweden', dialCode: '+46', currency: 'SEK', flag: '🇸🇪' },
  NO: { name: 'Norway', dialCode: '+47', currency: 'NOK', flag: '🇳🇴' },
  DK: { name: 'Denmark', dialCode: '+45', currency: 'DKK', flag: '🇩🇰' },
  FI: { name: 'Finland', dialCode: '+358', currency: 'EUR', flag: '🇫🇮' },
  PL: { name: 'Poland', dialCode: '+48', currency: 'PLN', flag: '🇵🇱' },
  CZ: { name: 'Czechia', dialCode: '+420', currency: 'CZK', flag: '🇨🇿' },
  HU: { name: 'Hungary', dialCode: '+36', currency: 'HUF', flag: '🇭🇺' },
  AT: { name: 'Austria', dialCode: '+43', currency: 'EUR', flag: '🇦🇹' },
  CH: { name: 'Switzerland', dialCode: '+41', currency: 'CHF', flag: '🇨🇭' },
  BE: { name: 'Belgium', dialCode: '+32', currency: 'EUR', flag: '🇧🇪' },
  IE: { name: 'Ireland', dialCode: '+353', currency: 'EUR', flag: '🇮🇪' },
  PT: { name: 'Portugal', dialCode: '+351', currency: 'EUR', flag: '🇵🇹' },
  GR: { name: 'Greece', dialCode: '+30', currency: 'EUR', flag: '🇬🇷' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  UA: { name: 'Ukraine', dialCode: '+380', currency: 'USD', flag: '🇺🇦' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  KZ: { name: 'Kazakhstan', dialCode: '+7', currency: 'USD', flag: '🇰🇿' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  UZ: { name: 'Uzbekistan', dialCode: '+998', currency: 'USD', flag: '🇺🇿' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  AZ: { name: 'Azerbaijan', dialCode: '+994', currency: 'USD', flag: '🇦🇿' },
  RU: { name: 'Russia', dialCode: '+7', currency: 'RUB', flag: '🇷🇺' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  EG: { name: 'Egypt', dialCode: '+20', currency: 'USD', flag: '🇪🇬' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  MA: { name: 'Morocco', dialCode: '+212', currency: 'USD', flag: '🇲🇦' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  TN: { name: 'Tunisia', dialCode: '+216', currency: 'USD', flag: '🇹🇳' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  DZ: { name: 'Algeria', dialCode: '+213', currency: 'USD', flag: '🇩🇿' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  KE: { name: 'Kenya', dialCode: '+254', currency: 'USD', flag: '🇰🇪' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  NG: { name: 'Nigeria', dialCode: '+234', currency: 'USD', flag: '🇳🇬' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  GH: { name: 'Ghana', dialCode: '+233', currency: 'USD', flag: '🇬🇭' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  ET: { name: 'Ethiopia', dialCode: '+251', currency: 'USD', flag: '🇪🇹' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  AR: { name: 'Argentina', dialCode: '+54', currency: 'USD', flag: '🇦🇷' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  CL: { name: 'Chile', dialCode: '+56', currency: 'USD', flag: '🇨🇱' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  PE: { name: 'Peru', dialCode: '+51', currency: 'USD', flag: '🇵🇪' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  CO: { name: 'Colombia', dialCode: '+57', currency: 'USD', flag: '🇨🇴' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  VE: { name: 'Venezuela', dialCode: '+58', currency: 'USD', flag: '🇻🇪' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  UY: { name: 'Uruguay', dialCode: '+598', currency: 'USD', flag: '🇺🇾' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  PA: { name: 'Panama', dialCode: '+507', currency: 'USD', flag: '🇵🇦' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  CR: { name: 'Costa Rica', dialCode: '+506', currency: 'USD', flag: '🇨🇷' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  DO: { name: 'Dominican Republic', dialCode: '+1', currency: 'USD', flag: '🇩🇴' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  JM: { name: 'Jamaica', dialCode: '+1', currency: 'USD', flag: '🇯🇲' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  CU: { name: 'Cuba', dialCode: '+53', currency: 'USD', flag: '🇨🇺' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  TT: { name: 'Trinidad and Tobago', dialCode: '+1', currency: 'USD', flag: '🇹🇹' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  BB: { name: 'Barbados', dialCode: '+1', currency: 'USD', flag: '🇧🇧' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  BS: { name: 'Bahamas', dialCode: '+1', currency: 'USD', flag: '🇧🇸' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  AG: { name: 'Antigua and Barbuda', dialCode: '+1', currency: 'USD', flag: '🇦🇬' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  LC: { name: 'Saint Lucia', dialCode: '+1', currency: 'USD', flag: '🇱🇨' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  VC: {
    name: 'Saint Vincent and the Grenadines',
    dialCode: '+1',
    currency: 'USD',
    flag: '🇻🇨',
  },
  /** Native currency not in SUPPORTED_CURRENCIES */
  HN: { name: 'Honduras', dialCode: '+504', currency: 'USD', flag: '🇭🇳' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  GT: { name: 'Guatemala', dialCode: '+502', currency: 'USD', flag: '🇬🇹' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  SV: { name: 'El Salvador', dialCode: '+503', currency: 'USD', flag: '🇸🇻' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  NI: { name: 'Nicaragua', dialCode: '+505', currency: 'USD', flag: '🇳🇮' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  PH: { name: 'Philippines', dialCode: '+63', currency: 'USD', flag: '🇵🇭' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  VN: { name: 'Vietnam', dialCode: '+84', currency: 'USD', flag: '🇻🇳' },
  ID: { name: 'Indonesia', dialCode: '+62', currency: 'IDR', flag: '🇮🇩' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  KH: { name: 'Cambodia', dialCode: '+855', currency: 'USD', flag: '🇰🇭' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  LA: { name: 'Laos', dialCode: '+856', currency: 'USD', flag: '🇱🇦' },
  MM: { name: 'Myanmar', dialCode: '+95', currency: 'MMK', flag: '🇲🇲' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  LK: { name: 'Sri Lanka', dialCode: '+94', currency: 'USD', flag: '🇱🇰' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  BD: { name: 'Bangladesh', dialCode: '+880', currency: 'USD', flag: '🇧🇩' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  NP: { name: 'Nepal', dialCode: '+977', currency: 'USD', flag: '🇳🇵' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  PK: { name: 'Pakistan', dialCode: '+92', currency: 'USD', flag: '🇵🇰' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  IR: { name: 'Iran', dialCode: '+98', currency: 'USD', flag: '🇮🇷' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  IQ: { name: 'Iraq', dialCode: '+964', currency: 'USD', flag: '🇮🇶' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  JO: { name: 'Jordan', dialCode: '+962', currency: 'USD', flag: '🇯🇴' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  LB: { name: 'Lebanon', dialCode: '+961', currency: 'USD', flag: '🇱🇧' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  YE: { name: 'Yemen', dialCode: '+967', currency: 'USD', flag: '🇾🇪' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  SY: { name: 'Syria', dialCode: '+963', currency: 'USD', flag: '🇸🇾' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  AF: { name: 'Afghanistan', dialCode: '+93', currency: 'USD', flag: '🇦🇫' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  MN: { name: 'Mongolia', dialCode: '+976', currency: 'USD', flag: '🇲🇳' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  BN: { name: 'Brunei', dialCode: '+673', currency: 'USD', flag: '🇧🇳' },
  AU: { name: 'Australia', dialCode: '+61', currency: 'AUD', flag: '🇦🇺' },
  NZ: { name: 'New Zealand', dialCode: '+64', currency: 'NZD', flag: '🇳🇿' },
  LT: { name: 'Lithuania', dialCode: '+370', currency: 'EUR', flag: '🇱🇹' },
  LV: { name: 'Latvia', dialCode: '+371', currency: 'EUR', flag: '🇱🇻' },
  EE: { name: 'Estonia', dialCode: '+372', currency: 'EUR', flag: '🇪🇪' },
  SK: { name: 'Slovakia', dialCode: '+421', currency: 'EUR', flag: '🇸🇰' },
  SI: { name: 'Slovenia', dialCode: '+386', currency: 'EUR', flag: '🇸🇮' },
  HR: { name: 'Croatia', dialCode: '+385', currency: 'EUR', flag: '🇭🇷' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  RO: { name: 'Romania', dialCode: '+40', currency: 'USD', flag: '🇷🇴' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  BG: { name: 'Bulgaria', dialCode: '+359', currency: 'USD', flag: '🇧🇬' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  RS: { name: 'Serbia', dialCode: '+381', currency: 'USD', flag: '🇷🇸' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  ME: { name: 'Montenegro', dialCode: '+382', currency: 'USD', flag: '🇲🇪' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  MK: { name: 'North Macedonia', dialCode: '+389', currency: 'USD', flag: '🇲🇰' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  AL: { name: 'Albania', dialCode: '+355', currency: 'USD', flag: '🇦🇱' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  BA: { name: 'Bosnia and Herzegovina', dialCode: '+387', currency: 'USD', flag: '🇧🇦' },
  LU: { name: 'Luxembourg', dialCode: '+352', currency: 'EUR', flag: '🇱🇺' },
  CY: { name: 'Cyprus', dialCode: '+357', currency: 'EUR', flag: '🇨🇾' },
  MT: { name: 'Malta', dialCode: '+356', currency: 'EUR', flag: '🇲🇹' },
  LI: { name: 'Liechtenstein', dialCode: '+423', currency: 'CHF', flag: '🇱🇮' },
  MC: { name: 'Monaco', dialCode: '+377', currency: 'EUR', flag: '🇲🇨' },
  SM: { name: 'San Marino', dialCode: '+378', currency: 'EUR', flag: '🇸🇲' },
  AD: { name: 'Andorra', dialCode: '+376', currency: 'EUR', flag: '🇦🇩' },
  VA: { name: 'Vatican City', dialCode: '+379', currency: 'EUR', flag: '🇻🇦' },
  FO: { name: 'Faroe Islands', dialCode: '+298', currency: 'DKK', flag: '🇫🇴' },
  GL: { name: 'Greenland', dialCode: '+299', currency: 'DKK', flag: '🇬🇱' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  SD: { name: 'Sudan', dialCode: '+249', currency: 'USD', flag: '🇸🇩' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  SS: { name: 'South Sudan', dialCode: '+211', currency: 'USD', flag: '🇸🇸' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  LR: { name: 'Liberia', dialCode: '+231', currency: 'USD', flag: '🇱🇷' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  SL: { name: 'Sierra Leone', dialCode: '+232', currency: 'USD', flag: '🇸🇱' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  GM: { name: 'Gambia', dialCode: '+220', currency: 'USD', flag: '🇬🇲' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  ML: { name: 'Mali', dialCode: '+223', currency: 'USD', flag: '🇲🇱' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  NE: { name: 'Niger', dialCode: '+227', currency: 'USD', flag: '🇳🇪' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  TD: { name: 'Chad', dialCode: '+235', currency: 'USD', flag: '🇹🇩' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  CF: { name: 'Central African Republic', dialCode: '+236', currency: 'USD', flag: '🇨🇫' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  GA: { name: 'Gabon', dialCode: '+241', currency: 'USD', flag: '🇬🇦' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  CG: { name: 'Republic of the Congo', dialCode: '+242', currency: 'USD', flag: '🇨🇬' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  CD: {
    name: 'Democratic Republic of the Congo',
    dialCode: '+243',
    currency: 'USD',
    flag: '🇨🇩',
  },
  /** Native currency not in SUPPORTED_CURRENCIES */
  RW: { name: 'Rwanda', dialCode: '+250', currency: 'USD', flag: '🇷🇼' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  BI: { name: 'Burundi', dialCode: '+257', currency: 'USD', flag: '🇧🇮' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  BW: { name: 'Botswana', dialCode: '+267', currency: 'USD', flag: '🇧🇼' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  NA: { name: 'Namibia', dialCode: '+264', currency: 'USD', flag: '🇳🇦' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  ZW: { name: 'Zimbabwe', dialCode: '+263', currency: 'USD', flag: '🇿🇼' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  ZM: { name: 'Zambia', dialCode: '+260', currency: 'USD', flag: '🇿🇲' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  AO: { name: 'Angola', dialCode: '+244', currency: 'USD', flag: '🇦🇴' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  SN: { name: 'Senegal', dialCode: '+221', currency: 'USD', flag: '🇸🇳' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  CI: { name: 'Côte d’Ivoire', dialCode: '+225', currency: 'USD', flag: '🇨🇮' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  BJ: { name: 'Benin', dialCode: '+229', currency: 'USD', flag: '🇧🇯' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  BF: { name: 'Burkina Faso', dialCode: '+226', currency: 'USD', flag: '🇧🇫' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  TG: { name: 'Togo', dialCode: '+228', currency: 'USD', flag: '🇹🇬' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  GN: { name: 'Guinea', dialCode: '+224', currency: 'USD', flag: '🇬🇳' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  GW: { name: 'Guinea-Bissau', dialCode: '+245', currency: 'USD', flag: '🇬🇼' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  SO: { name: 'Somalia', dialCode: '+252', currency: 'USD', flag: '🇸🇴' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  DJ: { name: 'Djibouti', dialCode: '+253', currency: 'USD', flag: '🇩🇯' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  ER: { name: 'Eritrea', dialCode: '+291', currency: 'USD', flag: '🇪🇷' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  MG: { name: 'Madagascar', dialCode: '+261', currency: 'USD', flag: '🇲🇬' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  MU: { name: 'Mauritius', dialCode: '+230', currency: 'USD', flag: '🇲🇺' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  FJ: { name: 'Fiji', dialCode: '+679', currency: 'USD', flag: '🇫🇯' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  PG: { name: 'Papua New Guinea', dialCode: '+675', currency: 'USD', flag: '🇵🇬' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  SB: { name: 'Solomon Islands', dialCode: '+677', currency: 'USD', flag: '🇸🇧' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  VU: { name: 'Vanuatu', dialCode: '+678', currency: 'USD', flag: '🇻🇺' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  WS: { name: 'Samoa', dialCode: '+685', currency: 'USD', flag: '🇼🇸' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  TO: { name: 'Tonga', dialCode: '+676', currency: 'USD', flag: '🇹🇴' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  NR: { name: 'Nauru', dialCode: '+674', currency: 'USD', flag: '🇳🇷' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  TV: { name: 'Tuvalu', dialCode: '+688', currency: 'USD', flag: '🇹🇻' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  KI: { name: 'Kiribati', dialCode: '+686', currency: 'USD', flag: '🇰🇮' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  PW: { name: 'Palau', dialCode: '+680', currency: 'USD', flag: '🇵🇼' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  FM: { name: 'Micronesia', dialCode: '+691', currency: 'USD', flag: '🇫🇲' },
  /** Native currency not in SUPPORTED_CURRENCIES */
  MH: { name: 'Marshall Islands', dialCode: '+692', currency: 'USD', flag: '🇲🇭' },
} as const satisfies Record<string, Omit<Country, 'code'>>;

const seen = new Set<string>();
export const COUNTRIES: Country[] = [];
for (const code of Object.keys(BASE_COUNTRY_MAP)) {
  const upper = code.toUpperCase();
  if (seen.has(upper)) continue;
  seen.add(upper);
  const data = BASE_COUNTRY_MAP[code];
  COUNTRIES.push({ code: upper, ...data });
}

for (const iso of PRIORITY_ISO2) {
  const upper = iso.toUpperCase();
  if (seen.has(upper)) continue;
  const base = BASE_COUNTRY_MAP[upper] ?? BASE_COUNTRY_MAP.TH;
  if (!base) continue;
  COUNTRIES.push({ code: upper, ...base });
  seen.add(upper);
}

export const COUNTRY_BY_CODE: Record<string, Country> = COUNTRIES.reduce(
  (acc, country) => {
    acc[country.code] = country;
    return acc;
  },
  {} as Record<string, Country>,
);

export function getDefaultCountryForLocale(locale?: string): Country {
  if (!locale) return COUNTRY_BY_CODE.TH;
  const normalized = locale.toLowerCase();
  if (normalized.startsWith('th')) return COUNTRY_BY_CODE.TH;
  if (normalized.startsWith('en')) return COUNTRY_BY_CODE.US;
  if (normalized.startsWith('zh-tw')) return COUNTRY_BY_CODE.TW;
  if (normalized.startsWith('zh-cn')) return COUNTRY_BY_CODE.CN;
  if (normalized === 'zh') return COUNTRY_BY_CODE.CN;
  if (normalized.startsWith('zh')) return COUNTRY_BY_CODE.CN;
  if (normalized.startsWith('ru')) return COUNTRY_BY_CODE.RU;
  if (normalized === 'my') return COUNTRY_BY_CODE.MM;
  if (normalized.startsWith('ja')) return COUNTRY_BY_CODE.JP;
  if (normalized.startsWith('ko')) return COUNTRY_BY_CODE.KR;
  if (normalized.startsWith('de')) return COUNTRY_BY_CODE.DE;
  if (normalized.startsWith('fr')) return COUNTRY_BY_CODE.FR;
  if (normalized.startsWith('es')) return COUNTRY_BY_CODE.ES;
  if (normalized.startsWith('ar')) return COUNTRY_BY_CODE.SA;
  return COUNTRY_BY_CODE.TH;
}

export function defaultCurrencyForCountry(code: string): CurrencyCode {
  const country = COUNTRY_BY_CODE[code.toUpperCase()];
  return country?.currency ?? 'THB';
}
