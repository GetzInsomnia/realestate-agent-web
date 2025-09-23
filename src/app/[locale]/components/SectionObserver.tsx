"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const SectionObserverContext = createContext<{
  activeSection: string;
} | null>(null);

function SectionObserver({ sectionIds, onChange }: { sectionIds: string[]; onChange: (id: string) => void }) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));
        if (visible[0]) {
          onChange(visible[0].target.id);
        }
      },
      {
        threshold: [0.2, 0.4, 0.6],
        rootMargin: "-20% 0px -35% 0px",
      },
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [sectionIds, onChange]);

  return null;
}

export function SectionObserverProvider({
  sectionIds,
  children,
}: {
  sectionIds: string[];
  children: ReactNode;
}) {
  const [activeSection, setActiveSection] = useState(sectionIds[0] ?? "hero");

  useEffect(() => {
    document.body.dataset.activeSection = activeSection;
    return () => {
      delete document.body.dataset.activeSection;
    };
  }, [activeSection]);

  const value = useMemo(() => ({ activeSection }), [activeSection]);

  return (
    <SectionObserverContext.Provider value={value}>
      {children}
      <SectionObserver sectionIds={sectionIds} onChange={setActiveSection} />
    </SectionObserverContext.Provider>
  );
}

export function useActiveSection() {
  const context = useContext(SectionObserverContext);
  if (!context) {
    throw new Error("useActiveSection must be used within SectionObserverProvider");
  }
  return context.activeSection;
}
