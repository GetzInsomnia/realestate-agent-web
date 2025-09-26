import { COUNTRIES as BASE_COUNTRIES } from '@/lib/countries';

export type Country = {
  code: string;
  name: string;
  dialCode: string;
};

export const COUNTRIES: Country[] = BASE_COUNTRIES.map(({ code, name, dialCode }) => ({
  code,
  name,
  dialCode,
}));
