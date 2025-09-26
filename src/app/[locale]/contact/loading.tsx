import Skeleton from '@/components/ui/Skeleton';

export default function ContactLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <Skeleton className="h-4 w-40" />
      <div className="mt-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="mt-10 rounded-3xl border border-slate-200/60 bg-white/80 p-8 shadow-soft">
        <div className="space-y-6">
          <Skeleton className="h-4 w-3/4" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Skeleton className="h-4 w-28" />
              <div className="flex gap-2">
                <Skeleton className="h-11 w-48" />
                <Skeleton className="h-11 flex-1" />
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-11 w-20 sm:w-24" />
                <Skeleton className="h-11 flex-1" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-16 w-full max-w-sm" />
            <Skeleton className="h-11 w-40 rounded-full" />
          </div>
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
    </div>
  );
}
