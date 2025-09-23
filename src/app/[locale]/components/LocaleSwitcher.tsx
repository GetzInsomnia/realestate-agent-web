"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { getLocaleLabel, locales } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [hash, setHash] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setHash(window.location.hash ?? "");
  }, [pathname]);

  const pathWithoutLocale = useMemo(() => {
    if (!pathname) return "";
    const segments = pathname.split("/").filter(Boolean);
    return segments.slice(1).join("/");
  }, [pathname]);

  return (
    <label className={cn("flex items-center gap-2 text-sm", className)}>
      <span className="sr-only">Switch language</span>
      <select
        className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-sm font-medium shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        value={locale}
        aria-label="Switch language"
        onChange={(event) => {
          const nextLocale = event.target.value;
          startTransition(() => {
            const suffix = pathWithoutLocale ? `/${pathWithoutLocale}` : "";
            router.push(`/${nextLocale}${suffix}${hash}`);
          });
        }}
        disabled={isPending}
      >
        {locales.map((availableLocale) => (
          <option key={availableLocale} value={availableLocale}>
            {getLocaleLabel(availableLocale)}
          </option>
        ))}
      </select>
    </label>
  );
}
