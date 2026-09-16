import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { recordingsApi } from '@client/src/api';
import { useRecorder } from '@client/src/hooks/useRecorder';
import { appLogger } from '@client/src/utils/logger';
import { toast } from 'sonner';
import { RECORDING_CATEGORY_LABELS } from '@shared/api.interface';
import type { Recording } from '@shared/api.interface';
import { cn } from '@client/src/utils/cn';
import RecordingItem from './RecordingItem';
import RecordBottomSheet from './RecordBottomSheet';
import DeleteConfirmDialog from './DeleteConfirmDialog';

const CATEGORIES: Array<Recording['category']> = ['health', 'diet', 'weather', 'emotion', 'general'];
const MAX_RECORD_DURATION = 60;

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
  const syncedCount = recordings.filter((r: Recording) => r.syncedToFamily).length;

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
    <div className="min-h-screen bg-transparent">
      <div className="max-w-[480px] mx-auto px-5 pt-6 pb-32 space-y-5">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold text-[#333] mb-2">我的关心话</h1>
          <p className="text-sm text-[#999]" style={{ lineHeight: 1.5 }}>
            已录制 {recordedCount} / {recordings.length || '...'} 句，会融入每日播报
          </p>
        </div>

        {/* 统计卡片 */}
        <div
          className="rounded-3xl p-6"
          style={{
            background: 'rgba(255, 255, 255, 0.75)',
            WebkitBackdropFilter: 'blur(20px)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 8px 32px rgba(255, 107, 107, 0.1)',
          }}
        >
          <h2 className="text-lg font-semibold text-[#333] mb-4">统计概览</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: '#FF8C69' }}>
                {recordedCount}
              </div>
              <div className="text-xs text-[#999]" style={{ lineHeight: 1.5 }}>已录制</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: '#6BCB77' }}>
                {syncedCount}
              </div>
              <div className="text-xs text-[#999]" style={{ lineHeight: 1.5 }}>已同步</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: '#FFB5B5' }}>
                {CATEGORIES.length}
              </div>
              <div className="text-xs text-[#999]" style={{ lineHeight: 1.5 }}>分类数</div>
            </div>
          </div>
        </div>

        {/* 分类 Tab */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-5 px-5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'h-9 px-4 rounded-full text-sm whitespace-nowrap transition-all duration-200 flex-shrink-0 active:scale-[0.98] font-medium',
                activeCategory === cat
                  ? 'text-white shadow-md'
                  : ''
              )}
              style={activeCategory === cat ? {
                background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                border: 'none',
              } : {
                background: 'rgba(255, 255, 255, 0.6)',
                WebkitBackdropFilter: 'blur(10px)',
                backdropFilter: 'blur(10px)',
                color: '#999',
                border: '1px solid rgba(255, 255, 255, 0.8)',
              }}
            >
              {RECORDING_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* 录音列表 / 空状态 */}
        {loading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i: number) => (
              <div
                key={i}
                className="h-16 rounded-2xl animate-pulse"
                style={{ background: 'rgba(255, 255, 255, 0.6)' }}
              />
            ))}
          </div>
        )}

        {!loading && recordings.length === 0 && (
          <div
            className="rounded-3xl p-10 flex flex-col items-center justify-center text-center"
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
              style={{ background: 'linear-gradient(135deg, rgba(255,140,105,0.15) 0%, rgba(255,107,107,0.15) 100%)' }}
            >
              <Mic size={36} style={{ color: '#FF8C69' }} />
            </div>
            <p className="text-lg font-semibold text-[#333] mb-1">暂无录音</p>
            <p className="text-sm text-[#999]" style={{ lineHeight: 1.6 }}>
              选一个分类，开始录制你的关心话吧
            </p>
          </div>
        )}

        {!loading && recordings.length > 0 && (
          <div className="space-y-4">
            {recordings.map((rec: Recording) => (
              <RecordingItem
                key={rec.id}
                recording={rec}
                playingId={playingId}
                playProgress={playProgress}
                onTogglePlay={togglePlay}
                onOpenRecorder={openRecorder}
                onDelete={(id) => setDeleteConfirmId(id)}
              />
            ))}
          </div>
        )}

        {/* 底部操作区：固定浮动按钮 */}
        <div className="fixed bottom-0 left-0 right-0 px-5 pb-6 z-30 max-w-[480px] mx-auto">
          <button
            onClick={handleSyncToFamily}
            disabled={syncing || loading}
            className="w-full h-[52px] rounded-2xl text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
              boxShadow: '0 8px 24px rgba(255, 107, 107, 0.3)',
              border: 'none',
            }}
          >
            {syncing ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                同步中...
              </>
            ) : (
              <>
                <Cloud size={18} />
                发送给家人
              </>
            )}
          </button>
        </div>
      </div>

      {/* 录音弹窗 */}
      <RecordBottomSheet
        recording={currentRecording}
        isRecording={recorder.isRecording}
        duration={recorder.duration}
        recordedAudioUrl={recordedAudioUrl}
        recordedDuration={recordedDuration}
        playingPreview={playingId === 'preview'}
        playProgress={playProgress}
        saving={saving}
        recorderSupported={recorder.isSupported}
        onStartRecord={() => {
          setRecordedAudioUrl('');
          recorder.start();
        }}
        onStopRecord={() => recorder.stop()}
        onResetRecord={() => {
          setRecordedAudioUrl('');
          recorder.reset();
        }}
        onPlayPreview={() => {
          if (recordedAudioUrl) {
            doPlay('preview', recordedAudioUrl);
          }
        }}
        onClose={closeSheet}
        onSave={finishRecording}
      />

      {/* 删除确认弹窗 */}
      {deleteConfirmId && (
        <DeleteConfirmDialog
          onConfirm={() => handleDelete(deleteConfirmId)}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </div>
  );
}
