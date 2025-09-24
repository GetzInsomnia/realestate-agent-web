import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocaleError from '@/app/[locale]/error';
import messages from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

describe('Locale error boundary', () => {
  it('renders translated copy and triggers reset', async () => {
    const reset = vi.fn();
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <LocaleError error={new Error('test')} reset={reset} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText(messages.errors.title)).toBeInTheDocument();
    const button = screen.getByRole('button', { name: messages.errors.tryAgain });
    await userEvent.click(button);
    expect(reset).toHaveBeenCalled();
  });
});
