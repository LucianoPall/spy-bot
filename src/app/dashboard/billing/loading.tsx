export default function Loading() {
  return (
    <div className="w-full space-y-8 animate-pulse">
      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-9 w-64 bg-[#222] rounded" />
        <div className="h-4 w-80 bg-[#1a1a1a] rounded" />
      </div>

      {/* Plan cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Current plan card */}
        <div className="bg-[#111] border border-[#222] p-8 rounded-2xl space-y-4">
          <div className="h-4 w-32 bg-[#222] rounded" />
          <div className="h-10 w-48 bg-[#222] rounded" />
          <div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-6 space-y-3">
            <div className="h-3 w-full bg-[#222] rounded" />
            <div className="h-3 w-full bg-[#0a0a0a] rounded-full" />
          </div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-4 w-56 bg-[#1a1a1a] rounded" />
            ))}
          </div>
        </div>

        {/* Upsell card */}
        <div className="bg-[#111] border border-[#222] p-8 rounded-2xl flex flex-col items-center space-y-4">
          <div className="h-16 w-16 bg-[#222] rounded-full" />
          <div className="h-7 w-40 bg-[#222] rounded" />
          <div className="h-4 w-64 bg-[#1a1a1a] rounded" />
          <div className="h-12 w-32 bg-[#222] rounded" />
          <div className="h-12 w-full bg-[#222] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
