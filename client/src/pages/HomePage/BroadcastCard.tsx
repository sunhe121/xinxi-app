import { useState, useEffect } from 'react';
import { useSpeech } from '@client/src/hooks/useSpeech';
import { cn } from '@client/src/utils/cn';
import {
  Play,
  Pause,
  Volume2,
  Sparkles,
  Loader2,
} from 'lucide-react';

const SPEED_OPTIONS = [0.8, 1.0, 1.2, 1.5];

interface BroadcastCardProps {
  content: string | null;
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
  dateLabel: string;
}

export function BroadcastCard({
  content,
  loading,
  error,
  onGenerate,
  dateLabel,
}: BroadcastCardProps) {
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const { speak, pause, resume, stop, isSpeaking, isPaused, isSupported } = useSpeech({
    rate: playbackSpeed,
  });

  // 内容变化时停止播放
  useEffect(() => {
    stop();
  }, [content, stop]);

  const handleTogglePlay = () => {
    if (!content) return;
    if (isSpeaking && !isPaused) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      speak(content, { rate: playbackSpeed });
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (isSpeaking) {
      stop();
      if (content) {
        setTimeout(() => speak(content, { rate: speed }), 50);
      }
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
        >
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-[#333]">今日暖心播报</h2>
      </div>

      {/* 未生成状态 */}
      {!content && !loading && !error && (
        <div className="text-center py-6">
          <p className="text-base text-[#999] mb-6 leading-relaxed">
            点击下方按钮，AI 为你生成温暖播报
            <br />
            把今日的关心，说给你听
          </p>
          <button
            onClick={onGenerate}
            className="w-full h-[52px] rounded-2xl text-white font-semibold text-base active:scale-[0.98] transition-all flex items-center justify-center shadow-md"
            style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
          >
            生成今日播报
          </button>
        </div>
      )}

      {/* 生成中 */}
      {loading && (
        <div className="text-center py-10">
          <Loader2 className="w-10 h-10 text-[#FF8C69] animate-spin mx-auto" />
          <p className="text-base text-[#333] mt-4 font-medium">
            AI 正在为您生成温暖播报...
          </p>
          <p className="text-sm text-[#999] mt-2">请稍等片刻，马上就好</p>
        </div>
      )}

      {/* 生成错误 */}
      {error && (
        <div className="text-center py-6">
          <p className="text-sm text-[#FF6B6B] mb-4">{error}</p>
          <button
            onClick={onGenerate}
            className="w-full h-[52px] rounded-2xl text-white font-semibold text-base flex items-center justify-center shadow-md active:scale-[0.98] transition-all"
            style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
          >
            重新生成
          </button>
        </div>
      )}

      {/* 已生成 */}
      {content && !loading && (
        <div className="bg-white/60 backdrop-blur-sm -webkit-backdrop-filter: blur(10px) rounded-2xl p-5 border border-white/80">
          {/* 顶部：日期 + 语速 + 播放控制 */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-[#999]">{dateLabel}</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white/70 backdrop-blur-sm -webkit-backdrop-filter: blur(6px) rounded-full px-1.5 py-1 border border-white/80">
                <Volume2 className="w-4 h-4 text-[#999] ml-1" />
                <div className="flex gap-0.5">
                  {SPEED_OPTIONS.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={cn(
                        'px-2.5 py-1 text-xs font-medium rounded-full transition-all min-h-7',
                        playbackSpeed === speed
                          ? 'text-white shadow-sm'
                          : 'text-[#999]'
                      )}
                      style={playbackSpeed === speed
                        ? { background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }
                        : {}}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleTogglePlay}
                disabled={!isSupported}
                className="w-11 h-11 rounded-full text-white flex items-center justify-center shadow-md active:scale-95 transition-transform disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
              >
                {isSpeaking && !isPaused ? (
                  <Pause className="w-5 h-5" fill="white" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" fill="white" />
                )}
              </button>
            </div>
          </div>

          {/* 进度条（装饰性） */}
          <div className="h-1.5 rounded-full bg-white/80 mb-4 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: isSpeaking ? '45%' : '0%',
                background: 'linear-gradient(90deg, #FF8C69 0%, #FF6B6B 100%)',
              }}
            />
          </div>

          {/* 播报内容 */}
          <div className="max-h-48 overflow-y-auto scrollbar-hide text-[#333] text-base leading-[1.7] whitespace-pre-wrap">
            {content}
          </div>

          {/* 底部小字 */}
          <div className="mt-4 text-center">
            <p className="text-xs text-[#999]">
              未来支持用您自己的声音播放
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
