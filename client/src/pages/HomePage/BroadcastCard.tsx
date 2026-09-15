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
    <div className="bg-gradient-to-br from-primary/10 via-secondary/30 to-accent/10 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">今日暖心播报</h2>
      </div>

      {/* 未生成状态 */}
      {!content && !loading && !error && (
        <div className="text-center py-6">
          <p className="text-muted-foreground text-base mb-6 leading-relaxed">
            点击下方按钮，AI 为你生成温暖播报
            <br />
            把今日的关心，说给你听
          </p>
          <button
            onClick={onGenerate}
            className="w-full min-h-12 bg-primary text-white rounded-xl font-semibold text-base shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center"
          >
            生成今日播报
          </button>
        </div>
      )}

      {/* 生成中 */}
      {loading && (
        <div className="text-center py-10">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-foreground text-base mt-4 font-medium">
            AI 正在为您生成温暖播报...
          </p>
          <p className="text-muted-foreground text-xs mt-2">请稍等片刻，马上就好</p>
        </div>
      )}

      {/* 生成错误 */}
      {error && (
        <div className="text-center py-6">
          <p className="text-destructive text-sm mb-4">{error}</p>
          <button
            onClick={onGenerate}
            className="w-full min-h-12 bg-primary text-white rounded-xl font-medium text-base flex items-center justify-center"
          >
            重新生成
          </button>
        </div>
      )}

      {/* 已生成 */}
      {content && !loading && (
        <div className="bg-white/70 backdrop-blur rounded-2xl p-5 shadow-sm">
          {/* 顶部：日期 + 语速 + 播放控制 */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">{dateLabel}</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-secondary/80 rounded-full px-2 py-1.5">
                <Volume2 className="w-4 h-4 text-muted-foreground ml-1" />
                <div className="flex gap-0.5">
                  {SPEED_OPTIONS.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-full transition-colors min-h-9',
                        playbackSpeed === speed
                          ? 'bg-primary text-white font-medium'
                          : 'text-muted-foreground'
                      )}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleTogglePlay}
                disabled={!isSupported}
                className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform disabled:opacity-50"
              >
                {isSpeaking && !isPaused ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>
            </div>
          </div>

          {/* 播报内容 */}
          <div className="max-h-48 overflow-y-auto scrollbar-hide text-foreground text-base leading-loose whitespace-pre-wrap">
            {content}
          </div>

          {/* 底部小字 */}
          <div className="mt-3 text-center">
            <p className="text-xs text-muted-foreground">
              未来支持用您自己的声音播放
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
