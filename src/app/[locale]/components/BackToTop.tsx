"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 320);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-6 right-6 z-50 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2 focus:ring-brand-200",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!visible}
    >
      ↑
      <span className="sr-only">Back to top</span>
    </button>
  );
}
