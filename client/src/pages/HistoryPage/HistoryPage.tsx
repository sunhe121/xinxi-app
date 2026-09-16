import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Heart,
  User,
  Send,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { broadcastsApi } from '@client/src/api';
import { useSpeech } from '@client/src/hooks/useSpeech';
import { useUser, getDisplayName } from '@client/src/hooks/useUser';
import { cn } from '@client/src/utils/cn';
import { formatDate } from '@client/src/utils/date';
import type { Broadcast, FamilyMember } from '@shared/api.interface';
import { Image } from '@client/src/components/ui/image';

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

export default function HistoryPage() {
  const { family, currentFamily, setCurrentFamily } = useUser();
  const [searchParams] = useSearchParams();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // 从URL参数读取familyId并设置当前家人
  useEffect(() => {
    const familyId = searchParams.get('familyId');
    if (familyId && family.length > 0) {
      const target = family.find((f) => f.userId === familyId);
      if (target && target.id !== currentFamily?.id) {
        setCurrentFamily(target);
      }
    }
  }, [searchParams, family, currentFamily?.id, setCurrentFamily]);

  const { speak, pause, resume, stop, isSpeaking, isPaused } = useSpeech({
    rate: 1,
    pitch: 1,
    lang: 'zh-CN',
  });

  const loadBroadcasts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await broadcastsApi.getInbox(1, 50, currentFamily?.userId);
      setBroadcasts(data.items || []);
    } catch {
      setBroadcasts([]);
    } finally {
      setLoading(false);
    }
  }, [currentFamily]);

  useEffect(() => {
    loadBroadcasts();
    return () => {
      stop();
    };
  }, [loadBroadcasts, stop]);

  const handlePlay = useCallback(
    (item: Broadcast) => {
      if (playingId === item.id) {
        if (isPaused) {
          resume();
        } else {
          pause();
        }
        return;
      }
      stop();
      setPlayingId(item.id);
      speak(item.content);
    },
    [playingId, isPaused, pause, resume, speak, stop]
  );

  const toggleExpand = (item: Broadcast) => {
    if (expandedId === item.id) {
      setExpandedId(null);
      if (playingId === item.id) {
        stop();
        setPlayingId(null);
      }
    } else {
      setExpandedId(item.id);
    }
  };

  const unreadCount = broadcasts.filter((b) => !b.isRead).length;

  return (
    <div className="max-w-[480px] mx-auto px-5 pt-6 pb-6">
      {/* 页面标题 */}
      <h1 className="text-[22px] font-bold text-[#333] mb-2">历史播报</h1>
      <p className="text-sm text-[#999] mb-6">
        {unreadCount > 0 ? `${unreadCount} 条未读温暖播报` : '回顾每一份温暖的关心'}
      </p>

      {/* 家人筛选 */}
      {family.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-5">
          <button
            onClick={() => setCurrentFamily(null)}
            className={cn(
              'px-4 h-9 rounded-xl text-sm font-medium whitespace-nowrap transition-all active:scale-95 flex-shrink-0',
              !currentFamily
                ? 'text-white shadow-sm'
                : 'text-[#999] glass-card'
            )}
            style={
              !currentFamily
                ? {
                    background:
                      'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                    boxShadow: '0 4px 12px rgba(255, 107, 107, 0.25)',
                  }
                : undefined
            }
          >
            全部
          </button>
          {family.map((f) => (
            <button
              key={f.id}
              onClick={() => setCurrentFamily(f)}
              className={cn(
                'flex items-center gap-2 px-4 h-9 rounded-xl text-sm font-medium whitespace-nowrap transition-all active:scale-95 flex-shrink-0',
                currentFamily?.id === f.id
                  ? 'text-white shadow-sm'
                  : 'text-[#999] glass-card'
              )}
              style={
                currentFamily?.id === f.id
                  ? {
                      background:
                        'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                      boxShadow: '0 4px 12px rgba(255, 107, 107, 0.25)',
                    }
                  : undefined
              }
            >
              <span>{getDisplayName(f)}</span>
              {f.hasUnread && (
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    background:
                      currentFamily?.id === f.id ? '#fff' : '#FF6B6B',
                  }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* 列表 */}
      <div className="space-y-4">
        {loading ? (
          <SkeletonList />
        ) : broadcasts.length === 0 ? (
          <EmptyState />
        ) : (
          broadcasts.map((item) => (
            <div
              key={item.id}
              className={cn(
                'glass-card p-5 overflow-hidden transition-all relative',
                !item.isRead ? 'border-[#FF8C69]/40' : ''
              )}
              style={
                !item.isRead
                  ? {
                      borderLeftWidth: '3px',
                      borderLeftColor: '#FF8C69',
                    }
                  : undefined
              }
            >
              {/* 列表项头部 */}
              <button
                onClick={() => toggleExpand(item)}
                className="w-full text-left"
              >
                {/* 顶部：日期 + 心情 tag */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#333]">
                      {getDateShort(item.broadcastDate)}
                    </span>
                    <span className="text-xs text-[#999]">
                      {getWeekday(item.broadcastDate)}
                    </span>
                  </div>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{
                      background:
                        'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                    }}
                  >
                    {getMoodLabel(item.moodIndex)}
                  </span>
                </div>

                {/* 中部：摘要 */}
                <p
                  className="text-base text-[#333] line-clamp-2 mb-4"
                  style={{ lineHeight: 1.6 }}
                >
                  {item.summary}
                </p>

                {/* 底部：播放 + 状态 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlay(item);
                      }}
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 active:scale-90 text-white shadow-sm',
                        playingId === item.id && isSpeaking
                          ? ''
                          : ''
                      )}
                      style={{
                        background:
                          'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                        boxShadow: '0 3px 8px rgba(255, 107, 107, 0.3)',
                      }}
                      aria-label={playingId === item.id ? '暂停' : '播放'}
                    >
                      {playingId === item.id && isSpeaking && !isPaused ? (
                        <Pause size={12} fill="currentColor" />
                      ) : (
                        <Play
                          size={12}
                          className="ml-0.5"
                          fill="currentColor"
                        />
                      )}
                    </button>
                    <span className="text-xs text-[#999]">
                      {item.senderNickname || '家人'}的播报
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!item.isRead ? (
                      <>
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: '#FF6B6B' }}
                        />
                        <span className="text-xs text-[#FF6B6B] font-medium">
                          未读
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-[#999]">已读</span>
                    )}
                    {expandedId === item.id ? (
                      <ChevronUp size={16} className="text-[#999]" />
                    ) : (
                      <ChevronDown size={16} className="text-[#999]" />
                    )}
                  </div>
                </div>
              </button>

              {/* 展开的详情 */}
              <AnimatePresence initial={false}>
                {expandedId === item.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pt-5 mt-4" style={{ borderTop: '1px solid rgba(255, 140, 105, 0.15)' }}>
                      {/* 播报人信息 */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                          style={{ background: 'rgba(255, 140, 105, 0.1)' }}
                        >
                          {item.senderAvatar ? (
                            <Image
                              src={item.senderAvatar}
                              alt={item.senderNickname || ''}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User size={18} style={{ color: '#FF8C69' }} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#333]">
                            {item.senderNickname || '家人'}
                          </p>
                          <p className="text-xs text-[#999]">
                            {formatDate(item.broadcastDate)}
                          </p>
                        </div>
                      </div>

                      {/* 完整内容 */}
                      <div
                        className="rounded-2xl p-4 mb-4"
                        style={{
                          background: 'rgba(255, 140, 105, 0.06)',
                        }}
                      >
                        <p
                          className="text-sm text-[#333] whitespace-pre-wrap"
                          style={{ lineHeight: 1.8 }}
                        >
                          {item.content}
                        </p>
                      </div>

                      {/* 底部播放条 */}
                      <div className="flex items-center gap-2 mb-4">
                        <button
                          onClick={() => handlePlay(item)}
                          className={cn(
                            'flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-medium active:scale-[0.98] transition-transform text-white'
                          )}
                          style={{
                            background:
                              playingId === item.id && isSpeaking
                                ? 'rgba(255, 140, 105, 0.15)'
                                : 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                            color:
                              playingId === item.id && isSpeaking
                                ? '#FF6B6B'
                                : '#fff',
                            boxShadow:
                              playingId === item.id && isSpeaking
                                ? 'none'
                                : '0 4px 12px rgba(255, 107, 107, 0.25)',
                          }}
                        >
                          {playingId === item.id && isSpeaking && !isPaused ? (
                            <>
                              <Pause size={16} fill="currentColor" />
                              暂停播放
                            </>
                          ) : playingId === item.id && isPaused ? (
                            <>
                              <Play size={16} fill="currentColor" />
                              继续播放
                            </>
                          ) : (
                            <>
                              <Play
                                size={16}
                                fill="currentColor"
                                className="ml-0.5"
                              />
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
                          className="flex-1 h-10 px-4 rounded-xl text-sm text-[#333] placeholder:text-[#999] outline-none transition-all"
                          style={{
                            background: 'rgba(255, 255, 255, 0.6)',
                            border: '1px solid rgba(255, 140, 105, 0.2)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                          }}
                        />
                        <button
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white active:scale-90 transition-transform"
                          style={{
                            background:
                              'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                            boxShadow: '0 4px 12px rgba(255, 107, 107, 0.25)',
                          }}
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="glass-card p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-20 rounded animate-pulse" style={{ background: 'rgba(255, 140, 105, 0.15)' }} />
            <div className="h-5 w-16 rounded-full animate-pulse" style={{ background: 'rgba(255, 140, 105, 0.15)' }} />
          </div>
          <div className="h-4 w-full rounded animate-pulse mb-1.5" style={{ background: 'rgba(255, 140, 105, 0.12)' }} />
          <div className="h-4 w-3/4 rounded animate-pulse mb-4" style={{ background: 'rgba(255, 140, 105, 0.12)' }} />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full animate-pulse" style={{ background: 'rgba(255, 140, 105, 0.15)' }} />
              <div className="h-3 w-20 rounded animate-pulse" style={{ background: 'rgba(255, 140, 105, 0.12)' }} />
            </div>
            <div className="h-3 w-10 rounded animate-pulse" style={{ background: 'rgba(255, 140, 105, 0.12)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-5"
        style={{
          background: 'rgba(255, 140, 105, 0.1)',
        }}
      >
        <Heart
          size={44}
          style={{ color: '#FF8C69' }}
          fill="currentColor"
        />
      </div>
      <p className="text-lg font-semibold text-[#333] mb-2">
        还没有历史播报
      </p>
      <p
        className="text-sm text-[#999] text-center max-w-[260px] mb-6"
        style={{ lineHeight: 1.6 }}
      >
        家人的每日播报会在这里显示，耐心等待吧
      </p>
      <button
        className="btn-gradient px-8 text-base"
        style={{ height: '48px', borderRadius: '16px' }}
      >
        去首页看看
      </button>
    </div>
  );
}
