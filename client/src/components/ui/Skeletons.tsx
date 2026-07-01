import clsx from 'clsx';

// ─── SkeletonBlock ────────────────────────────────────────────────────────────
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={clsx('skeleton h-4', className)} />;
}

// ─── UserCardSkeleton ─────────────────────────────────────────────────────────
export function UserCardSkeleton() {
  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="flex items-start gap-4">
        <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-32 h-5" />
          <Skeleton className="w-48 h-4" />
          <div className="flex gap-2 mt-3">
            <Skeleton className="w-20 h-6 rounded-full" />
            <Skeleton className="w-24 h-6 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MessageSkeleton ──────────────────────────────────────────────────────────
export function MessageSkeleton() {
  return (
    <div className="space-y-4 px-4 py-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={clsx('flex gap-3', i % 2 === 0 ? 'flex-row-reverse' : 'flex-row')}
        >
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          <Skeleton
            className={clsx(
              'h-10 rounded-2xl',
              i % 2 === 0 ? 'w-48' : 'w-64'
            )}
          />
        </div>
      ))}
    </div>
  );
}

// ─── ConversationSkeleton ─────────────────────────────────────────────────────
export function ConversationSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-48 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ProfileSkeleton ──────────────────────────────────────────────────────────
export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="glass-card p-6 flex items-center gap-6">
        <Skeleton className="w-24 h-24 rounded-full" />
        <div className="space-y-3 flex-1">
          <Skeleton className="w-40 h-6" />
          <Skeleton className="w-56 h-4" />
          <Skeleton className="w-full h-4" />
        </div>
      </div>
      <div className="glass-card p-6 space-y-3">
        <Skeleton className="w-24 h-5" />
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="w-24 h-7 rounded-full" />)}
        </div>
      </div>
    </div>
  );
}
