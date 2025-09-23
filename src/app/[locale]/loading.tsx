export default function LocaleLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-3xl bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100"
          />
        ))}
      </div>
    </div>
  );
}
