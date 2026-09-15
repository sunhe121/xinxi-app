import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, getDisplayName, RELATION_LABELS } from '@client/src/hooks/useUser';
import { broadcastsApi, messagesApi } from '@client/src/api';
import { useSpeech } from '@client/src/hooks/useSpeech';
import { getGreeting, formatDate } from '@client/src/utils/date';
import { cn } from '@client/src/utils/cn';
import type { Broadcast, FamilyMember } from '@shared/api.interface';
import {
  Play,
  Pause,
  User,
  UserPlus,
  Send,
  Loader2,
  Clock,
  Heart,
  ChevronRight,
  X,
  MessageCircleHeart,
} from 'lucide-react';
import { toast } from 'sonner';
import { Image } from '@client/src/components/ui/image';

const SPEED_OPTIONS = [0.8, 1.0, 1.2, 1.5];

const THINK_OF_YOU_TEMPLATES = [
  '想你了',
  '注意身体',
  '早点休息',
  '今天开心吗',
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user, family, currentFamily, setCurrentFamily, loading: userLoading } = useUser();

  const [latestBroadcast, setLatestBroadcast] = useState<Broadcast | null>(null);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // 回复相关
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);

  // 想TA了抽屉
  const [showThinkSheet, setShowThinkSheet] = useState(false);
  const [thinkContent, setThinkContent] = useState('');
  const [thinkSending, setThinkSending] = useState(false);

  const { speak, pause, resume, stop, isSpeaking, isPaused, isSupported } = useSpeech({
    rate: playbackSpeed,
  });

  // 加载最新播报
  const loadLatestBroadcast = useCallback(async () => {
    if (!currentFamily) return;
    setBroadcastLoading(true);
    try {
      const res = await broadcastsApi.getInbox(1, 1, currentFamily.userId);
      if (res.items && res.items.length > 0) {
        setLatestBroadcast(res.items[0]);
      } else {
        setLatestBroadcast(null);
      }
    } catch {
      setLatestBroadcast(null);
    } finally {
      setBroadcastLoading(false);
    }
  }, [currentFamily]);

  useEffect(() => {
    if (currentFamily) {
      loadLatestBroadcast();
    } else {
      setLatestBroadcast(null);
    }
    return () => {
      stop();
    };
  }, [currentFamily, loadLatestBroadcast, stop]);

  const handleTogglePlay = () => {
    if (!latestBroadcast?.content) return;
    // 首次播放时标记已读
    if (!latestBroadcast.isRead) {
      handleMarkAsRead(latestBroadcast.id);
    }
    if (isSpeaking && !isPaused) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      speak(latestBroadcast.content, { rate: playbackSpeed });
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (isSpeaking) {
      stop();
      if (latestBroadcast?.content) {
        setTimeout(() => speak(latestBroadcast.content, { rate: speed }), 50);
      }
    }
  };

  const handleMarkAsRead = useCallback(async (id: string) => {
    if (markingRead) return;
    setMarkingRead(true);
    try {
      const updated = await broadcastsApi.markAsRead(id);
      setLatestBroadcast(updated);
      toast.success('已发送');
    } catch {
      // 静默失败
    } finally {
      setMarkingRead(false);
    }
  }, [markingRead]);

  const handleReceived = async () => {
    if (!latestBroadcast) return;
    await handleMarkAsRead(latestBroadcast.id);
  };

  const handleReply = async () => {
    if (!latestBroadcast || !replyText.trim()) return;
    setReplySending(true);
    try {
      const updated = await broadcastsApi.reply(latestBroadcast.id, {
        content: replyText.trim(),
      });
      setLatestBroadcast(updated);
      setReplyText('');
      setReplyOpen(false);
      toast.success('回复已发送');
    } catch {
      toast.error('回复失败，请重试');
    } finally {
      setReplySending(false);
    }
  };

  const handleSendThinkOfYou = async (content: string, type: 'text' | 'template' = 'text') => {
    if (!currentFamily) return;
    setThinkSending(true);
    try {
      await messagesApi.sendThinkOfYou(currentFamily.userId, content, type);
      toast.success(`已发送给${getDisplayName(currentFamily)}`);
      setShowThinkSheet(false);
      setThinkContent('');
    } catch {
      toast.error('发送失败，请重试');
    } finally {
      setThinkSending(false);
    }
  };

  // 判断今日是否已有播报
  const hasTodayBroadcast = (): boolean => {
    if (!latestBroadcast) return false;
    const today = new Date().toISOString().split('T')[0];
    return latestBroadcast.broadcastDate === today;
  };

  // 格式化对方活跃时间
  const formatLastActive = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return '刚刚活跃';
    if (hours < 24) return `${hours}小时前活跃`;
    const days = Math.floor(hours / 24);
    return `${days}天前活跃`;
  };

  if (userLoading) {
    return (
      <div className="p-5 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-[480px] mx-auto px-5 py-6 pb-[120px] space-y-6">
      {/* 顶部问候区 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {getGreeting()}，{user?.nickname || '朋友'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {family.length > 0 ? '来看看家人今天怎么样' : '开启你的心系之旅'}
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
          {user?.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.nickname}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-6 h-6 text-primary" />
          )}
        </div>
      </div>

      {/* 家人切换条 */}
      {family.length > 0 && (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
          {family.map((f: FamilyMember) => (
            <button
              key={f.id}
              onClick={() => setCurrentFamily(f)}
              className={cn(
                'flex items-center gap-2.5 px-3.5 py-2 min-h-11 rounded-full whitespace-nowrap transition-all duration-300 flex-shrink-0 active:scale-95',
                currentFamily?.id === f.id
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-secondary text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center overflow-hidden relative',
                  currentFamily?.id === f.id ? 'bg-white/20' : 'bg-primary/10'
                )}
              >
                {f.avatarUrl ? (
                  <Image
                    src={f.avatarUrl}
                    alt={f.nickname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={14} className={currentFamily?.id === f.id ? 'text-white' : 'text-primary'} />
                )}
                {f.hasUnread && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-destructive rounded-full ring-2 ring-card" />
                )}
              </div>
              <span className="text-sm font-medium">{getDisplayName(f)}</span>
            </button>
          ))}
        </div>
      )}

      {/* 没有家人时的引导配对卡片 */}
      {family.length === 0 && (
        <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-3xl p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/80 flex items-center justify-center">
            <UserPlus size={36} className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">还没有家人配对</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            绑定家人后，每天都能收到TA的温暖播报，
            <br />
            让陪伴不缺席
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/onboarding')}
              className="flex-1 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-semibold text-base shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              <UserPlus size={18} />
              生成邀请码
            </button>
            <button
              onClick={() => navigate('/family')}
              className="flex-1 py-4 bg-white text-foreground rounded-2xl font-semibold text-base shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 border border-border"
            >
              输入邀请码
            </button>
          </div>
        </div>
      )}

      {/* 主内容：大播报卡片 + 想TA了按钮 */}
      {currentFamily && (
        <>
          {broadcastLoading ? (
            <div className="bg-card rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-full bg-secondary animate-pulse" />
                <div className="flex-1">
                  <div className="h-5 w-24 bg-secondary rounded animate-pulse mb-1.5" />
                  <div className="h-4 w-20 bg-secondary/60 rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-2 mb-6">
                <div className="h-4 w-full bg-secondary/60 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-secondary/60 rounded animate-pulse" />
                <div className="h-4 w-4/5 bg-secondary/60 rounded animate-pulse" />
              </div>
              <div className="flex justify-center">
                <div className="w-[72px] h-[72px] rounded-full bg-secondary animate-pulse" />
              </div>
            </div>
          ) : latestBroadcast ? (
            <div className="bg-gradient-to-br from-primary/5 via-secondary/20 to-accent/10 rounded-2xl p-6 shadow-sm">
              {/* 卡片头 */}
              <button
                onClick={() => navigate(`/chat/${currentFamily.id}`)}
                className="w-full flex items-start gap-3 mb-5 text-left active:opacity-70 transition-opacity"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {currentFamily.avatarUrl ? (
                    <Image
                      src={currentFamily.avatarUrl}
                      alt={currentFamily.nickname}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={24} className="text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground text-base">
                      {getDisplayName(currentFamily)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      给你的今日关心
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {hasTodayBroadcast() ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/15 text-success text-xs font-medium">
                        今日已送达
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/20 text-warning text-xs font-medium">
                        今日播报预计晚上8点送达
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} className="text-muted-foreground mt-2 flex-shrink-0" />
              </button>

              {/* 播报内容 */}
              <div className="bg-white/70 backdrop-blur rounded-2xl p-5 mb-6 shadow-sm">
                <p className="text-base leading-loose text-foreground whitespace-pre-wrap">
                  {latestBroadcast.content}
                </p>
              </div>

              {/* 大播放按钮 */}
              <div className="flex flex-col items-center gap-4 mb-6">
                <button
                  onClick={handleTogglePlay}
                  disabled={!isSupported}
                  className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-all disabled:opacity-50"
                  aria-label={isSpeaking && !isPaused ? '暂停' : '播放'}
                >
                  {isSpeaking && !isPaused ? (
                    <Pause size={32} fill="white" />
                  ) : (
                    <Play size={32} fill="white" className="ml-1" />
                  )}
                </button>

                {/* 语速调节 */}
                <div className="flex items-center gap-1 bg-white/80 rounded-full px-2 py-1.5 shadow-sm">
                  {SPEED_OPTIONS.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={cn(
                        'px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-300 min-h-9',
                        playbackSpeed === speed
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* 回复区域 */}
              <div className="space-y-3">
                {/* 已有回复显示 */}
                {latestBroadcast.replyContent && (
                  <div className="bg-white/60 rounded-2xl p-4 border border-primary/10">
                    <p className="text-xs text-muted-foreground mb-1.5">我的回复：</p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {latestBroadcast.replyContent}
                    </p>
                  </div>
                )}

                {/* 回复按钮组 */}
                {!latestBroadcast.replyContent && !replyOpen && (
                  <div className="flex gap-3">
                    <button
                      onClick={handleReceived}
                      disabled={markingRead || latestBroadcast.isRead}
                      className="flex-1 min-h-12 bg-primary/10 text-primary rounded-2xl font-medium text-base active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      <Heart size={18} fill="currentColor" />
                      {latestBroadcast.isRead ? '已收到' : '收到'}
                    </button>
                    <button
                      onClick={() => setReplyOpen(true)}
                      className="flex-1 min-h-12 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-medium text-base active:scale-95 transition-transform shadow-md flex items-center justify-center gap-2"
                    >
                      <Send size={18} />
                      回复TA
                    </button>
                  </div>
                )}

                {/* 回复输入框 */}
                {!latestBroadcast.replyContent && replyOpen && (
                  <div className="space-y-2">
                    <div className="flex gap-2 items-end">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="说句话回复TA..."
                        rows={2}
                        maxLength={200}
                        className="flex-1 px-4 py-3 rounded-2xl bg-white/80 border border-border text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground"
                        autoFocus
                      />
                      <button
                        onClick={handleReply}
                        disabled={!replyText.trim() || replySending}
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center flex-shrink-0 shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="text-xs text-muted-foreground"
                    >
                      取消
                    </button>
                  </div>
                )}
              </div>

              {/* 卡片底部来源 */}
              <div className="mt-5 pt-4 border-t border-primary/10">
                <p className="text-xs text-muted-foreground">
                  来自：{getDisplayName(currentFamily)} · {formatDate(latestBroadcast.broadcastDate)}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-6 shadow-sm text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock size={36} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                今天的播报还没到
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {getDisplayName(currentFamily)}每天会定时生成播报，
                <br />
                耐心等待一下吧~
              </p>
              <button
                onClick={loadLatestBroadcast}
                className="px-6 min-h-12 bg-primary/10 text-primary rounded-full text-base font-medium active:scale-95 transition-transform flex items-center justify-center inline-flex"
              >
                刷新看看
              </button>
            </div>
          )}

          {/* 想TA了按钮 */}
          <button
            onClick={() => setShowThinkSheet(true)}
            className="w-full py-5 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] text-white rounded-3xl font-semibold text-lg shadow-lg shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 hover:bg-[position:100%_0]"
          >
            <Heart size={24} fill="white" />
            想TA了
          </button>

          {/* 对方状态卡片 */}
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className={cn(
              'w-3 h-3 rounded-full flex-shrink-0',
              latestBroadcast ? 'bg-success' : 'bg-muted-foreground/40'
            )} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {getDisplayName(currentFamily)}
                {latestBroadcast ? '今天已生成播报' : '今天还没有播报'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentFamily.lastActiveAt
                  ? formatLastActive(currentFamily.lastActiveAt)
                  : '暂无活跃记录'}
              </p>
            </div>
            <button
              onClick={() => navigate('/history')}
              className="min-h-10 px-3 text-sm text-primary font-medium flex items-center gap-1 flex-shrink-0 rounded-xl active:bg-primary/5 transition-colors"
            >
              历史
              <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}

      {/* 想TA了底部抽屉 */}
      {showThinkSheet && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 animate-fadeIn"
            onClick={() => setShowThinkSheet(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-6 pb-8 animate-slideUp max-w-[480px] mx-auto">
            {/* 顶部把手 */}
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

            {/* 标题 + 关闭 */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <MessageCircleHeart size={22} className="text-primary" />
                对TA说句话
              </h2>
            <button
              onClick={() => setShowThinkSheet(false)}
              className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-muted-foreground active:scale-95 transition-transform"
              aria-label="关闭"
            >
              <X size={22} />
            </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              选一句发给 {getDisplayName(currentFamily) || '家人'}：
            </p>

            {/* 模板按钮 */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {THINK_OF_YOU_TEMPLATES.map((tpl) => (
                <button
                  key={tpl}
                  onClick={() => handleSendThinkOfYou(tpl, 'template')}
                  disabled={thinkSending}
                  className="min-h-12 bg-secondary hover:bg-primary/10 text-foreground rounded-2xl font-medium text-base active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {tpl}
                </button>
              ))}
            </div>

            {/* 自定义输入 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                自定义一句话
              </label>
              <div className="flex gap-2 items-end">
                <textarea
                  value={thinkContent}
                  onChange={(e) => setThinkContent(e.target.value)}
                  placeholder="想说点什么..."
                  rows={2}
                  maxLength={100}
                  className="flex-1 px-4 py-3 rounded-2xl bg-secondary border border-transparent text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground"
                />
                <button
                  onClick={() => handleSendThinkOfYou(thinkContent, 'text')}
                  disabled={!thinkContent.trim() || thinkSending}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center flex-shrink-0 shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="发送"
                >
                  {thinkSending ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
}
