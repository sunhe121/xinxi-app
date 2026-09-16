import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Play, Pause, X, Volume2, MoreHorizontal } from 'lucide-react';
import { recordingsApi } from '@client/src/api';
import { useRecorder } from '@client/src/hooks/useRecorder';
import { appLogger } from '@client/src/utils/logger';
import type { Recording } from '@shared/api.interface';

const categories = [
  { key: 'weather', label: '天气' },
  { key: 'health', label: '健康' },
  { key: 'diet', label: '饮食' },
  { key: 'emotion', label: '情感' },
  { key: 'general', label: '通用' },
] as const;

type CategoryKey = (typeof categories)[number]['key'];

const MAX_RECORD_DURATION = 60;

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
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string>('');
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [saving, setSaving] = useState(false);

  // 播放控制
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playProgress, setPlayProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressTimerRef = useRef<number | null>(null);

  // 删除确认
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const recorder = useRecorder({
    onRecordingStop: (blob: Blob, duration: number) => {
      const url = URL.createObjectURL(blob);
      setRecordedAudioUrl(url);
      setRecordedDuration(duration);
    },
  });

  // 自动停止：60 秒
  useEffect(() => {
    if (recorder.isRecording && recorder.duration >= MAX_RECORD_DURATION) {
      recorder.stop();
    }
  }, [recorder.isRecording, recorder.duration, recorder]);

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
    setRecordedAudioUrl('');
    setRecordedDuration(0);
    recorder.reset();
    setShowSheet(true);
  };

  // 关闭录音弹窗
  const closeSheet = () => {
    if (recorder.isRecording) {
      recorder.stop();
    }
    recorder.reset();
    setShowSheet(false);
    setCurrentRecording(null);
    setRecordedAudioUrl('');
    setRecordedDuration(0);
  };

  // 完成录制并保存
  const finishRecording = async () => {
    if (!currentRecording || !recordedAudioUrl || recordedDuration <= 0) return;
    setSaving(true);
    try {
      const updated = await recordingsApi.save(currentRecording.id, {
        audioUrl: recordedAudioUrl,
        duration: recordedDuration,
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
    <div className="px-5 pt-6 pb-6">
      {/* 顶部标题区 */}
      <h1 className="text-[22px] font-bold text-[#333] mb-2">录音库</h1>
      <p className="text-sm text-[#999] mb-6">
        录制你的声音，让关心更真实 · 已录 {recordedCount}/{recordings.length}
      </p>

      {/* 分类 Tab */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className="px-4 py-2 rounded-[12px] text-sm whitespace-nowrap transition-all duration-300 flex-shrink-0"
              style={
                isActive
                  ? {
                      background:
                        'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                      color: '#FFFFFF',
                      fontWeight: 500,
                      boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                    }
                  : {
                      background: 'rgba(255, 255, 255, 0.5)',
                      WebkitBackdropFilter: 'blur(10px)',
                      backdropFilter: 'blur(10px)',
                      color: '#999999',
                    }
              }
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 录音列表 */}
      <div className="space-y-4 mt-5">
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
      {showSheet && (
        <div className="fixed inset-0 z-50">
          {/* 遮罩 */}
          <div
            className="absolute inset-0 bg-black/40 animate-fadeIn"
            onClick={closeSheet}
          />
          {/* 抽屉 */}
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-6 pb-8 animate-slideUp max-w-[480px] mx-auto"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              WebkitBackdropFilter: 'blur(20px)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* 顶部把手 */}
            <div className="w-10 h-1 bg-[#FF8C69]/20 rounded-full mx-auto mb-5" />

            {/* 标题 */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-[#333]">录制你的声音</h2>
              <button
                onClick={closeSheet}
                className="w-11 h-11 rounded-full bg-white/60 flex items-center justify-center text-[#999] active:scale-95 transition-transform"
                aria-label="关闭"
              >
                <X size={22} />
              </button>
            </div>

            {/* 预设句子 */}
            {currentRecording && (
              <div
                className="rounded-2xl p-4 mb-6"
                style={{
                  background: 'rgba(255, 140, 105, 0.08)',
                }}
              >
                <div className="flex items-start gap-3">
                  <Volume2 size={20} className="text-[#FF8C69] flex-shrink-0 mt-0.5" />
                  <p className="text-base leading-relaxed text-[#333]">
                    {currentRecording.presetText}
                  </p>
                </div>
              </div>
            )}

            {/* 录音主体区 */}
            <div className="flex flex-col items-center py-6">
              {/* 计时器 */}
              <div className="text-4xl font-light mb-8 tabular-nums text-[#333]">
                {formatDuration(recorder.duration)}
              </div>

              {/* 大录音按钮 */}
              <button
                onClick={() => {
                  if (recorder.isRecording) {
                    recorder.stop();
                  } else {
                    setRecordedAudioUrl('');
                    recorder.start();
                  }
                }}
                disabled={!recorder.isSupported}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ${
                  recorder.isRecording
                    ? 'recording-pulse'
                    : ''
                }`}
                style={
                  recorder.isRecording
                    ? {
                        background:
                          'linear-gradient(135deg, #FF6B6B 0%, #FF4757 100%)',
                        color: '#FFFFFF',
                      }
                    : {
                        background:
                          'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                        color: '#FFFFFF',
                        boxShadow: '0 8px 24px rgba(255, 107, 107, 0.35)',
                      }
                }
                aria-label={recorder.isRecording ? '停止录音' : '开始录音'}
              >
                {recorder.isRecording ? (
                  <div className="w-8 h-8 rounded-sm bg-white" />
                ) : recordedAudioUrl ? (
                  <Play size={36} fill="white" />
                ) : (
                  <Mic size={36} />
                )}
              </button>

              <p className="text-sm text-[#999] mt-5">
                {recorder.isRecording
                  ? '录音中... 最长60秒'
                  : recordedAudioUrl
                    ? '已录制完成，点击可重新录制'
                    : '点击按钮开始录音'}
              </p>

              {/* 录音完成后的预览 */}
              {recordedAudioUrl && (
                <div
                  className="w-full mt-6 rounded-2xl p-4"
                  style={{ background: 'rgba(255, 140, 105, 0.08)' }}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => doPlay('preview', recordedAudioUrl)}
                      className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background:
                          'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                        color: '#FFFFFF',
                      }}
                      aria-label="预览播放"
                    >
                      {playingId === 'preview' ? (
                        <Pause size={20} className="text-white" fill="white" />
                      ) : (
                        <Play size={20} className="text-white ml-0.5" fill="white" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width:
                              playingId === 'preview'
                                ? `${playProgress}%`
                                : '0%',
                            background:
                              'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-[#999] tabular-nums">
                      {formatDuration(recordedDuration)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 底部按钮 */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={closeSheet}
                className="flex-1 h-12 rounded-xl bg-white/60 text-[#333] font-medium active:scale-[0.98] transition-transform border border-white/80"
              >
                取消
              </button>
              <button
                onClick={finishRecording}
                disabled={!recordedAudioUrl || saving || recorder.isRecording}
                className="flex-1 h-12 rounded-xl text-white font-medium active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background:
                    'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                  boxShadow: '0 4px 12px rgba(255, 107, 107, 0.25)',
                }}
              >
                {saving ? '保存中...' : '完成'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/40 animate-fadeIn"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div
            className="relative rounded-2xl p-6 w-full max-w-sm animate-scaleIn"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              WebkitBackdropFilter: 'blur(20px)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(255, 107, 107, 0.1)',
            }}
          >
            <h3 className="text-lg font-semibold mb-2 text-[#333]">确认删除</h3>
            <p className="text-sm text-[#999] mb-6">
              删除后录音将无法恢复，确定要删除吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 h-11 rounded-xl bg-white/60 text-[#333] font-medium text-sm border border-white/80"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 h-11 rounded-xl text-white font-medium text-sm"
                style={{
                  background:
                    'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                  boxShadow: '0 4px 12px rgba(255, 107, 107, 0.25)',
                }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 内联样式：动画 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes recordingPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.5); }
          50% { box-shadow: 0 0 0 20px rgba(255, 107, 107, 0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
        .recording-pulse { animation: recordingPulse 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
