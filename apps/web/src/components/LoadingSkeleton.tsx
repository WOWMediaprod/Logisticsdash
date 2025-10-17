interface LoadingSkeletonProps {
  className?: string;
}

export function LoadingSkeleton({ className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`}></div>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="glass p-6 rounded-2xl">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <LoadingSkeleton className="h-6 w-20" />
          <LoadingSkeleton className="h-5 w-16" />
        </div>
        <LoadingSkeleton className="h-8 w-8 rounded-full" />
      </div>

      <div className="mb-4">
        <LoadingSkeleton className="h-6 w-48 mb-2" />
        <LoadingSkeleton className="h-4 w-64" />
      </div>

      <div className="space-y-3 mb-4">
        <div className="p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between">
            <LoadingSkeleton className="h-4 w-24" />
            <LoadingSkeleton className="h-4 w-32" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <LoadingSkeleton className="h-4 w-28" />
        <LoadingSkeleton className="h-4 w-28" />
      </div>
    </div>
  );
}

export function SummaryCardSkeleton() {
  return (
    <div className="glass p-6 rounded-2xl">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <LoadingSkeleton className="h-4 w-24 mb-2" />
          <LoadingSkeleton className="h-8 w-16" />
        </div>
        <LoadingSkeleton className="w-12 h-12 rounded-xl" />
      </div>
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="w-full h-96 bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-center">
        <LoadingSkeleton className="w-8 h-8 rounded-full mx-auto mb-2" />
        <LoadingSkeleton className="h-4 w-24 mx-auto" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-12 space-y-10">
        {/* Header skeleton */}
        <header className="text-center max-w-4xl mx-auto space-y-4">
          <LoadingSkeleton className="h-10 w-96 mx-auto" />
          <LoadingSkeleton className="h-6 w-[600px] mx-auto" />
          <div className="flex flex-wrap justify-center gap-4">
            <LoadingSkeleton className="h-12 w-40" />
            <LoadingSkeleton className="h-12 w-32" />
            <LoadingSkeleton className="h-12 w-36" />
          </div>
        </header>

        {/* Summary cards skeleton */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SummaryCardSkeleton key={i} />
          ))}
        </div>

        {/* Status filter skeleton */}
        <section className="glass p-6 rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <LoadingSkeleton className="h-6 w-32" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-10 w-24" />
              ))}
            </div>
          </div>
        </section>

        {/* Job cards skeleton */}
        <section className="grid lg:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </section>
      </div>
    </main>
  );
}