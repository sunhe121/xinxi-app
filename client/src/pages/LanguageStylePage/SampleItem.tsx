import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Trash2, Edit3, Clock, Tag } from 'lucide-react';
import { toast } from 'sonner';
import {
  LANGUAGE_SAMPLE_CATEGORIES,
  type LanguageSample,
} from '@shared/api.interface';
import { cn } from '@client/src/utils/cn';

interface SampleItemProps {
  sample: LanguageSample;
  onEdit: (sample: LanguageSample) => void;
  onDelete: (id: string) => void;
  isPlaying: boolean;
  progress: number;
  onTogglePlay: (sample: LanguageSample) => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getCategoryLabel(category: LanguageSample['category']): string {
  return (
    LANGUAGE_SAMPLE_CATEGORIES.find((c) => c.value === category)?.label ??
    category
  );
}

export default function SampleItem({
  sample,
  onEdit,
  onDelete,
  isPlaying,
  progress,
  onTogglePlay,
}: SampleItemProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!audioRef.current && sample.audioUrl) {
      const audio = new Audio(sample.audioUrl);
      audioRef.current = audio;
      audio.addEventListener('ended', () => {
        // 父组件通过 isPlaying 控制，这里不需要额外处理
      });
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [sample.audioUrl]);

  const handlePlayPause = () => {
    onTogglePlay(sample);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete(sample.id);
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-[#333] truncate text-sm">
              {sample.title}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#FF8C69]/15 text-[#FF8C69] shrink-0">
              {getCategoryLabel(sample.category)}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#999]">
            <Clock size={12} />
            <span>{formatDuration(sample.duration)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <button
            onClick={() => onEdit(sample)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#999] hover:bg-white/60 hover:text-[#333] transition-colors"
            aria-label="编辑"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={handleDeleteClick}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#999] hover:bg-[#FF6B6B]/10 hover:text-[#FF6B6B] transition-colors"
            aria-label="删除"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <p className="text-xs text-[#999] line-clamp-2 leading-[1.7] mb-3">
        {sample.transcript}
      </p>

      {/* 播放控制条 */}
      <div className="flex items-center gap-3">
        <button
          onClick={handlePlayPause}
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95',
            isPlaying
              ? 'bg-gradient-to-br from-[#FF8C69] to-[#FF6B6B] text-white shadow-md shadow-[#FF6B6B]/30'
              : 'bg-[#FF8C69]/15 text-[#FF8C69] hover:bg-[#FF8C69]/25'
          )}
          aria-label={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>
        <div className="flex-1 h-1.5 rounded-full bg-white/60 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] rounded-full transition-all duration-200"
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          />
        </div>
        <span className="text-xs text-[#999] w-10 text-right shrink-0">
          {formatDuration(Math.floor(sample.duration * progress))}
        </span>
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/40 animate-fadeIn"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative glass-card rounded-3xl p-6 w-full max-w-sm animate-scaleIn">
            <h3 className="text-lg font-semibold text-[#333] mb-2">
              删除样本
            </h3>
            <p className="text-[#999] text-sm mb-6 leading-relaxed">
              确定要删除「{sample.title}」吗？删除后无法恢复。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-12 rounded-2xl bg-white/60 text-[#333] font-medium active:scale-95 transition-transform border border-white/80"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white font-medium active:scale-95 transition-transform shadow-lg shadow-[#FF6B6B]/30"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}
