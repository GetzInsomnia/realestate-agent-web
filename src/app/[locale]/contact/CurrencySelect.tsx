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
  const labelRelationship = id ? `${labelledBy} ${id}` : labelledBy;

  return (
    <Select
      open={open}
      onOpenChange={setOpen}
      value={value}
      onValueChange={(next) => {
        onChange(next as CurrencyCode);
        setOpen(false);
      }}
      className="w-full"
    >
      <SelectTrigger
        id={id}
        aria-label="Currency"
        aria-labelledby={labelRelationship}
        className={clsx(
          'flex h-10 w-full items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200',
          className,
        )}
      >
        <span className="font-mono tabular-nums">{value}</span>
        <ChevronDownIcon aria-hidden className="h-4 w-4 opacity-60" />
      </SelectTrigger>

      <SelectContent
        sideOffset={6}
        className="min-w-[220px] max-w-[260px] overflow-x-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
      >
        <SelectViewport className="max-h-72 overflow-y-auto py-1 [scrollbar-gutter:stable]">
          {SUPPORTED_CURRENCIES.map((code) => (
            <SelectItem
              key={code}
              value={code}
              textValue={code}
              className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors data-[state=checked]:bg-brand-50 data-[state=checked]:text-brand-700"
            >
              <div className="flex items-center font-mono tabular-nums">
                <span>{code}</span>
                {/* Keep checkmark tight to the currency code and align consistently */}
                <SelectItemIndicator className="ml-1 inline-flex text-brand-600">
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
