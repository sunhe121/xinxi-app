import { useState } from 'react';
import { Play, Pause, Mic, Volume2, X } from 'lucide-react';
import type { Recording } from '@shared/api.interface';

interface RecordBottomSheetProps {
  recording: Recording | null;
  isRecording: boolean;
  duration: number;
  recordedAudioUrl: string;
  recordedDuration: number;
  playingPreview: boolean;
  playProgress: number;
  saving: boolean;
  recorderSupported: boolean;
  onStartRecord: () => void;
  onStopRecord: () => void;
  onResetRecord: () => void;
  onPlayPreview: () => void;
  onClose: () => void;
  onSave: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const MAX_RECORD_DURATION = 60;

export default function RecordBottomSheet({
  recording,
  isRecording,
  duration,
  recordedAudioUrl,
  recordedDuration,
  playingPreview,
  playProgress,
  saving,
  recorderSupported,
  onStartRecord,
  onStopRecord,
  onResetRecord,
  onPlayPreview,
  onClose,
  onSave,
}: RecordBottomSheetProps) {
  if (!recording) return null;

  const handleRecordClick = () => {
    if (isRecording) {
      onStopRecord();
    } else {
      onResetRecord();
      onStartRecord();
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 animate-fade-in"
        style={{ background: 'rgba(0, 0, 0, 0.4)' }}
        onClick={onClose}
      />
      {/* 抽屉 */}
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-[28px] p-6 pb-8 animate-slideUp max-w-[480px] mx-auto"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          WebkitBackdropFilter: 'blur(20px)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          borderBottom: 'none',
          boxShadow: '0 -8px 32px rgba(255, 107, 107, 0.12)',
        }}
      >
        {/* 顶部把手 */}
        <div
          className="w-10 h-1 rounded-full mx-auto mb-5"
          style={{ background: 'rgba(255, 140, 105, 0.2)' }}
        />

        {/* 标题 */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[#333]">录制你的声音</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: 'rgba(255, 255, 255, 0.7)', color: '#999' }}
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        {/* 预设句子 */}
        <div
          className="rounded-2xl p-4 mb-6"
          style={{
            background: 'rgba(255, 255, 255, 0.7)',
            WebkitBackdropFilter: 'blur(10px)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
          }}
        >
          <div className="flex items-start gap-3">
            <Volume2 size={20} style={{ color: '#FF8C69' }} className="flex-shrink-0 mt-0.5" />
            <p className="text-base text-[#333]" style={{ lineHeight: 1.7 }}>
              {recording.presetText}
            </p>
          </div>
        </div>

        {/* 录音主体区 */}
        <div className="flex flex-col items-center py-4">
          {/* 计时器 */}
          <div
            className="text-3xl font-bold mb-4 tabular-nums"
            style={{ color: '#FF8C69' }}
          >
            {formatDuration(isRecording ? duration : recordedDuration)}
          </div>

          {/* 波形动画区 */}
          <div className="w-full h-[60px] flex items-center justify-center gap-1 mb-6">
            {isRecording ? (
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
            onClick={handleRecordClick}
            disabled={!recorderSupported}
            className={
              'w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ' +
              (isRecording ? 'recording-pulse' : '')
            }
            style={{
              background: isRecording
                ? '#FF6B6B'
                : 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
              boxShadow: isRecording
                ? '0 0 0 0 rgba(255, 107, 107, 0.5)'
                : '0 8px 24px rgba(255, 107, 107, 0.35)',
            }}
            aria-label={isRecording ? '停止录音' : '开始录音'}
          >
            {isRecording ? (
              <div className="w-7 h-7 rounded-sm bg-white" />
            ) : recordedAudioUrl ? (
              <Play size={32} fill="white" />
            ) : (
              <Mic size={32} className="text-white" />
            )}
          </button>

          <p className="text-sm text-[#999] mt-4" style={{ lineHeight: 1.5 }}>
            {isRecording
              ? `录音中... 最长${MAX_RECORD_DURATION}秒`
              : recordedAudioUrl
                ? '已录制完成，点击可重新录制'
                : '点击按钮开始录音'}
          </p>

          {/* 录音完成后的预览 */}
          {recordedAudioUrl && !isRecording && (
            <div
              className="w-full mt-6 rounded-2xl p-4"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                WebkitBackdropFilter: 'blur(10px)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
              }}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={onPlayPreview}
                  className="w-10 h-10 rounded-full text-white flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
                  style={{
                    background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                    boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                  }}
                  aria-label="预览播放"
                >
                  {playingPreview ? (
                    <Pause size={16} fill="white" />
                  ) : (
                    <Play size={16} fill="white" className="ml-0.5" />
                  )}
                </button>
                <div className="flex-1">
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255, 140, 105, 0.15)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: playingPreview ? `${playProgress}%` : '0%',
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
            onClick={onClose}
            className="flex-1 h-[52px] rounded-2xl font-semibold active:scale-[0.98] transition-transform"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              WebkitBackdropFilter: 'blur(10px)',
              backdropFilter: 'blur(10px)',
              color: '#333',
              border: '1px solid rgba(255, 255, 255, 0.8)',
            }}
          >
            取消
          </button>
          <button
            onClick={onSave}
            disabled={!recordedAudioUrl || saving || isRecording}
            className="flex-1 h-[52px] rounded-2xl text-white font-semibold active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
              boxShadow: '0 8px 24px rgba(255, 107, 107, 0.3)',
              border: 'none',
            }}
          >
            {saving ? '保存中...' : '完成'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes waveformBounce {
          0%, 100% { height: 8px; }
          50% { height: 48px; }
        }
        @keyframes recordingPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.5); }
          50% { box-shadow: 0 0 0 20px rgba(255, 107, 107, 0); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .waveform-bar { animation: waveformBounce 0.8s ease-in-out infinite; }
        .recording-pulse { animation: recordingPulse 1.5s ease-in-out infinite; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
