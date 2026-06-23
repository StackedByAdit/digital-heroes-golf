function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 ${className ?? ''}`} />;
}

export function DashboardOverviewSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <SkeletonBlock className="h-9 w-48" />
        <SkeletonBlock className="mt-2 h-4 w-80" />
      </div>
      <div className="grid grid-cols-12 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="col-span-12 h-36 sm:col-span-6 xl:col-span-3" />
        ))}
      </div>
      <div className="grid grid-cols-12 gap-6">
        <SkeletonBlock className="col-span-12 h-96 lg:col-span-7" />
        <SkeletonBlock className="col-span-12 h-96 lg:col-span-5" />
      </div>
      <SkeletonBlock className="h-64" />
      <SkeletonBlock className="h-72" />
    </div>
  );
}

export function ScoresPageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SkeletonBlock className="h-9 w-40" />
      <SkeletonBlock className="h-4 w-72" />
      <SkeletonBlock className="h-40" />
      <SkeletonBlock className="h-80" />
    </div>
  );
}

export function DrawsPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <SkeletonBlock className="h-9 w-48" />
      <SkeletonBlock className="h-4 w-64" />
      <SkeletonBlock className="h-72" />
    </div>
  );
}

export function CharityPageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SkeletonBlock className="h-9 w-40" />
      <SkeletonBlock className="h-4 w-72" />
      <SkeletonBlock className="h-64" />
    </div>
  );
}

export function AccountPageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SkeletonBlock className="h-9 w-56" />
      <SkeletonBlock className="h-4 w-80" />
      <SkeletonBlock className="h-56" />
      <SkeletonBlock className="h-48" />
      <SkeletonBlock className="h-44" />
    </div>
  );
}
