export default function Loading() {
  return (
    <div className="w-full space-y-8 animate-pulse">
      {/* Subscription panel skeleton */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-6 md:p-8 space-y-4">
        <div className="h-6 w-44 bg-[#222] rounded" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#050505] border border-[#1a1a1a] rounded-lg p-4 space-y-2">
            <div className="h-3 w-24 bg-[#222] rounded" />
            <div className="h-6 w-32 bg-[#222] rounded" />
          </div>
          <div className="bg-[#050505] border border-[#1a1a1a] rounded-lg p-4 space-y-2">
            <div className="h-3 w-36 bg-[#222] rounded" />
            <div className="h-3 w-full bg-[#222] rounded-full" />
          </div>
        </div>
        <div className="h-14 w-full bg-[#222] rounded-lg" />
      </div>

      <div className="h-px bg-[#1a1a1a]" />

      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-72 bg-[#222] rounded" />
        <div className="h-4 w-96 bg-[#1a1a1a] rounded" />
      </div>

      {/* Form skeleton */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-6 md:p-8 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-40 bg-[#222] rounded" />
              <div className="h-12 bg-[#0a0a0a] border border-[#222] rounded-lg" />
            </div>
          ))}
        </div>
        {[1, 2].map(i => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-48 bg-[#222] rounded" />
            <div className="h-20 bg-[#0a0a0a] border border-[#222] rounded-lg" />
          </div>
        ))}
        <div className="pt-4 border-t border-[#222] flex justify-end">
          <div className="h-12 w-44 bg-[#222] rounded-lg" />
        </div>
      </div>
    </div>
  );
}
