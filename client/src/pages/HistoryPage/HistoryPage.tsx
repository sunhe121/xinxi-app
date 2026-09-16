import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { broadcastsApi } from '@client/src/api';
import { useSpeech } from '@client/src/hooks/useSpeech';
import { useUser, getDisplayName } from '@client/src/hooks/useUser';
import { cn } from '@client/src/utils/cn';
import type { Broadcast, FamilyMember } from '@shared/api.interface';
import BroadcastCard from './BroadcastCard';
import HistoryEmptyState from './HistoryEmptyState';
import HistorySkeleton from './HistorySkeleton';

export default function HistoryPage() {
  const { family, currentFamily, setCurrentFamily } = useUser();
  const [searchParams] = useSearchParams();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 从URL参数读取familyId并设置当前家人
  useEffect(() => {
    const familyId = searchParams.get('familyId');
    if (familyId && family.length > 0) {
      const target = family.find((f: FamilyMember) => f.userId === familyId);
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

  const [playingId, setPlayingId] = useState<string | null>(null);

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

  const unreadCount = broadcasts.filter((b: Broadcast) => !b.isRead).length;

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-[480px] mx-auto px-5 pt-6 pb-32 space-y-5">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold text-[#333] mb-2">历史播报</h1>
          <p className="text-sm text-[#999]" style={{ lineHeight: 1.5 }}>
            {unreadCount > 0 ? `${unreadCount} 条未读温暖播报` : '回顾每一份温暖的关心'}
          </p>
        </div>

        {/* 家人筛选 Tab */}
        {family.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-5 px-5">
            <button
              onClick={() => setCurrentFamily(null)}
              className={cn(
                'h-9 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-[0.98] flex-shrink-0',
                !currentFamily ? 'text-white' : ''
              )}
              style={
                !currentFamily
                  ? {
                      background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                      boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                      border: 'none',
                    }
                  : {
                      background: 'rgba(255, 255, 255, 0.6)',
                      WebkitBackdropFilter: 'blur(10px)',
                      backdropFilter: 'blur(10px)',
                      color: '#999',
                      border: '1px solid rgba(255, 255, 255, 0.8)',
                    }
              }
            >
              全部
            </button>
            {family.map((f: FamilyMember) => (
              <button
                key={f.id}
                onClick={() => setCurrentFamily(f)}
                className={cn(
                  'flex items-center gap-2 h-9 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-[0.98] flex-shrink-0',
                  currentFamily?.id === f.id ? 'text-white' : ''
                )}
                style={
                  currentFamily?.id === f.id
                    ? {
                        background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                        boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                        border: 'none',
                      }
                    : {
                        background: 'rgba(255, 255, 255, 0.6)',
                        WebkitBackdropFilter: 'blur(10px)',
                        backdropFilter: 'blur(10px)',
                        color: '#999',
                        border: '1px solid rgba(255, 255, 255, 0.8)',
                      }
                }
              >
                <span>{getDisplayName(f)}</span>
                {f.hasUnread && (
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background: currentFamily?.id === f.id ? '#fff' : '#FF6B6B',
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
            <HistorySkeleton />
          ) : broadcasts.length === 0 ? (
            <HistoryEmptyState />
          ) : (
            broadcasts.map((item: Broadcast) => (
              <BroadcastCard
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                playingId={playingId}
                isSpeaking={isSpeaking}
                isPaused={isPaused}
                onToggleExpand={toggleExpand}
                onPlay={handlePlay}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
