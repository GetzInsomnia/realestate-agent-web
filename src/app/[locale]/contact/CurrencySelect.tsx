'use client';

import * as React from 'react';
import clsx from 'clsx';

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemIndicator,
  SelectValue,
} from '@/components/ui/select';
import { SUPPORTED_CURRENCIES, type CurrencyCode } from '@/lib/forex';

import { CheckIcon, ChevronDownIcon } from './icons';

type CurrencySelectProps = {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
  labelledBy: string;
  id?: string;
  className?: string;
};

export default function CurrencySelect({
  value,
  onChange,
  labelledBy,
  id,
  className,
}: CurrencySelectProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const labelRelationship = id ? `${labelledBy} ${id}` : labelledBy;

  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      const inTrigger = !!triggerRef.current?.contains(target as Node);
      const portalEl = document.querySelector(
        '[data-currency-portal]',
      ) as HTMLElement | null;
      const inPortal = !!portalEl?.contains(target as Node);

      if (!inTrigger && !inPortal) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [open]);

  const handleValueChange = (next: string) => {
    onChange(next as CurrencyCode);
    setOpen(false);
  };

  return (
    <Select
      open={open}
      onOpenChange={setOpen}
      value={value}
      onValueChange={handleValueChange}
      className="inline-block w-auto"
    >
      <SelectTrigger
        ref={triggerRef}
        id={id}
        aria-label="Currency"
        aria-labelledby={labelRelationship}
        data-radix-select-trigger
        className={clsx(
          // let the trigger flex with its grid/flex parent
          'inline-flex h-10 w-auto min-w-0 items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200',
          className,
        )}
      >
        {/* never wrap or ellipsize the code/symbol */}
        <SelectValue
          className="whitespace-nowrap font-mono tabular-nums"
          placeholder={value}
        />
        <ChevronDownIcon aria-hidden className="h-4 w-4 opacity-60" />
      </SelectTrigger>

      {/* respect small screens without overflowing */}
      <SelectContent
        position="popper"
        align="start"
        sideOffset={6}
        className="w-auto min-w-[5rem] max-w-[90vw] p-0"
        data-currency-portal
      >
        <SelectViewport className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1 shadow-lg [scrollbar-gutter:stable]">
          {SUPPORTED_CURRENCIES.map((code) => (
            <SelectItem
              key={code}
              value={code}
              textValue={code}
              className="flex w-full cursor-pointer items-center gap-2 rounded-xl py-2 pl-3 text-left text-sm font-medium text-slate-700 transition-colors data-[state=checked]:bg-brand-50 data-[state=checked]:text-brand-700"
            >
              <div className="flex items-center font-mono tabular-nums">
                <span className="tabular-nums">{code}</span>
                <SelectItemIndicator className="text-brand-600">
                  <CheckIcon aria-hidden className="h-4 w-4" />
                </SelectItemIndicator>
              </div>
            </SelectItem>
          ))}
        </SelectViewport>
      </SelectContent>
    </Select>
  );
}
