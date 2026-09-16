import {
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Heart,
  User,
  Send,
  Loader2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@client/src/utils/cn';
import { Image } from '@client/src/components/ui/image';
import type { Broadcast } from '@shared/api.interface';
import { broadcastsApi } from '@client/src/api';

interface BroadcastCardProps {
  item: Broadcast;
  expanded: boolean;
  playingId: string | null;
  isSpeaking: boolean;
  isPaused: boolean;
  onToggleExpand: (item: Broadcast) => void;
  onPlay: (item: Broadcast) => void;
}

const getMoodLabel = (moodIndex: number): string => {
  if (moodIndex >= 8) return '心情很好';
  if (moodIndex >= 6) return '心情不错';
  if (moodIndex >= 4) return '心情一般';
  return '需要关心';
};

const getWeekday = (dateStr: string): string => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[new Date(dateStr).getDay()];
};

const getDateShort = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
};

export default function BroadcastCard({
  item,
  expanded,
  playingId,
  isSpeaking,
  isPaused,
  onToggleExpand,
  onPlay,
}: BroadcastCardProps) {
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const isPlayingThis = playingId === item.id && isSpeaking;

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setReplySending(true);
    try {
      await broadcastsApi.reply(item.id, {
        content: replyText.trim(),
      });
      setReplyText('');
      toast.success('回复已发送💌');
    } catch {
      toast.error('回复失败，请重试');
    } finally {
      setReplySending(false);
    }
  };

  return (
    <div
      className={cn(
        'rounded-3xl p-6 overflow-hidden transition-all relative',
      )}
      style={{
        background: 'rgba(255, 255, 255, 0.75)',
        WebkitBackdropFilter: 'blur(20px)',
        backdropFilter: 'blur(20px)',
        border: !item.isRead
          ? '2px solid rgba(255, 140, 105, 0.4)'
          : '1px solid rgba(255, 255, 255, 0.8)',
        boxShadow: '0 8px 32px rgba(255, 107, 107, 0.1)',
      }}
    >
      {/* 未读标记 */}
      {!item.isRead && (
        <span
          className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full"
          style={{ background: '#FF6B6B' }}
        />
      )}

      {/* 列表项头部 */}
      <button
        onClick={() => onToggleExpand(item)}
        className="w-full text-left"
      >
        {/* 顶部：日期 + 心情 tag */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#333]">
              {getDateShort(item.broadcastDate)}
            </span>
            <span className="text-xs text-[#999]">
              {getWeekday(item.broadcastDate)}
            </span>
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-medium text-white"
            style={{
              background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
            }}
          >
            {getMoodLabel(item.moodIndex)}
          </span>
        </div>

        {/* 中部：摘要 */}
        <p
          className="text-base text-[#333] line-clamp-2 mb-4"
          style={{ lineHeight: 1.7 }}
        >
          {item.summary}
        </p>

        {/* 底部：播放 + 状态 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay(item);
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 active:scale-90 text-white"
              style={{
                background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                boxShadow: '0 3px 8px rgba(255, 107, 107, 0.3)',
              }}
              aria-label={isPlayingThis ? '暂停' : '播放'}
            >
              {isPlayingThis && !isPaused ? (
                <Pause size={12} fill="currentColor" />
              ) : (
                <Play size={12} className="ml-0.5" fill="currentColor" />
              )}
            </button>
            <span className="text-xs text-[#999]">
              {item.senderNickname || '家人'}的播报
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!item.isRead ? (
              <span className="text-xs font-medium" style={{ color: '#FF6B6B' }}>
                未读
              </span>
            ) : (
              <span className="text-xs text-[#999]">已读</span>
            )}
            {expanded ? (
              <ChevronUp size={16} style={{ color: '#FF8C69' }} />
            ) : (
              <ChevronDown size={16} style={{ color: '#999' }} />
            )}
          </div>
        </div>
      </button>

      {/* 展开的详情 */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div
              className="pt-5 mt-4"
              style={{ borderTop: '1px solid rgba(255, 140, 105, 0.15)' }}
            >
              {/* 播报人信息 */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                  style={{ background: 'rgba(255, 140, 105, 0.1)' }}
                >
                  {item.senderAvatar ? (
                    <Image
                      src={item.senderAvatar}
                      alt={item.senderNickname || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={18} style={{ color: '#FF8C69' }} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#333]">
                    {item.senderNickname || '家人'}
                  </p>
                  <p className="text-xs text-[#999]">
                    {item.broadcastDate}
                  </p>
                </div>
              </div>

              {/* 完整内容 */}
              <div
                className="rounded-2xl p-4 mb-4"
                style={{ background: 'rgba(255, 140, 105, 0.06)' }}
              >
                <p
                  className="text-sm text-[#333] whitespace-pre-wrap"
                  style={{ lineHeight: 1.7 }}
                >
                  {item.content}
                </p>
              </div>

              {/* 底部播放条 */}
              <div className="mb-4">
                <button
                  onClick={() => onPlay(item)}
                  className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-2 text-base font-semibold active:scale-[0.98] transition-transform text-white"
                  style={{
                    background:
                      isPlayingThis && !isPaused
                        ? 'rgba(255, 140, 105, 0.15)'
                        : 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                    color: isPlayingThis && !isPaused ? '#FF6B6B' : '#fff',
                    boxShadow: isPlayingThis && !isPaused
                      ? 'none'
                      : '0 8px 24px rgba(255, 107, 107, 0.3)',
                    border: 'none',
                  }}
                >
                  {isPlayingThis && !isPaused ? (
                    <>
                      <Pause size={18} fill="currentColor" />
                      暂停播放
                    </>
                  ) : isPlayingThis && isPaused ? (
                    <>
                      <Play size={18} fill="currentColor" />
                      继续播放
                    </>
                  ) : (
                    <>
                      <Play size={18} fill="currentColor" className="ml-0.5" />
                      播放全文
                    </>
                  )}
                </button>
              </div>

              {/* 回复输入 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="回复一段温暖的话..."
                  className="flex-1 h-[52px] px-4 rounded-2xl text-base text-[#333] outline-none transition-all placeholder:text-[#999]"
                  style={{
                    background: 'rgba(255, 255, 255, 0.6)',
                    WebkitBackdropFilter: 'blur(10px)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 140, 105, 0.2)',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleReply();
                    }
                  }}
                />
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim() || replySending}
                  className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-white active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                    boxShadow: '0 8px 24px rgba(255, 107, 107, 0.3)',
                    border: 'none',
                  }}
                  aria-label="发送回复"
                >
                  {replySending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
