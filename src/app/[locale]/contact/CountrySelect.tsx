'use client';

import * as React from 'react';
import clsx from 'clsx';
import 'flag-icons/css/flag-icons.min.css';

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemIndicator,
} from '@/components/ui/select';

import type { Country } from './countries';
import { CheckIcon, ChevronDownIcon } from './icons';

type CountrySelectProps = {
  countries: Country[];
  value: string;
  onChange: (country: Country) => void;
  labelledBy: string;
  id?: string;
};

export default function CountrySelect({
  countries,
  value,
  onChange,
  labelledBy,
  id,
}: CountrySelectProps) {
  const [open, setOpen] = React.useState(false);

  const options = React.useMemo(() => {
    return [...countries].sort((a, b) => {
      const aDial = Number(String(a.dialCode).replace(/[^\d]/g, ''));
      const bDial = Number(String(b.dialCode).replace(/[^\d]/g, ''));
      if (!Number.isNaN(aDial) && !Number.isNaN(bDial) && aDial !== bDial) {
        return aDial - bDial;
      }
      if (!Number.isNaN(aDial) && Number.isNaN(bDial)) return -1;
      if (Number.isNaN(aDial) && !Number.isNaN(bDial)) return 1;
      const dialCompare = a.dialCode.localeCompare(b.dialCode);
      if (dialCompare !== 0) return dialCompare;
      return a.code.localeCompare(b.code);
    });
  }, [countries]);

  const selected = React.useMemo(() => {
    return options.find((country) => country.code === value) ?? options[0];
  }, [options, value]);

  if (!options.length || !selected) {
    return null;
  }

  const labelRelationship = id ? `${labelledBy} ${id}` : labelledBy;

  return (
    <Select
      open={open}
      onOpenChange={setOpen}
      value={selected.code}
      onValueChange={(code) => {
        const next = options.find((country) => country.code === code);
        if (next) {
          onChange(next);
          setOpen(false);
        }
      }}
    >
      <SelectTrigger
        id={id}
        aria-label={selected ? `${selected.name} (${selected.dialCode})` : 'Country code'}
        aria-labelledby={labelRelationship}
        className="flex h-10 min-w-[100px] items-center justify-between gap-1 rounded-2xl border border-slate-200 bg-white px-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden className="shrink-0">
            <span
              className={clsx(
                `fi fi-${selected.code.toLowerCase()}`,
                'block h-4 w-5 rounded-sm',
              )}
            />
          </span>
          <span className="text-sm font-medium tabular-nums">{selected.dialCode}</span>
        </div>
        <ChevronDownIcon aria-hidden className="h-4 w-4 opacity-60" />
      </SelectTrigger>

      <SelectContent
        sideOffset={6}
        className="min-w-[220px] max-w-[260px] overflow-x-hidden overflow-y-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
      >
        <SelectViewport className="max-h-72 overflow-y-auto py-1 [scrollbar-gutter:stable]">
          {options.map((country) => (
            <SelectItem
              key={country.code}
              value={country.code}
              textValue={country.dialCode}
              className="flex cursor-pointer items-center gap-2 rounded-xl py-2 pl-2 pr-2 text-left text-sm text-slate-700 transition-colors data-[state=checked]:bg-brand-50 data-[state=checked]:text-brand-700"
            >
              <span aria-hidden className="shrink-0">
                <span
                  className={clsx(
                    `fi fi-${country.code.toLowerCase()}`,
                    'block h-4 w-5 rounded-sm',
                  )}
                />
              </span>
              {/* dial code + tight checkmark */}
              <span className="inline-flex items-center">
                <span className="text-sm tabular-nums">{country.dialCode}</span>
                <SelectItemIndicator className="ml-1 inline-flex text-brand-600">
                  <CheckIcon aria-hidden className="h-4 w-4" />
                </SelectItemIndicator>
              </span>
              <span className="sr-only">{country.name}</span>
            </SelectItem>
          ))}
        </SelectViewport>
      </SelectContent>
    </Select>
  );
}
