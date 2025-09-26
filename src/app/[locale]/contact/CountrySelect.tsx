'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'flag-icons/css/flag-icons.min.css';

import { CheckIcon, ChevronDownIcon } from './icons';
import type { Country } from './countries';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => {
    const index = countries.findIndex((country) => country.code === value);
    return index >= 0 ? index : 0;
  });
  const activeIndexRef = useRef(activeIndex);

  const selected = useMemo(() => {
    return countries.find((country) => country.code === value) ?? countries[0];
  }, [countries, value]);

  useEffect(() => {
    const nextIndex = countries.findIndex((country) => country.code === value);
    setActiveIndex(nextIndex >= 0 ? nextIndex : 0);
  }, [countries, value]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const focusOption = useCallback(
    (index: number, { scroll = false }: { scroll?: boolean } = {}) => {
      const node = optionRefs.current[index];
      if (!node) return;
      if (scroll) {
        node.focus();
        node.scrollIntoView({ block: 'nearest' });
      } else {
        node.focus({ preventScroll: true });
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      focusOption(activeIndexRef.current, { scroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [focusOption, open]);

  useEffect(() => {
    function onDocumentPointerDown(event: PointerEvent) {
      if (!open) return;
      const container = containerRef.current;
      if (container && !container.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', onDocumentPointerDown, true);
    return () => document.removeEventListener('pointerdown', onDocumentPointerDown, true);
  }, [open]);

  useEffect(() => {
    optionRefs.current = new Array(countries.length);
  }, [countries.length]);

  if (!countries.length || !selected) {
    return null;
  }

  const triggerLabel = `${selected.name} (${selected.dialCode})`;
  const labelRelationship = id ? `${labelledBy} ${id}` : labelledBy;
  const baseId = id ?? 'country-select';
  const activeOptionId =
    open && countries[activeIndex]
      ? `${baseId}-option-${countries[activeIndex].code.toLowerCase()}`
      : undefined;

  return (
    <div
      ref={containerRef}
      className="relative w-[86px] min-w-[86px]"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        id={id}
        ref={triggerRef}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelRelationship}
        aria-label={triggerLabel}
        className="flex w-full items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2.5 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        onClick={() => {
          const index = countries.findIndex((country) => country.code === selected.code);
          setActiveIndex(index >= 0 ? index : 0);
          setOpen((prev) => !prev);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const index = countries.findIndex(
              (country) => country.code === selected.code,
            );
            setActiveIndex(index >= 0 ? index : 0);
            setOpen(true);
          } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            const index = countries.findIndex(
              (country) => country.code === selected.code,
            );
            const nextIndex = index >= 0 ? index : 0;
            if (open) {
              setOpen(false);
            } else {
              setActiveIndex(nextIndex);
              setOpen(true);
            }
          } else if (event.key === 'Escape') {
            if (open) {
              event.preventDefault();
              setOpen(false);
            }
          }
        }}
      >
        <span
          className={`fi fi-${selected.code.toLowerCase()} block h-4 w-5 rounded-sm`}
          aria-hidden="true"
        />
        <span className="flex-1 truncate font-mono tabular-nums text-slate-700">
          {selected.dialCode}
        </span>
        <ChevronDownIcon aria-hidden="true" className="h-4 w-4 text-slate-400" />
        <span className="sr-only">{selected.name}</span>
      </button>
      {open && (
        <div
          role="listbox"
          id={`${baseId}-listbox`}
          tabIndex={-1}
          aria-activedescendant={activeOptionId}
          className="absolute left-0 z-20 mt-1 max-h-64 w-max min-w-[240px] overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg [scrollbar-gutter:stable]"
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActiveIndex((index) => {
                const nextIndex = index + 1 < countries.length ? index + 1 : 0;
                requestAnimationFrame(() => focusOption(nextIndex, { scroll: true }));
                return nextIndex;
              });
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((index) => {
                const nextIndex = index - 1 >= 0 ? index - 1 : countries.length - 1;
                requestAnimationFrame(() => focusOption(nextIndex, { scroll: true }));
                return nextIndex;
              });
            } else if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              const next = countries[activeIndexRef.current];
              if (next) {
                onChange(next);
                setOpen(false);
                setActiveIndex(
                  countries.findIndex((country) => country.code === next.code),
                );
                requestAnimationFrame(() => {
                  triggerRef.current?.focus();
                });
              }
            } else if (event.key === 'Escape') {
              event.preventDefault();
              setOpen(false);
              triggerRef.current?.focus();
            }
          }}
        >
          {countries.map((country, index) => {
            const isSelected = country.code === selected.code;
            const isActive = index === activeIndex;
            const optionId = `${baseId}-option-${country.code.toLowerCase()}`;
            return (
              <button
                key={country.code}
                id={optionId}
                type="button"
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                role="option"
                aria-selected={isSelected}
                className={`w-full rounded-xl px-2.5 py-2 text-left text-sm transition-colors hover:bg-slate-50 focus:outline-none ${
                  isActive && !isSelected ? 'bg-slate-100' : ''
                } ${
                  isSelected
                    ? 'bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-200'
                    : 'text-slate-700'
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  onChange(country);
                  setOpen(false);
                  setActiveIndex(index);
                  requestAnimationFrame(() => {
                    triggerRef.current?.focus();
                  });
                }}
              >
                <div className="grid w-full grid-cols-[1.5rem_auto_1rem] items-center gap-1.5 text-left">
                  <span
                    className={`fi fi-${country.code.toLowerCase()} block h-4 w-5 rounded-sm`}
                    aria-hidden="true"
                  />
                  <span
                    className={`min-w-0 font-mono tabular-nums ${
                      isSelected ? '' : 'text-slate-700'
                    }`}
                  >
                    {country.dialCode}
                  </span>
                  {isSelected && (
                    <CheckIcon
                      aria-hidden="true"
                      className="h-4 w-4 justify-self-end text-brand-600"
                    />
                  )}
                  <span className="sr-only">{country.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
