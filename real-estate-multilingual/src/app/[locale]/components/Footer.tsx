import Link from "next/link";

export type FooterLink = {
  label: string;
  href: string;
};

export default function Footer({
  tagline,
  legal,
  nav,
}: {
  tagline: string;
  legal: string;
  nav: FooterLink[];
}) {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50/70 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-xl font-semibold text-slate-800">ZomZom Property</p>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">{tagline}</p>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm text-slate-600">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-brand-600">
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-slate-400">{legal}</p>
      </div>
    </footer>
  );
}
