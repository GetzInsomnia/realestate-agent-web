import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocaleSwitcher from '@/app/[locale]/components/LocaleSwitcher';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/articles',
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next-intl', async () => {
  const actual = await vi.importActual<typeof import('next-intl')>('next-intl');
  return {
    ...actual,
    useLocale: () => 'en',
  };
});

describe('LocaleSwitcher', () => {
  beforeEach(() => {
    replaceMock.mockClear();
    window.location.hash = '#hero';
  });

  it('preserves the current path and hash when switching locale', async () => {
    render(<LocaleSwitcher />);
    const select = screen.getByRole('combobox', { name: /switch language/i });
    await userEvent.selectOptions(select, 'th');
    expect(replaceMock).toHaveBeenCalledWith('/th/articles#hero', { scroll: false });
  });
});
