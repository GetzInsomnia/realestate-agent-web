'use client';

import * as React from 'react';
import clsx from 'clsx';

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (value: T) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === 'function') {
        ref(value);
      } else {
        try {
          (ref as React.MutableRefObject<T>).current = value;
        } catch {
          // ignore assignment errors
        }
      }
    }
  };
}

type SelectContextValue = {
  value?: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  contentRef: React.RefObject<HTMLDivElement>;
  registerOption: (value: string, label: React.ReactNode) => void;
  unregisterOption: (value: string) => void;
  getLabel: (value: string | undefined) => React.ReactNode | undefined;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext(component: string): SelectContextValue {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error(`${component} must be used within a Select`);
  }
  return context;
}

type SelectProps = {
  children: React.ReactNode;
  value?: string;
  onValueChange: (value: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

export function Select({
  children,
  value,
  onValueChange,
  open: openProp,
  onOpenChange,
  className,
}: SelectProps) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [options, setOptions] = React.useState<Record<string, React.ReactNode>>({});
  const [internalOpen, setInternalOpen] = React.useState(false);

  const open = openProp ?? internalOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );

  const registerOption = React.useCallback(
    (optionValue: string, label: React.ReactNode) => {
      setOptions((previous) => {
        const next = { ...previous };
        next[optionValue] = label;
        return next;
      });
    },
    [],
  );

  const unregisterOption = React.useCallback((optionValue: string) => {
    setOptions((previous) => {
      if (!(optionValue in previous)) {
        return previous;
      }
      const next = { ...previous };
      delete next[optionValue];
      return next;
    });
  }, []);

  const getLabel = React.useCallback(
    (currentValue: string | undefined) => {
      if (!currentValue) return undefined;
      return options[currentValue];
    },
    [options],
  );

  const contextValue = React.useMemo(
    () => ({
      value,
      onValueChange,
      open,
      setOpen,
      triggerRef,
      contentRef,
      registerOption,
      unregisterOption,
      getLabel,
    }),
    [value, onValueChange, open, setOpen, registerOption, unregisterOption, getLabel],
  );

  return (
    <SelectContext.Provider value={contextValue}>
      <div className={clsx('relative inline-flex flex-col', className)}>{children}</div>
    </SelectContext.Provider>
  );
}

type SelectTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ children, className, onClick, onKeyDown, ...props }, forwardedRef) => {
    const { open, setOpen, triggerRef } = useSelectContext('SelectTrigger');
    const mergedRef = React.useMemo(
      () => mergeRefs(forwardedRef, triggerRef),
      [forwardedRef, triggerRef],
    );

    return (
      <button
        type="button"
        {...props}
        ref={mergedRef}
        className={className}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) {
            setOpen(!open);
          }
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (
            event.key === 'ArrowDown' ||
            event.key === 'ArrowUp' ||
            event.key === 'Enter' ||
            event.key === ' '
          ) {
            event.preventDefault();
            setOpen(true);
          } else if (event.key === 'Escape') {
            if (open) {
              event.preventDefault();
              setOpen(false);
            }
          }
        }}
      >
        {children}
      </button>
    );
  },
);
SelectTrigger.displayName = 'SelectTrigger';

type SelectContentProps = React.HTMLAttributes<HTMLDivElement> & {
  sideOffset?: number;
  position?: 'item' | 'popper';
  align?: 'start' | 'center' | 'end';
};

export const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  (
    { children, className, sideOffset = 4, position: _position, align: _align, ...props },
    forwardedRef,
  ) => {
    const { open, setOpen, triggerRef, contentRef } = useSelectContext('SelectContent');
    const localRef = React.useRef<HTMLDivElement>(null);
    const mergedRef = React.useMemo(
      () => mergeRefs(forwardedRef, contentRef, localRef),
      [forwardedRef, contentRef],
    );

    React.useEffect(() => {
      if (!open) return;

      function handlePointerDown(event: PointerEvent) {
        const target = event.target as Node;
        const trigger = triggerRef.current;
        const content = localRef.current;
        if (trigger?.contains(target) || content?.contains(target)) {
          return;
        }
        setOpen(false);
      }

      function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
          setOpen(false);
          triggerRef.current?.focus();
        }
      }

      document.addEventListener('pointerdown', handlePointerDown, true);
      document.addEventListener('keydown', handleKeyDown, true);
      return () => {
        document.removeEventListener('pointerdown', handlePointerDown, true);
        document.removeEventListener('keydown', handleKeyDown, true);
      };
    }, [open, setOpen, triggerRef]);

    if (!open) {
      return null;
    }

    return (
      <div
        {...props}
        ref={mergedRef}
        className={clsx(
          'absolute left-0 top-full z-50 mt-[var(--select-offset,0px)] w-max origin-top',
          className,
        )}
        data-position={_position}
        data-align={_align}
        style={{
          ...(props.style ?? {}),
          // allow Tailwind classes to control width while keeping offset configurable
          // set CSS variable to allow precise offset handling
          // fallback to provided sideOffset when className doesn't set margin
          // consumers can override by setting their own margin utilities
          ...(sideOffset
            ? ({
                '--select-offset': `${sideOffset}px`,
              } as React.CSSProperties)
            : {}),
        }}
        role="listbox"
      >
        {children}
      </div>
    );
  },
);
SelectContent.displayName = 'SelectContent';

type SelectViewportProps = React.HTMLAttributes<HTMLDivElement>;

export const SelectViewport = React.forwardRef<HTMLDivElement, SelectViewportProps>(
  ({ className, ...props }, ref) => {
    return <div {...props} ref={ref} className={clsx('flex flex-col', className)} />;
  },
);
SelectViewport.displayName = 'SelectViewport';

type SelectItemContextValue = {
  selected: boolean;
};

const SelectItemContext = React.createContext<SelectItemContextValue>({
  selected: false,
});

type SelectItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
  textValue?: string;
};

export const SelectItem = React.forwardRef<HTMLButtonElement, SelectItemProps>(
  (
    { value, textValue, className, children, onClick, onKeyDown, ...props },
    forwardedRef,
  ) => {
    const {
      value: selectedValue,
      onValueChange,
      setOpen,
      registerOption,
      unregisterOption,
    } = useSelectContext('SelectItem');
    const isSelected = selectedValue === value;

    React.useEffect(() => {
      registerOption(value, textValue ?? value);
      return () => unregisterOption(value);
    }, [registerOption, unregisterOption, value, textValue]);

    return (
      <SelectItemContext.Provider value={{ selected: isSelected }}>
        <button
          type="button"
          role="option"
          aria-selected={isSelected}
          data-state={isSelected ? 'checked' : 'unchecked'}
          {...props}
          ref={forwardedRef}
          className={clsx('relative pr-5', className)}
          onClick={(event) => {
            onClick?.(event);
            if (event.defaultPrevented) return;
            onValueChange(value);
            setOpen(false);
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.defaultPrevented) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onValueChange(value);
              setOpen(false);
            }
          }}
        >
          {children}
        </button>
      </SelectItemContext.Provider>
    );
  },
);
SelectItem.displayName = 'SelectItem';

type SelectItemIndicatorProps = React.HTMLAttributes<HTMLSpanElement>;

export const SelectItemIndicator = React.forwardRef<
  HTMLSpanElement,
  SelectItemIndicatorProps
>(({ className, children, ...props }, ref) => {
  const { selected } = React.useContext(SelectItemContext);
  if (!selected) {
    return null;
  }
  return (
    <span
      {...props}
      ref={ref}
      className={clsx(
        'pointer-events-none absolute right-1 flex h-3.5 w-3.5 items-center justify-center',
        className,
      )}
      data-state="checked"
    >
      {children}
    </span>
  );
});
SelectItemIndicator.displayName = 'SelectItemIndicator';

type SelectValueProps = React.HTMLAttributes<HTMLSpanElement> & {
  placeholder?: React.ReactNode;
};

export const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ className, placeholder, ...props }, ref) => {
    const { value, getLabel } = useSelectContext('SelectValue');
    const label = getLabel(value);
    return (
      <span {...props} ref={ref} className={className}>
        {label ?? placeholder ?? null}
      </span>
    );
  },
);
SelectValue.displayName = 'SelectValue';
