import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Play, Pause, MoreHorizontal } from 'lucide-react';
import { recordingsApi } from '@client/src/api';
import { appLogger } from '@client/src/utils/logger';
import type { Recording } from '@shared/api.interface';
import RecordingSheet from './RecordingSheet';

const categories = [
  { key: 'weather', label: '天气' },
  { key: 'health', label: '健康' },
  { key: 'diet', label: '饮食' },
  { key: 'emotion', label: '情感' },
  { key: 'general', label: '通用' },
] as const;

type CategoryKey = (typeof categories)[number]['key'];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function RecordingsPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('weather');
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  // 录音弹窗
  const [showSheet, setShowSheet] = useState(false);
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(null);
  const [saving, setSaving] = useState(false);

  // 播放控制
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playProgress, setPlayProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressTimerRef = useRef<number | null>(null);

  // 删除确认
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // 加载录音列表
  const loadRecordings = useCallback(async (cat: CategoryKey) => {
    setLoading(true);
    try {
      const data = await recordingsApi.getList(cat);
      setRecordings(data);
    } catch (error) {
      appLogger.error('加载录音列表失败', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecordings(activeCategory);
  }, [activeCategory, loadRecordings]);

  // 播放进度监听
  useEffect(() => {
    if (playingId && audioRef.current) {
      progressTimerRef.current = window.setInterval(() => {
        if (audioRef.current && !audioRef.current.paused) {
          const pct = audioRef.current.duration
            ? (audioRef.current.currentTime / audioRef.current.duration) * 100
            : 0;
          setPlayProgress(pct);
        }
      }, 200);
    }
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [playingId]);

  const recordedCount = recordings.filter((r: Recording) => r.isRecorded).length;

  // 打开录音弹窗
  const openRecorder = (rec: Recording) => {
    setCurrentRecording(rec);
    setShowSheet(true);
  };

  // 关闭录音弹窗
  const closeSheet = () => {
    setShowSheet(false);
    setCurrentRecording(null);
  };

  // 完成录制并保存
  const finishRecording = async (audioUrl: string, duration: number) => {
    if (!currentRecording) return;
    setSaving(true);
    try {
      const updated = await recordingsApi.save(currentRecording.id, {
        audioUrl,
        duration,
      });
      setRecordings((prev: Recording[]) =>
        prev.map((r: Recording) => (r.id === updated.id ? updated : r))
      );
      closeSheet();
    } catch (error) {
      appLogger.error('保存录音失败', error);
    } finally {
      setSaving(false);
    }
  };

  // 播放 / 暂停
  const togglePlay = (rec: Recording) => {
    if (!rec.audioUrl) return;
    doPlay(rec.id, rec.audioUrl);
  };

  const doPlay = (id: string, url: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      setPlayProgress(0);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => {
      setPlayingId(null);
      setPlayProgress(0);
    };
    audio.onerror = () => {
      appLogger.error('播放失败');
      setPlayingId(null);
      setPlayProgress(0);
    };
    audio.play().catch((err) => {
      appLogger.error('播放启动失败', err);
      setPlayingId(null);
    });
    setPlayingId(id);
    setPlayProgress(0);
  };

  // 删除录音
  const handleDelete = async (id: string) => {
    try {
      await recordingsApi.delete(id);
      setRecordings((prev: Recording[]) =>
        prev.map((r: Recording) =>
          r.id === id
            ? { ...r, isRecorded: false, audioUrl: '', duration: 0 }
            : r
        )
      );
    } catch (error) {
      appLogger.error('删除录音失败', error);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const categoryLabel = (key: string): string => {
    const found = categories.find((c) => c.key === key);
    return found ? found.label : key;
  };

  return (
    <div className="px-5 pt-6 pb-32 max-w-[480px] mx-auto animate-fade-in-up">
      {/* 顶部标题区 */}
      <h1 className="text-2xl font-bold text-[#333] mb-2">录音库</h1>
      <p className="text-sm text-[#999] mb-5 leading-[1.7]">
        录制你的声音，让关心更真实 · 已录 {recordedCount}/{recordings.length}
      </p>

      {/* 分类 Tab */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 mb-5">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className="px-4 h-9 rounded-full text-sm whitespace-nowrap transition-all duration-300 flex-shrink-0 font-medium"
              style={
                isActive
                  ? {
                      background:
                        'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                      color: '#FFFFFF',
                      boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                    }
                  : {
                      background: 'rgba(255, 255, 255, 0.6)',
                      WebkitBackdropFilter: 'blur(10px)',
                      backdropFilter: 'blur(10px)',
                      color: '#999999',
                      border: '1px solid rgba(255, 255, 255, 0.8)',
                    }
              }
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 录音列表 */}
      <div className="space-y-4">
        {loading && (
          <div className="text-center text-[#999] py-10">加载中...</div>
        )}

        {!loading && recordings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{
                background:
                  'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
              }}
            >
              <Mic size={28} className="text-white" />
            </div>
            <p className="text-sm text-[#999] mb-6">暂无录音，快去录制吧~</p>
          </div>
        )}

        {!loading &&
          recordings.map((rec: Recording) => (
            <div
              key={rec.id}
              className="glass-card p-5 flex items-center gap-4"
            >
              {/* 左侧：播放按钮 */}
              {rec.isRecorded ? (
                <button
                  onClick={() => togglePlay(rec)}
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                    boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                  }}
                  aria-label={playingId === rec.id ? '暂停' : '播放'}
                >
                  {playingId === rec.id ? (
                    <Pause size={20} className="text-white" fill="white" />
                  ) : (
                    <Play size={20} className="text-white ml-0.5" fill="white" />
                  )}
                </button>
              ) : (
                <button
                  onClick={() => openRecorder(rec)}
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                    boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                  }}
                  aria-label="录制"
                >
                  <Mic size={20} className="text-white" />
                </button>
              )}

              {/* 中间：标题+分类+时长+进度 */}
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-[#333] leading-snug line-clamp-2">
                  {rec.presetText}
                </p>
                <p className="text-xs text-[#999] mt-1">
                  {categoryLabel(rec.category)}
                  {' · '}
                  {rec.isRecorded
                    ? formatDuration(rec.duration)
                    : '未录制'}
                </p>
                {/* 播放进度条 */}
                {playingId === rec.id && (
                  <div className="mt-2 h-1 bg-white/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-200"
                      style={{
                        width: `${playProgress}%`,
                        background:
                          'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 右侧：更多按钮 */}
              {rec.isRecorded ? (
                <button
                  onClick={() => setDeleteConfirmId(rec.id)}
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[#999] active:scale-95 transition-transform"
                  aria-label="更多操作"
                >
                  <MoreHorizontal size={20} />
                </button>
              ) : (
                <div className="flex-shrink-0 w-10" />
              )}
            </div>
          ))}
      </div>

      {/* 录音弹窗 - 底部抽屉 */}
      <RecordingSheet
        open={showSheet}
        recording={currentRecording}
        onClose={closeSheet}
        onFinish={finishRecording}
        saving={saving}
      />

      {/* 删除确认弹窗 */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/40 animate-fadeIn"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="relative glass-card p-6 w-full max-w-sm animate-scaleIn">
            <h3 className="text-lg font-semibold mb-2 text-[#333]">确认删除</h3>
            <p className="text-sm text-[#999] mb-5 leading-[1.7]">
              删除后录音将无法恢复，确定要删除吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 h-[52px] rounded-2xl bg-white/60 backdrop-blur-sm text-[#333] font-medium border border-white/80 active:scale-[0.98] transition-transform"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 h-[52px] rounded-2xl text-white font-semibold active:scale-[0.98] transition-transform"
                style={{
                  background:
                    'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                  boxShadow: '0 8px 24px rgba(255, 107, 107, 0.25)',
                }}
              >
                删除
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
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
