export default function SkeletonList() {
  const items = [0, 1, 2, 3];
  return (
    <div className="space-y-4">
      {items.map((i: number) => (
        <div
          key={i}
          className="rounded-3xl p-6 overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.75)',
            WebkitBackdropFilter: 'blur(20px)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 8px 32px rgba(255, 107, 107, 0.1)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-20 rounded animate-pulse" style={{ background: 'rgba(255, 140, 105, 0.15)' }} />
            <div className="h-5 w-16 rounded-full animate-pulse" style={{ background: 'rgba(255, 140, 105, 0.15)' }} />
          </div>
          <div className="h-4 w-full rounded animate-pulse mb-2" style={{ background: 'rgba(255, 140, 105, 0.12)' }} />
          <div className="h-4 w-3/4 rounded animate-pulse mb-4" style={{ background: 'rgba(255, 140, 105, 0.12)' }} />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full animate-pulse" style={{ background: 'rgba(255, 140, 105, 0.15)' }} />
              <div className="h-3 w-20 rounded animate-pulse" style={{ background: 'rgba(255, 140, 105, 0.12)' }} />
            </div>
            <div className="h-3 w-10 rounded animate-pulse" style={{ background: 'rgba(255, 140, 105, 0.12)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
