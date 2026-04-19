export default function Loading() {
  return (
    <div className="w-full space-y-3 animate-pulse">
      {/* Title skeleton */}
      <div className="h-6 w-36 bg-[#222] rounded" />

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-[#111] border border-[#222] rounded-[10px] p-4 md:p-5 space-y-3 min-h-[90px]">
            <div className="h-3 w-16 bg-[#222] rounded" />
            <div className="h-8 w-12 bg-[#222] rounded" />
          </div>
        ))}
      </div>

      {/* Clone cards grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-[#111] border border-[#222] rounded-xl p-4 space-y-3">
            <div className="h-40 bg-[#0a0a0a] rounded-lg" />
            <div className="h-4 w-3/4 bg-[#222] rounded" />
            <div className="h-3 w-1/2 bg-[#1a1a1a] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
