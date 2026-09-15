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
    <div className="p-5 pb-24 space-y-5">
      {/* 顶部标题区 */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">我的关心话</h1>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          你录的关心话，会用在发给家人的每日播报里，让家人听到你的声音
        </p>
      </div>

      {/* 同步状态卡片 */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center flex-shrink-0">
          <Volume2 size={20} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            已录制 {recordedCount}/{recordings.length || '...'} 句
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            录制完成后点击同步，家人收到的播报就会融入你真实的声音
          </p>
        </div>
        <button
          onClick={handleSyncToFamily}
          disabled={syncing || loading}
          className="flex items-center gap-1.5 px-4 min-h-10 py-2.5 rounded-xl bg-primary text-white text-sm font-medium active:scale-95 transition-transform disabled:opacity-50 flex-shrink-0"
        >
          {syncing ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              同步中
            </>
          ) : (
            <>
              <Cloud size={14} />
              同步家人
            </>
          )}
        </button>
      </div>

      {/* 分类 Tab */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'px-4 min-h-11 rounded-full text-base font-medium whitespace-nowrap transition-all duration-300 active:scale-95',
              activeCategory === cat
                ? 'bg-primary text-white shadow-md'
                : 'bg-secondary text-muted-foreground'
            )}
          >
            {RECORDING_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* 录音列表 */}
      <div className="space-y-3">
        {loading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 bg-card rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && recordings.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <Mic size={28} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">暂无录音，快去录制吧~</p>
          </div>
        )}

        {!loading &&
          recordings.map((rec: Recording) => (
            <div
              key={rec.id}
              className="bg-card rounded-2xl p-4 shadow-sm flex items-center gap-4"
            >
              {/* 左侧图标 */}
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                  rec.isRecorded
                    ? 'bg-success/15 text-success'
                    : 'bg-primary/10 text-primary'
                )}
              >
                {rec.isRecorded ? (
                  <Check size={22} strokeWidth={2.5} />
                ) : (
                  <Mic size={20} />
                )}
              </div>

              {/* 中间文本 */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-base leading-snug line-clamp-2">
                  {rec.presetText}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-muted-foreground">
                    {rec.isRecorded
                      ? `已录制 · ${formatDuration(rec.duration)}`
                      : '未录制'}
                  </span>
                  {rec.isRecorded && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-xs',
                        rec.syncedToFamily ? 'text-success' : 'text-muted-foreground'
                      )}
                    >
                      {rec.syncedToFamily ? (
                        <><Cloud size={12} />已同步</>
                      ) : (
                        <><CloudOff size={12} />未同步</>
                      )}
                    </span>
                  )}
                </div>
                {/* 播放进度条 */}
                {playingId === rec.id && (
                  <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-200"
                      style={{ width: `${playProgress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* 右侧操作 */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {rec.isRecorded ? (
                  <>
                    <button
                      onClick={() => togglePlay(rec)}
                      className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center active:scale-95 transition-transform"
                      aria-label={playingId === rec.id ? '暂停' : '播放'}
                    >
                      {playingId === rec.id ? (
                        <Pause size={20} fill="currentColor" />
                      ) : (
                        <Play size={20} fill="currentColor" />
                      )}
                    </button>
                    <button
                      onClick={() => openRecorder(rec)}
                      className="w-11 h-11 rounded-full bg-secondary text-muted-foreground flex items-center justify-center active:scale-95 transition-transform"
                      aria-label="重新录制"
                    >
                      <RefreshCw size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(rec.id)}
                      className="w-11 h-11 rounded-full bg-destructive/10 text-destructive flex items-center justify-center active:scale-95 transition-transform"
                      aria-label="删除"
                    >
                      <Trash2 size={20} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => openRecorder(rec)}
                    className="px-5 min-h-11 rounded-full bg-primary text-white text-base font-medium flex items-center gap-1.5 active:scale-95 transition-transform shadow-sm"
                  >
                    <Mic size={16} />
                    录制
                  </button>
                )}
              </div>
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
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-6 pb-8 animate-slideUp max-w-[480px] mx-auto">
            {/* 顶部把手 */}
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

            {/* 标题 */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold">录制你的声音</h2>
              <button
                onClick={closeSheet}
                className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-muted-foreground active:scale-95 transition-transform"
                aria-label="关闭"
              >
                <Trash2 size={20} />
              </button>
            </div>

            {/* 预设句子 */}
            {currentRecording && (
              <div className="bg-secondary/60 rounded-2xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Volume2 size={20} className="text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-base leading-relaxed">
                    {currentRecording.presetText}
                  </p>
                </div>
              </div>
            )}

            {/* 录音主体区 */}
            <div className="flex flex-col items-center py-6">
              {/* 计时器 */}
              <div className="text-4xl font-light mb-8 tabular-nums text-foreground">
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
                className={cn(
                  'w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95',
                  recorder.isRecording
                    ? 'bg-destructive text-white recording-pulse'
                    : 'bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/30'
                )}
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

              <p className="text-sm text-muted-foreground mt-5">
                {recorder.isRecording
                  ? '录音中... 最长60秒'
                  : recordedAudioUrl
                    ? '已录制完成，点击可重新录制'
                    : '点击按钮开始录音'}
              </p>

              {/* 录音完成后的预览 */}
              {recordedAudioUrl && (
                <div className="w-full mt-6 bg-secondary/50 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => doPlay('preview', recordedAudioUrl)}
                      className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
                      aria-label="预览播放"
                    >
                      {playingId === 'preview' ? (
                        <Pause size={20} fill="white" />
                      ) : (
                        <Play size={20} fill="white" className="ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="h-2 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{
                            width: playingId === 'preview' ? `${playProgress}%` : '0%',
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
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
                className="flex-1 h-12 rounded-xl bg-secondary text-foreground font-medium active:scale-[0.98] transition-transform"
              >
                取消
              </button>
              <button
                onClick={finishRecording}
                disabled={!recordedAudioUrl || saving || recorder.isRecording}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-medium active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
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
          <div className="relative bg-card rounded-2xl p-6 w-full max-w-sm animate-scaleIn">
            <h3 className="text-lg font-semibold mb-2">确认删除</h3>
            <p className="text-muted-foreground text-sm mb-6">
              删除后录音将无法恢复，确定要删除吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 h-12 rounded-xl bg-secondary text-foreground font-medium active:scale-95 transition-transform"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 h-12 rounded-xl bg-destructive text-white font-medium active:scale-95 transition-transform"
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
