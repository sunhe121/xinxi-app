import { useState, useCallback, useEffect } from 'react';
import { useSpeech } from '@client/src/hooks/useSpeech';
import { cn } from '@client/src/utils/cn';
import type { Broadcast } from '@shared/api.interface';
import {
  Play,
  Pause,
  Heart,
  Send,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@client/src/utils/date';
import { broadcastsApi } from '@client/src/api';

const SPEED_OPTIONS = [0.8, 1.0, 1.2, 1.5];

interface LatestBroadcastCardProps {
  broadcast: Broadcast;
  senderName: string;
}

export function LatestBroadcastCard({ broadcast, senderName }: LatestBroadcastCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [current, setCurrent] = useState<Broadcast>(broadcast);

  const { speak, pause, resume, stop, isSpeaking, isPaused, isSupported } = useSpeech({
    rate: playbackSpeed,
  });

  useEffect(() => {
    setCurrent(broadcast);
  }, [broadcast]);

  const handleMarkAsRead = useCallback(async (id: string) => {
    if (markingRead) return;
    setMarkingRead(true);
    try {
      const updated = await broadcastsApi.markAsRead(id);
      setCurrent(updated);
    } catch {
      // 静默失败
    } finally {
      setMarkingRead(false);
    }
  }, [markingRead]);

  const handleTogglePlay = () => {
    if (!current.content) return;
    if (!current.isRead) {
      handleMarkAsRead(current.id);
    }
    if (isSpeaking && !isPaused) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      speak(current.content, { rate: playbackSpeed });
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (isSpeaking) {
      stop();
      if (current.content) {
        setTimeout(() => speak(current.content, { rate: speed }), 50);
      }
    }
  };

  const handleReceived = async () => {
    await handleMarkAsRead(current.id);
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setReplySending(true);
    try {
      const updated = await broadcastsApi.reply(current.id, {
        content: replyText.trim(),
      });
      setCurrent(updated);
      setReplyText('');
      setReplyOpen(false);
      toast.success('回复已发送');
    } catch {
      toast.error('回复失败，请重试');
    } finally {
      setReplySending(false);
    }
  };

  return (
    <div className="glass-card p-6 relative overflow-hidden">
      {/* 未读红点 */}
      {!current.isRead && (
        <span className="absolute top-5 right-5 w-2.5 h-2.5 bg-[#FF6B6B] rounded-full ring-2 ring-white/70 z-10" />
      )}

      {/* 顶部：发送者 + 日期 + 心情指数 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[#333] text-sm font-medium">
            {current.senderNickname || senderName}
          </span>
          <span className="text-[#999] text-xs">
            · {formatDate(current.broadcastDate)}
          </span>
        </div>
        <span
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-xs font-medium"
          style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
        >
          <Heart size={12} fill="white" />
          心情指数 {current.moodIndex}
        </span>
      </div>

      {/* 播报内容摘要/全文 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <p
          className={cn(
            'text-[#333] text-base leading-[1.7] mb-4 text-left',
            expanded ? '' : 'line-clamp-3'
          )}
        >
          {expanded
            ? current.content
            : current.summary || current.content}
        </p>
        <p className="text-xs text-[#FF8C69] font-medium mb-4">
          {expanded ? '收起' : '展开查看全文'}
        </p>
      </button>

      {/* 进度条（装饰性） */}
      <div className="h-1.5 rounded-full bg-white/80 mb-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: isSpeaking ? '50%' : '0%',
            background: 'linear-gradient(90deg, #FF8C69 0%, #FF6B6B 100%)',
          }}
        />
      </div>

      {/* 底部：播放按钮 + 时长 + 生成时间 */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleTogglePlay}
          disabled={!isSupported}
          className="w-12 h-12 rounded-full text-white flex items-center justify-center flex-shrink-0 active:scale-95 transition-all disabled:opacity-50 shadow-md"
          style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
          aria-label={isSpeaking && !isPaused ? '暂停' : '播放'}
        >
          {isSpeaking && !isPaused ? (
            <Pause size={20} fill="white" />
          ) : (
            <Play size={20} fill="white" className="ml-0.5" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[#333] text-sm font-medium">今日播报</p>
          <p className="text-[#999] text-xs mt-0.5 leading-relaxed">
            生成于{' '}
            {new Date(current.createdAt).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        {/* 语速调节 */}
        <div className="flex items-center gap-0.5 bg-white/60 backdrop-blur-sm -webkit-backdrop-filter: blur(6px) rounded-full px-1.5 py-1 border border-white/80">
          {SPEED_OPTIONS.map((speed) => (
            <button
              key={speed}
              onClick={() => handleSpeedChange(speed)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-full transition-all duration-300 min-h-7',
                playbackSpeed === speed
                  ? 'text-white shadow-sm'
                  : 'text-[#999]'
              )}
              style={
                playbackSpeed === speed
                  ? { background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }
                  : {}
              }
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* 回复区域 */}
      <div className="mt-5 pt-5 border-t border-white/30 space-y-3">
        {/* 已有回复显示 */}
        {current.replyContent && (
          <div className="bg-white/60 backdrop-blur-sm -webkit-backdrop-filter: blur(6px) rounded-2xl p-4 border border-white/70">
            <p className="text-xs text-[#999] mb-1.5">我的回复：</p>
            <p className="text-sm text-[#333] leading-[1.7]">
              {current.replyContent}
            </p>
          </div>
        )}

        {/* 回复按钮组 */}
        {!current.replyContent && !replyOpen && (
          <div className="flex gap-3">
            <button
              onClick={handleReceived}
              disabled={markingRead || current.isRead}
              className="flex-1 h-[52px] bg-white/70 text-[#FF8C69] rounded-2xl font-medium text-base active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 border border-white/80"
            >
              <Heart size={18} fill="currentColor" />
              {current.isRead ? '已收到' : '收到'}
            </button>
            <button
              onClick={() => setReplyOpen(true)}
              className="flex-1 h-[52px] rounded-2xl text-white font-semibold text-base active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md"
              style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
            >
              <Send size={18} />
              回复TA
            </button>
          </div>
        )}

        {/* 回复输入框 */}
        {!current.replyContent && replyOpen && (
          <div className="space-y-2">
            <div className="flex gap-2 items-end">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="说句话回复TA..."
                rows={2}
                maxLength={200}
                className="flex-1 px-4 py-3 rounded-2xl bg-white/70 backdrop-blur-xl -webkit-backdrop-blur-xl border border-white/80 text-[#333] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FF8C69]/30 focus:border-[#FF8C69] transition-all placeholder:text-[#999]"
                autoFocus
              />
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || replySending}
                className="w-12 h-12 rounded-full text-white flex items-center justify-center flex-shrink-0 shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
                aria-label="发送"
              >
                {replySending ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
            <button
              onClick={() => {
                setReplyOpen(false);
                setReplyText('');
              }}
              className="text-xs text-[#999]"
            >
              取消
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
