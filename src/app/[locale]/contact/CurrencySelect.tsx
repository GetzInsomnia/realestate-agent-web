'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SUPPORTED_CURRENCIES, type CurrencyCode } from '@/lib/forex';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [open, setOpen] = useState(false);
  const initialIndex = useMemo(() => {
    const index = SUPPORTED_CURRENCIES.indexOf(value);
    return index >= 0 ? index : 0;
  }, [value]);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const activeIndexRef = useRef(activeIndex);

  const selected = SUPPORTED_CURRENCIES[initialIndex] ?? SUPPORTED_CURRENCIES[0];

  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    optionRefs.current = new Array(SUPPORTED_CURRENCIES.length);
  }, []);

  const focusOption = useCallback((index: number, { scroll = false } = {}) => {
    const node = optionRefs.current[index];
    if (!node) return;
    if (scroll) {
      node.focus();
      node.scrollIntoView({ block: 'nearest' });
    } else {
      node.focus({ preventScroll: true });
    }
  }, []);

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

  const labelRelationship = id ? `${labelledBy} ${id}` : labelledBy;
  const baseId = id ?? 'currency-select';
  const activeOptionId = open
    ? `${baseId}-option-${SUPPORTED_CURRENCIES[activeIndexRef.current]?.toLowerCase()}`
    : undefined;

  return (
    <div
      ref={containerRef}
      className={`relative ${className ?? ''}`}
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
        aria-controls={open ? `${baseId}-listbox` : undefined}
        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        onClick={() => {
          const index = SUPPORTED_CURRENCIES.indexOf(selected);
          setActiveIndex(index >= 0 ? index : 0);
          setOpen((prev) => !prev);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const index = SUPPORTED_CURRENCIES.indexOf(selected);
            setActiveIndex(index >= 0 ? index : 0);
            setOpen(true);
          } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            const index = SUPPORTED_CURRENCIES.indexOf(selected);
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
        <span className="font-mono tabular-nums">{selected}</span>
        <svg
          aria-hidden="true"
          className="h-4 w-4 text-slate-400"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div
          role="listbox"
          id={`${baseId}-listbox`}
          tabIndex={-1}
          aria-activedescendant={activeOptionId}
          aria-labelledby={labelRelationship}
          className="absolute left-0 right-0 z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg [scrollbar-gutter:stable]"
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActiveIndex((index) => {
                const nextIndex = index + 1 < SUPPORTED_CURRENCIES.length ? index + 1 : 0;
                requestAnimationFrame(() => focusOption(nextIndex, { scroll: true }));
                return nextIndex;
              });
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((index) => {
                const nextIndex =
                  index - 1 >= 0 ? index - 1 : SUPPORTED_CURRENCIES.length - 1;
                requestAnimationFrame(() => focusOption(nextIndex, { scroll: true }));
                return nextIndex;
              });
            } else if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              const next = SUPPORTED_CURRENCIES[activeIndexRef.current];
              if (next) {
                onChange(next);
                setOpen(false);
                setActiveIndex(SUPPORTED_CURRENCIES.indexOf(next));
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
          {SUPPORTED_CURRENCIES.map((code, index) => {
            const isSelected = code === selected;
            const isActive = index === activeIndex;
            const optionId = `${baseId}-option-${code.toLowerCase()}`;
            return (
              <button
                key={code}
                id={optionId}
                type="button"
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                role="option"
                aria-selected={isSelected}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors focus:outline-none ${
                  isActive ? 'bg-slate-100' : 'hover:bg-slate-50'
                } ${isSelected ? 'text-brand-600' : 'text-slate-700'}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  onChange(code);
                  setOpen(false);
                  setActiveIndex(index);
                  requestAnimationFrame(() => {
                    triggerRef.current?.focus();
                  });
                }}
              >
                <span className="font-mono tabular-nums">{code}</span>
                {isSelected ? (
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4 text-brand-500"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 10.5L8.5 14L15 7"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span aria-hidden="true" className="h-4 w-4" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
