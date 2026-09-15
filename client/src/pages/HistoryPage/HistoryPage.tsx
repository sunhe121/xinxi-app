import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Heart,
  Calendar,
  User,
  Loader2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { broadcastsApi } from '@client/src/api';
import { useSpeech } from '@client/src/hooks/useSpeech';
import { useUser, getDisplayName } from '@client/src/hooks/useUser';
import { cn } from '@client/src/utils/cn';
import { formatDate } from '@client/src/utils/date';
import type { Broadcast, FamilyMember } from '@shared/api.interface';
import { Image } from '@client/src/components/ui/image';

export default function HistoryPage() {
  const { family, currentFamily, setCurrentFamily } = useUser();
  const [searchParams] = useSearchParams();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

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
    <div className="min-h-screen bg-background max-w-[480px] mx-auto">
      {/* 顶部标题 */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-semibold text-foreground">历史播报</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {unreadCount > 0 ? `${unreadCount} 条未读` : '回顾每一份温暖的关心'}
        </p>
      </div>

      {/* 家人筛选 */}
      {family.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-5 pb-4">
          <button
            onClick={() => setCurrentFamily(null)}
            className={cn(
              'px-4 min-h-11 rounded-full text-base font-medium whitespace-nowrap transition-all active:scale-95 flex-shrink-0',
              !currentFamily
                ? 'bg-primary text-white shadow-md'
                : 'bg-secondary text-muted-foreground'
            )}
          >
            全部
          </button>
          {family.map((f) => (
            <button
              key={f.id}
              onClick={() => setCurrentFamily(f)}
              className={cn(
                'flex items-center gap-2 px-4 min-h-11 rounded-full text-base font-medium whitespace-nowrap transition-all active:scale-95 flex-shrink-0',
                currentFamily?.id === f.id
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-secondary text-muted-foreground'
              )}
            >
              <span>{getDisplayName(f)}</span>
              {f.hasUnread && (
                <span className="w-2 h-2 rounded-full bg-destructive" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* 列表 */}
      <div className="px-5 pb-24 space-y-3">
        {loading ? (
          <SkeletonList />
        ) : broadcasts.length === 0 ? (
          <EmptyState />
        ) : (
          broadcasts.map((item) => (
            <div
              key={item.id}
              className={cn(
                'bg-card rounded-2xl shadow-sm overflow-hidden transition-all',
                expandedId === item.id ? 'ring-2 ring-primary/20' : ''
              )}
            >
              {/* 列表项头部 */}
              <button
                onClick={() => toggleExpand(item)}
                className="w-full p-4 text-left active:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.senderAvatar ? (
                      <Image
                        src={item.senderAvatar}
                        alt={item.senderNickname || ''}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={18} className="text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground text-sm">
                        {item.senderNickname || '家人'}
                      </span>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <Calendar size={12} />
                      <span>{formatDate(item.broadcastDate)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay(item);
                    }}
                    className={cn(
                      'w-11 h-11 rounded-full flex items-center justify-center transition-colors flex-shrink-0 active:scale-95',
                      playingId === item.id && isSpeaking
                        ? 'bg-primary text-white'
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                    )}
                    aria-label={playingId === item.id ? '暂停' : '播放'}
                  >
                    {playingId === item.id && isSpeaking && !isPaused ? (
                      <Pause size={18} fill="currentColor" />
                    ) : (
                      <Play size={18} className="ml-0.5" fill="currentColor" />
                    )}
                  </button>
                </div>

                <p className="text-sm text-foreground leading-relaxed line-clamp-2">
                  {item.summary}
                </p>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">
                    {expandedId === item.id ? '收起详情' : '点击展开全文'}
                  </span>
                  {expandedId === item.id ? (
                    <ChevronUp size={16} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={16} className="text-muted-foreground" />
                  )}
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
                    <div className="px-4 pb-4 pt-2 border-t border-border/60">
                      <div className="bg-secondary/50 rounded-xl p-4">
                        <p className="text-sm text-foreground leading-loose whitespace-pre-wrap">
                          {item.content}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => handlePlay(item)}
                          className={cn(
                            'flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-medium active:scale-[0.98] transition-transform',
                            playingId === item.id && isSpeaking
                              ? 'bg-primary text-white'
                              : 'bg-primary/10 text-primary'
                          )}
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
                              <Play size={16} fill="currentColor" className="ml-0.5" />
                              播放全文
                            </>
                          )}
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
    <div className="space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-card rounded-2xl p-4 shadow-sm overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-border animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-20 bg-border rounded animate-pulse" />
              <div className="h-3 w-16 bg-border/60 rounded animate-pulse" />
            </div>
            <div className="w-10 h-10 rounded-full bg-border animate-pulse" />
          </div>
          <div className="h-4 w-full bg-border/60 rounded animate-pulse mb-1" />
          <div className="h-4 w-3/4 bg-border/60 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-5">
        <Heart size={44} className="text-primary" fill="currentColor" />
      </div>
      <p className="text-lg font-semibold text-foreground mb-2">
        还没有历史播报
      </p>
      <p className="text-sm text-muted-foreground text-center max-w-[260px] leading-relaxed mb-6">
        家人的每日播报会在这里显示，耐心等待吧
      </p>
    </div>
  );
}
