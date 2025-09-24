import { redirect } from 'next/navigation';
import { fallbackLocale } from '@/lib/i18n';

export default function RootNotFound() {
  redirect(`/${fallbackLocale}`);
}
