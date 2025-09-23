"use client";

import type { AbstractIntlMessages } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { defaultSWRConfig } from "@/lib/swr-config";

type Props = {
  locale: string;
  messages: AbstractIntlMessages;
  fallback: Record<string, unknown>;
  children: ReactNode;
};

export default function Providers({ locale, messages, fallback, children }: Props) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} now={new Date()}>
      <SWRConfig value={{ ...defaultSWRConfig, fallback }}>{children}</SWRConfig>
    </NextIntlClientProvider>
  );
}
