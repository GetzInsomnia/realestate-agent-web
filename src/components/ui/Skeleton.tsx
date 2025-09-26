import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('animate-pulse rounded-xl bg-slate-200/80', className)}
      {...props}
    />
  ),
);

Skeleton.displayName = 'Skeleton';

export { Skeleton };
export default Skeleton;
