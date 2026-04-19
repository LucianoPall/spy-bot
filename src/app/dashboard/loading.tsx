export default function Loading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Banner skeleton */}
      <div className="h-10 w-48 bg-[#222] rounded-lg" />

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-[#111] border border-[#222] rounded-xl" />
        ))}
      </div>

      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-72 bg-[#222] rounded" />
        <div className="h-4 w-96 bg-[#1a1a1a] rounded" />
      </div>

      {/* Main input area skeleton */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-5 space-y-4">
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-[#222] rounded-lg" />
          <div className="h-10 w-40 bg-[#222] rounded-lg" />
        </div>
        <div className="h-14 bg-[#0a0a0a] border border-[#222] rounded-lg" />
      </div>
    </div>
  );
}
