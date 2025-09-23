import Link from "next/link";
import { cn } from "@/lib/utils";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export default function Breadcrumbs({
  homeLabel,
  homeHref,
  items,
}: {
  homeLabel: string;
  homeHref: string;
  items: BreadcrumbItem[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-2 text-slate-500">
        <li>
          <Link href={homeHref} className="font-medium text-slate-600 transition hover:text-brand-600">
            {homeLabel}
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            <span className="text-slate-400">/</span>
            {item.href && index !== items.length - 1 ? (
              <Link
                href={item.href}
                className={cn("transition hover:text-brand-600", "text-slate-600")}
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-800">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
