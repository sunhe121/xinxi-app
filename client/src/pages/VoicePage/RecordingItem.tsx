import { Play, Pause, Trash2, Check, Mic } from 'lucide-react';
import type { Recording } from '@shared/api.interface';

interface RecordingItemProps {
  recording: Recording;
  playingId: string | null;
  playProgress: number;
  onTogglePlay: (rec: Recording) => void;
  onOpenRecorder: (rec: Recording) => void;
  onDelete: (id: string) => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function RecordingItem({
  recording,
  playingId,
  playProgress,
  onTogglePlay,
  onOpenRecorder,
  onDelete,
}: RecordingItemProps) {
  const isPlaying = playingId === recording.id;

  return (
    <div
      className="h-16 rounded-2xl px-4 flex items-center gap-3 w-full"
      style={{
        background: 'rgba(255, 255, 255, 0.6)',
        WebkitBackdropFilter: 'blur(10px)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
      }}
    >
      {/* 左侧：播放按钮或麦克风 */}
      {recording.isRecorded ? (
        <button
          onClick={() => onTogglePlay(recording)}
          className="w-10 h-10 rounded-full text-white flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
          style={{
            background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
            boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
          }}
          aria-label={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? (
            <Pause size={16} fill="white" />
          ) : (
            <Play size={16} fill="white" className="ml-0.5" />
          )}
        </button>
      ) : (
        <div
          className="w-10 h-10 rounded-full text-white flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(255, 140, 105, 0.15)',
          }}
        >
          <Mic size={16} style={{ color: '#FF8C69' }} />
        </div>
      )}

      {/* 中间：文本 + 状态 */}
      <div className="flex-1 min-w-0">
        <p className="text-base text-[#333] leading-snug line-clamp-1">
          {recording.presetText}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {recording.isRecorded ? (
            <>
              <span className="text-xs text-[#999]">
                {formatDuration(recording.duration)}
              </span>
              {recording.syncedToFamily && (
                <span className="inline-flex items-center gap-1 text-xs" style={{ color: '#6BCB77' }}>
                  <Check size={12} strokeWidth={2.5} />
                  已同步
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-[#999]">未录制</span>
          )}
        </div>
        {/* 播放进度条 */}
        {isPlaying && (
          <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255, 140, 105, 0.15)' }}>
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${playProgress}%`,
                background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
              }}
            />
          </div>
        )}
      </div>

      {/* 右侧：操作 */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {recording.isRecorded ? (
          <>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs" style={{ color: '#6BCB77' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: '#6BCB77' }} />
              已录制
            </span>
            <button
              onClick={() => onDelete(recording.id)}
              className="w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ background: 'rgba(255, 255, 255, 0.7)', color: '#999' }}
              aria-label="删除"
            >
              <Trash2 size={14} />
            </button>
          </>
        ) : (
          <button
            onClick={() => onOpenRecorder(recording)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition-transform"
            style={{
              background: 'rgba(255, 255, 255, 0.8)',
              color: '#FF8C69',
              border: '1px solid rgba(255, 140, 105, 0.3)',
            }}
          >
            去录制
          </button>
        )}
      </div>
    </div>
  );
}
