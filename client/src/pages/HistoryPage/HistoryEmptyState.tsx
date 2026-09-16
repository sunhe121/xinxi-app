import { Heart } from 'lucide-react';

export default function EmptyState() {
  return (
    <div
      className="rounded-3xl p-10 flex flex-col items-center justify-center"
      style={{
        background: 'rgba(255, 255, 255, 0.75)',
        WebkitBackdropFilter: 'blur(20px)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        boxShadow: '0 8px 32px rgba(255, 107, 107, 0.1)',
      }}
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
        style={{
          background: 'rgba(255, 140, 105, 0.12)',
        }}
      >
        <Heart
          size={36}
          style={{ color: '#FF8C69' }}
          fill="currentColor"
        />
      </div>
      <p className="text-lg font-semibold text-[#333] mb-2">
        还没有历史播报
      </p>
      <p
        className="text-sm text-[#999] text-center max-w-[260px]"
        style={{ lineHeight: 1.6 }}
      >
        家人的每日播报会在这里显示，耐心等待吧
      </p>
    </div>
  );
}
