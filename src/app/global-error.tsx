'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-center text-slate-700">
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-sm">We could not render this page. Please try again.</p>
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-500"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
