import { useState, useRef, useEffect } from 'react';
import { Mic, Play, Pause, X, Volume2 } from 'lucide-react';
import type { Recording } from '@shared/api.interface';
import { useRecorder } from '@client/src/hooks/useRecorder';

const MAX_RECORD_DURATION = 60;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

interface RecordingSheetProps {
  open: boolean;
  recording: Recording | null;
  onClose: () => void;
  onFinish: (audioUrl: string, duration: number) => Promise<void>;
  saving: boolean;
}

export default function RecordingSheet({
  open,
  recording,
  onClose,
  onFinish,
  saving,
}: RecordingSheetProps) {
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string>('');
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playProgress, setPlayProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressTimerRef = useRef<number | null>(null);

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

  // 重置状态
  useEffect(() => {
    if (open) {
      setRecordedAudioUrl('');
      setRecordedDuration(0);
      setPlayingId(null);
      setPlayProgress(0);
      recorder.reset();
    }
  }, [open, recorder]);

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

  const handleClose = () => {
    if (recorder.isRecording) {
      recorder.stop();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingId(null);
    onClose();
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
      setPlayingId(null);
      setPlayProgress(0);
    };
    audio.play().catch(() => {
      setPlayingId(null);
    });
    setPlayingId(id);
    setPlayProgress(0);
  };

  const handleFinish = async () => {
    if (!recordedAudioUrl || recordedDuration <= 0) return;
    await onFinish(recordedAudioUrl, recordedDuration);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/40 animate-fadeIn"
        onClick={handleClose}
      />
      {/* 抽屉 */}
      <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-6 pb-8 animate-slideUp max-w-[480px] mx-auto glass-card border-b-0 border-l-0 border-r-0">
        {/* 顶部把手 */}
        <div className="w-10 h-1 bg-[#FF8C69]/20 rounded-full mx-auto mb-5" />

        {/* 标题 */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-[#333]">录制你的声音</h2>
          <button
            onClick={handleClose}
            className="w-11 h-11 rounded-full bg-white/60 flex items-center justify-center text-[#999] active:scale-95 transition-transform border border-white/80"
            aria-label="关闭"
          >
            <X size={22} />
          </button>
        </div>

        {/* 预设句子 */}
        {recording && (
          <div className="rounded-2xl p-4 mb-5 bg-[#FF8C69]/10">
            <div className="flex items-start gap-3">
              <Volume2 size={20} className="text-[#FF8C69] flex-shrink-0 mt-0.5" />
              <p className="text-base leading-[1.7] text-[#333]">
                {recording.presetText}
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
              recorder.isRecording ? 'recording-pulse' : ''
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
            <div className="w-full mt-6 rounded-2xl p-4 bg-[#FF8C69]/10">
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
            onClick={handleClose}
            className="flex-1 h-[52px] rounded-2xl bg-white/60 backdrop-blur-sm text-[#333] font-medium active:scale-[0.98] transition-transform border border-white/80"
          >
            取消
          </button>
          <button
            onClick={handleFinish}
            disabled={!recordedAudioUrl || saving || recorder.isRecording}
            className="flex-1 h-[52px] rounded-2xl text-white font-semibold active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background:
                'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
              boxShadow: '0 8px 24px rgba(255, 107, 107, 0.25)',
            }}
          >
            {saving ? '保存中...' : '完成'}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes recordingPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.5); }
          50% { box-shadow: 0 0 0 20px rgba(255, 107, 107, 0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .recording-pulse { animation: recordingPulse 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
