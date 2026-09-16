import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Play, Pause, Trash2, Check, Volume2, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { recordingsApi } from '@client/src/api';
import { useRecorder } from '@client/src/hooks/useRecorder';
import { appLogger } from '@client/src/utils/logger';
import { toast } from 'sonner';
import { RECORDING_CATEGORY_LABELS } from '@shared/api.interface';
import type { Recording } from '@shared/api.interface';
import { cn } from '@client/src/utils/cn';

const CATEGORIES: Array<Recording['category']> = ['health', 'diet', 'weather', 'emotion', 'general'];

const MAX_RECORD_DURATION = 60;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function VoicePage() {
  const [activeCategory, setActiveCategory] = useState<Recording['category']>('health');
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

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
  const loadRecordings = useCallback(async (cat: Recording['category']) => {
    setLoading(true);
    try {
      const data = await recordingsApi.getList(cat);
      setRecordings(data);
    } catch (error) {
      appLogger.error('加载录音列表失败', error);
      toast.error('加载失败，请稍后重试');
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
      toast.success('录制成功');
      closeSheet();
    } catch (error) {
      appLogger.error('保存录音失败', error);
      toast.error('保存失败，请重试');
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
            ? { ...r, isRecorded: false, audioUrl: '', duration: 0, syncedToFamily: false }
            : r
        )
      );
      toast.success('已删除');
    } catch (error) {
      appLogger.error('删除录音失败', error);
      toast.error('删除失败');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleSyncToFamily = async () => {
    if (recordedCount === 0) {
      toast.info('先录制几句关心话再同步吧~');
      return;
    }
    setSyncing(true);
    try {
      await recordingsApi.syncToFamily();
      setRecordings((prev: Recording[]) =>
        prev.map((r: Recording) =>
          r.isRecorded ? { ...r, syncedToFamily: true, syncedAt: new Date().toISOString() } : r
        )
      );
      toast.success('已同步给家人');
    } catch (error) {
      appLogger.error('同步失败', error);
      toast.error('同步失败，请重试');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-[480px] mx-auto px-5 pt-6 pb-6">
        {/* 页面标题 */}
        <h1 className="text-[22px] font-bold text-[#333] mb-2">我的关心话</h1>
        <p className="text-sm text-[#999] mb-6">
          已录制 {recordedCount} / {recordings.length || '...'} 句，会融入每日播报
        </p>

        {/* 分类 Tab */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 mb-5 pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all duration-200 flex-shrink-0 active:scale-95',
                activeCategory === cat
                  ? 'text-white font-medium shadow-md'
                  : 'bg-white/50 text-[#999]'
              )}
              style={activeCategory === cat ? {
                background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                boxShadow: '0 4px 16px rgba(255, 107, 107, 0.3)',
              } : {}}
            >
              {RECORDING_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* 录音列表 / 空状态 */}
        {loading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i: number) => (
              <div key={i} className="h-20 glass-card animate-pulse" />
            ))}
          </div>
        )}

        {!loading && recordings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-5"
              style={{ background: 'linear-gradient(135deg, rgba(255,140,105,0.2) 0%, rgba(255,107,107,0.2) 100%)' }}
            >
              <Mic size={44} style={{ color: '#FF8C69' }} />
            </div>
            <p className="text-lg font-medium text-[#333] mb-1">暂无录音</p>
            <p className="text-sm text-[#999]">
              选一个分类，开始录制你的关心话吧
            </p>
          </div>
        )}

        {!loading && recordings.length > 0 && (
          <div className="space-y-4">
            {recordings.map((rec: Recording) => (
              <div
                key={rec.id}
                className="glass-card p-5 flex items-center gap-4 min-h-[56px]"
              >
                {/* 左侧：播放按钮或麦克风图标（橙色渐变圆形） */}
                {rec.isRecorded ? (
                  <button
                    onClick={() => togglePlay(rec)}
                    className="w-11 h-11 rounded-full text-white flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform shadow-md"
                    style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
                    aria-label={playingId === rec.id ? '暂停' : '播放'}
                  >
                    {playingId === rec.id ? (
                      <Pause size={18} fill="white" />
                    ) : (
                      <Play size={18} fill="white" className="ml-0.5" />
                    )}
                  </button>
                ) : (
                  <div
                    className="w-11 h-11 rounded-full text-white flex items-center justify-center flex-shrink-0 shadow-md"
                    style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
                  >
                    <Mic size={18} />
                  </div>
                )}

                {/* 中间：文本内容 */}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-[#333] leading-snug line-clamp-2">
                    {rec.presetText}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {rec.isRecorded ? (
                      <>
                        <span className="text-xs text-[#999]">
                          {formatDuration(rec.duration)}
                        </span>
                        {rec.syncedToFamily && (
                          <span className="inline-flex items-center gap-1 text-xs text-[#6BCB77]">
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
                  {playingId === rec.id && (
                    <div className="mt-2 h-1 bg-white/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-200"
                        style={{ width: `${playProgress}%`, background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
                      />
                    </div>
                  )}
                </div>

                {/* 右侧：录制状态或操作 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {rec.isRecorded ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#6BCB77]">
                        <span className="w-2 h-2 rounded-full bg-[#6BCB77]" />
                        已录制
                      </span>
                      <button
                        onClick={() => setDeleteConfirmId(rec.id)}
                        className="w-8 h-8 rounded-full bg-white/50 text-[#999] flex items-center justify-center active:scale-95 transition-transform"
                        aria-label="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => openRecorder(rec)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#FF8C69] bg-white/50 backdrop-blur-sm active:scale-95 transition-transform"
                    >
                      去录制
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 底部操作区 */}
        <div className="mt-5">
          <button
            onClick={handleSyncToFamily}
            disabled={syncing || loading}
            className="btn-gradient w-full flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {syncing ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                同步中...
              </>
            ) : (
              <>
                <Cloud size={16} />
                发送给家人
              </>
            )}
          </button>
        </div>
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
            className="absolute bottom-0 left-0 right-0 rounded-t-[28px] p-6 pb-8 animate-slideUp max-w-[480px] mx-auto"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 -8px 32px rgba(255, 107, 107, 0.12)',
            }}
          >
            {/* 顶部把手 */}
            <div className="w-10 h-1 bg-[#FFE4E1] rounded-full mx-auto mb-5" />

            {/* 标题 */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-[#333]">录制你的声音</h2>
              <button
                onClick={closeSheet}
                className="w-10 h-10 rounded-full bg-white/60 text-[#999] flex items-center justify-center active:scale-95 transition-transform"
                aria-label="关闭"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* 预设句子 */}
            {currentRecording && (
              <div className="glass-card p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Volume2 size={20} style={{ color: '#FF8C69' }} className="flex-shrink-0 mt-0.5" />
                  <p className="text-base leading-relaxed text-[#333]">
                    {currentRecording.presetText}
                  </p>
                </div>
              </div>
            )}

            {/* 录音主体区 */}
            <div className="flex flex-col items-center py-4">
              {/* 计时器 */}
              <div className="text-3xl font-bold mb-4 tabular-nums" style={{ color: '#FF8C69' }}>
                {formatDuration(recorder.duration)}
              </div>

              {/* 波形动画区 */}
              <div className="w-full h-[60px] flex items-center justify-center gap-1 mb-6">
                {recorder.isRecording ? (
                  Array.from({ length: 24 }).map((_, i: number) => (
                    <div
                      key={i}
                      className="w-1 rounded-full waveform-bar"
                      style={{
                        background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                        animationDelay: `${i * 0.05}s`,
                      }}
                    />
                  ))
                ) : (
                  <div className="flex items-center justify-center gap-1.5 opacity-40">
                    {Array.from({ length: 5 }).map((_, i: number) => (
                      <div
                        key={i}
                        className="w-1 rounded-full"
                        style={{
                          backgroundColor: '#FF8C69',
                          height: `${12 + i * 6}px`,
                        }}
                      />
                    ))}
                    {Array.from({ length: 4 }).map((_, i: number) => (
                      <div
                        key={i + 5}
                        className="w-1 rounded-full"
                        style={{
                          backgroundColor: '#FF8C69',
                          height: `${30 - i * 6}px`,
                        }}
                      />
                    ))}
                  </div>
                )}
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
                className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95',
                  recorder.isRecording
                    ? 'recording-pulse'
                    : 'shadow-lg'
                )}
                style={{
                  background: recorder.isRecording
                    ? '#FF6B6B'
                    : 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                  boxShadow: recorder.isRecording
                    ? '0 0 0 0 rgba(255, 107, 107, 0.5)'
                    : '0 8px 24px rgba(255, 107, 107, 0.35)',
                }}
                aria-label={recorder.isRecording ? '停止录音' : '开始录音'}
              >
                {recorder.isRecording ? (
                  <div className="w-7 h-7 rounded-sm bg-white" />
                ) : recordedAudioUrl ? (
                  <Play size={32} fill="white" />
                ) : (
                  <Mic size={32} className="text-white" />
                )}
              </button>

              <p className="text-sm text-[#999] mt-4">
                {recorder.isRecording
                  ? '录音中... 最长60秒'
                  : recordedAudioUrl
                    ? '已录制完成，点击可重新录制'
                    : '点击按钮开始录音'}
              </p>

              {/* 录音完成后的预览 */}
              {recordedAudioUrl && (
                <div className="w-full mt-6 glass-card p-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => doPlay('preview', recordedAudioUrl)}
                      className="w-10 h-10 rounded-full text-white flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform shadow-md"
                      style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
                      aria-label="预览播放"
                    >
                      {playingId === 'preview' ? (
                        <Pause size={18} fill="white" />
                      ) : (
                        <Play size={18} fill="white" className="ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: playingId === 'preview' ? `${playProgress}%` : '0%',
                            background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
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
                className="flex-1 h-12 rounded-xl bg-white/60 text-[#333] font-medium active:scale-[0.98] transition-transform border border-white/50"
              >
                取消
              </button>
              <button
                onClick={finishRecording}
                disabled={!recordedAudioUrl || saving || recorder.isRecording}
                className="btn-gradient flex-1 disabled:opacity-60"
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
          <div className="relative glass-card p-6 w-full max-w-sm animate-scaleIn">
            <h3 className="text-lg font-semibold text-[#333] mb-2">确认删除</h3>
            <p className="text-sm text-[#999] mb-6">
              删除后录音将无法恢复，确定要删除吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 h-12 rounded-xl bg-white/60 text-[#333] font-medium active:scale-95 transition-transform border border-white/50"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 h-12 rounded-xl text-white font-medium active:scale-95 transition-transform shadow-md"
                style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)' }}
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
        @keyframes waveformBounce {
          0%, 100% { height: 8px; }
          50% { height: 48px; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
        .recording-pulse { animation: recordingPulse 1.5s ease-in-out infinite; }
        .waveform-bar { animation: waveformBounce 0.8s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
