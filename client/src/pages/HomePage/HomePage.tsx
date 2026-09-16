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
  Footprints,
  Moon,
  Mic,
  Settings,
  Share2,
  Activity,
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
        <Loader2 className="w-8 h-8 text-[#FF8C69] animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-6 pb-[120px] space-y-5">
      {/* 顶部问候区 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#333] font-bold text-xl">
            {getGreeting()}，{user?.nickname || '朋友'}
          </h1>
          <p className="text-[#999] text-sm mt-1">
            {family.length > 0 ? '来看看家人今天怎么样' : '开启你的心系之旅'}
          </p>
        </div>
        <div className="relative w-12 h-12 rounded-full flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)', padding: '2px' }}>
          <div className="w-full h-full rounded-full bg-white/75 backdrop-blur-xl -webkit-backdrop-blur-xl flex items-center justify-center overflow-hidden">
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.nickname}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-[#FF8C69]" />
            )}
          </div>
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
                  ? 'text-white shadow-md'
                  : 'glass-card text-[#999]'
              )}
              style={currentFamily?.id === f.id ? { background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' } : {}}
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center overflow-hidden relative',
                  currentFamily?.id === f.id ? 'bg-white/20' : ''
                )}
                style={currentFamily?.id === f.id ? {} : { background: 'linear-gradient(135deg, rgba(255,140,105,0.15) 0%, rgba(255,107,107,0.1) 100%)' }}
              >
                {f.avatarUrl ? (
                  <Image
                    src={f.avatarUrl}
                    alt={f.nickname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={14} className={currentFamily?.id === f.id ? 'text-white' : 'text-[#FF8C69]'} />
                )}
                {f.hasUnread && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#FF6B6B] rounded-full ring-2 ring-white/70" />
                )}
              </div>
              <span className="text-sm font-medium">{getDisplayName(f)}</span>
            </button>
          ))}
        </div>
      )}

      {/* 没有家人时的引导配对卡片 */}
      {family.length === 0 && (
        <div className="glass-card p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(255,140,105,0.15) 0%, rgba(255,107,107,0.1) 100%)' }}>
            <UserPlus size={36} className="text-[#FF8C69]" />
          </div>
          <h2 className="text-lg font-semibold text-[#333] mb-2">还没有家人配对</h2>
          <p className="text-sm text-[#999] leading-relaxed mb-6">
            绑定家人后，每天都能收到TA的温暖播报，
            <br />
            让陪伴不缺席
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/onboarding')}
              className="flex-1 btn-gradient flex items-center justify-center gap-1.5 text-base"
            >
              <UserPlus size={18} />
              生成邀请码
            </button>
            <button
              onClick={() => navigate('/family')}
              className="flex-1 h-[52px] bg-white/80 backdrop-blur-xl -webkit-backdrop-blur-xl text-[#FF8C69] rounded-2xl font-semibold text-base active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 border border-white/80"
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
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-full bg-white/50 animate-pulse" />
                <div className="flex-1">
                  <div className="h-5 w-24 bg-white/50 rounded animate-pulse mb-1.5" />
                  <div className="h-4 w-20 bg-white/30 rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-2 mb-6">
                <div className="h-4 w-full bg-white/50 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-white/40 rounded animate-pulse" />
                <div className="h-4 w-4/5 bg-white/30 rounded animate-pulse" />
              </div>
              <div className="flex justify-center">
                <div className="w-[72px] h-[72px] rounded-full bg-white/50 animate-pulse" />
              </div>
            </div>
          ) : latestBroadcast ? (
            <>
              <div className="glass-card p-6 mb-5">
                {/* 顶部：日期 + 心情指数 */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[#999] text-sm">
                  {formatDate(latestBroadcast.broadcastDate)}
                </span>
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-xs font-medium"
                  style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
                >
                  <Heart size={12} fill="white" />
                  心情指数 {latestBroadcast.moodIndex}
                </span>
              </div>

              {/* 播报内容摘要 */}
              <p className="text-[#333] text-base leading-relaxed mb-5 line-clamp-3">
                {latestBroadcast.summary || latestBroadcast.content}
              </p>

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
                  <p className="text-[#999] text-xs mt-0.5">
                    生成于 {new Date(latestBroadcast.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {/* 语速调节 */}
                <div className="flex items-center gap-0.5 bg-white/60 backdrop-blur-xl -webkit-backdrop-blur-xl rounded-full px-1.5 py-1">
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
                      style={playbackSpeed === speed ? { background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' } : {}}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* 回复区域 */}
              <div className="mt-5 pt-5 border-t border-white/30 space-y-3">
                {/* 已有回复显示 */}
                {latestBroadcast.replyContent && (
                  <div className="bg-white/60 rounded-2xl p-4">
                    <p className="text-xs text-[#999] mb-1.5">我的回复：</p>
                    <p className="text-sm text-[#333] leading-relaxed">
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
                      className="flex-1 min-h-12 bg-white/70 text-[#FF8C69] rounded-2xl font-medium text-base active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2 border border-white/80"
                    >
                      <Heart size={18} fill="currentColor" />
                      {latestBroadcast.isRead ? '已收到' : '收到'}
                    </button>
                    <button
                      onClick={() => setReplyOpen(true)}
                      className="flex-1 btn-gradient flex items-center justify-center gap-2 text-base"
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

              {/* 数据概览卡片 */}
              <div className="glass-card p-6 mb-5">
                <h3 className="text-lg font-semibold text-[#333] mb-4">今日数据</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
                    >
                      <Footprints size={20} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl font-bold text-[#333] leading-tight">
                        {latestBroadcast.steps?.toLocaleString() || 0}
                      </p>
                      <p className="text-xs text-[#999] mt-0.5">步数</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #FFB5B5 0%, #FF8C69 100%)' }}
                    >
                      <Moon size={20} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl font-bold text-[#333] leading-tight">
                        {latestBroadcast.sleepHours || 0}h
                      </p>
                      <p className="text-xs text-[#999] mt-0.5">睡眠</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FFB347 100%)' }}
                    >
                      <Heart size={20} className="text-white" fill="white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl font-bold text-[#333] leading-tight">
                        {latestBroadcast.moodIndex || 0}
                      </p>
                      <p className="text-xs text-[#999] mt-0.5">心情指数</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #98D8C8 0%, #74B9FF 100%)' }}
                    >
                      <Activity size={20} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl font-bold text-[#333] leading-tight">
                        {latestBroadcast.weatherInfo?.temperature || '--'}°
                      </p>
                      <p className="text-xs text-[#999] mt-0.5">
                        {latestBroadcast.weatherInfo?.weather || '天气'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 快捷操作区 */}
              <div className="flex justify-around mb-5 px-1">
              <button
                onClick={() => navigate('/recordings')}
                className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className="w-14 h-14 rounded-full glass-card flex items-center justify-center">
                  <Mic size={24} className="text-[#FF8C69]" />
                </div>
                <span className="text-xs text-[#333] font-medium">录关心话</span>
              </button>
              <button
                onClick={() => navigate('/history')}
                className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className="w-14 h-14 rounded-full glass-card flex items-center justify-center">
                  <Activity size={24} className="text-[#FF8C69]" />
                </div>
                <span className="text-xs text-[#333] font-medium">家人动态</span>
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className="w-14 h-14 rounded-full glass-card flex items-center justify-center">
                  <Settings size={24} className="text-[#FF8C69]" />
                </div>
                <span className="text-xs text-[#333] font-medium">设置</span>
              </button>
                <button
                  onClick={() => setShowThinkSheet(true)}
                  className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
                >
                  <div className="w-14 h-14 rounded-full glass-card flex items-center justify-center">
                    <Share2 size={24} className="text-[#FF8C69]" />
                  </div>
                  <span className="text-xs text-[#333] font-medium">分享</span>
                </button>
              </div>
            </>
          ) : (
            <div className="glass-card p-6 text-center mb-5">
              <div
                className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(255,140,105,0.15) 0%, rgba(255,107,107,0.1) 100%)' }}
              >
                <Clock size={36} className="text-[#FF8C69]" />
              </div>
              <h3 className="text-lg font-semibold text-[#333] mb-2">
                今天的播报还没到
              </h3>
              <p className="text-sm text-[#999] leading-relaxed mb-6">
                {getDisplayName(currentFamily)}每天会定时生成播报，
                <br />
                耐心等待一下吧~
              </p>
              <button
                onClick={loadLatestBroadcast}
                className="px-6 h-12 rounded-2xl text-[#FF8C69] font-medium text-base active:scale-95 transition-transform flex items-center justify-center inline-flex bg-white/70 border border-white/80"
              >
                刷新看看
              </button>
            </div>
          )}

          {/* 想TA了按钮 */}
          <button
            onClick={() => setShowThinkSheet(true)}
            className="w-full btn-gradient flex items-center justify-center gap-2 text-lg mb-5"
          >
            <Heart size={24} fill="white" />
            想TA了
          </button>

          {/* 最近播报列表 */}
          <div className="glass-card p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#333]">最近播报</h3>
              <button
                onClick={() => navigate('/history')}
                className="text-sm text-[#FF8C69] font-medium flex items-center gap-0.5"
              >
                更多
                <ChevronRight size={14} />
              </button>
            </div>
            {latestBroadcast ? (
              <div className="h-16 flex items-center border-b border-white/30 last:border-b-0">
                <div className="flex-shrink-0 mr-4 text-center">
                  <p className="text-[#333] text-sm font-medium">
                    {new Date(latestBroadcast.broadcastDate).getDate()}日
                  </p>
                  <p className="text-[#999] text-xs">
                    {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(latestBroadcast.broadcastDate).getDay()]}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#333] text-sm truncate">
                    {latestBroadcast.summary || latestBroadcast.content}
                  </p>
                </div>
                <button
                  onClick={handleTogglePlay}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ml-3"
                  style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
                  aria-label="播放"
                >
                  {isSpeaking && !isPaused ? (
                    <Pause size={14} fill="white" />
                  ) : (
                    <Play size={14} fill="white" className="ml-0.5" />
                  )}
                </button>
              </div>
            ) : (
              <div className="h-16 flex items-center justify-center">
                <p className="text-[#999] text-sm">暂无播报记录</p>
              </div>
            )}
            <div className="pt-3 mt-1 flex items-center gap-3">
              <div className={cn(
                'w-2.5 h-2.5 rounded-full flex-shrink-0',
                latestBroadcast ? 'bg-[#6BCB77]' : 'bg-[#999]/40'
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#333] font-medium">
                  {getDisplayName(currentFamily)}
                  {latestBroadcast ? '今天已生成播报' : '今天还没有播报'}
                </p>
                <p className="text-xs text-[#999] mt-0.5">
                  {currentFamily.lastActiveAt
                    ? formatLastActive(currentFamily.lastActiveAt)
                    : '暂无活跃记录'}
                </p>
              </div>
            </div>
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
          <div className="absolute bottom-0 left-0 right-0 rounded-t-[28px] p-6 pb-8 animate-slideUp max-w-[480px] mx-auto" style={{ background: 'rgba(255, 248, 243, 0.98)', WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)' }}>
            {/* 顶部把手 */}
            <div className="w-10 h-1 bg-[#FFD4C4] rounded-full mx-auto mb-5" />

            {/* 标题 + 关闭 */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-[#333]">
                <MessageCircleHeart size={22} className="text-[#FF8C69]" />
                对TA说句话
              </h2>
            <button
              onClick={() => setShowThinkSheet(false)}
              className="w-11 h-11 rounded-full bg-white/80 border border-white/80 flex items-center justify-center text-[#999] active:scale-95 transition-transform"
              aria-label="关闭"
            >
              <X size={22} />
            </button>
            </div>

            <p className="text-sm text-[#999] mb-4">
              选一句发给 {getDisplayName(currentFamily) || '家人'}：
            </p>

            {/* 模板按钮 */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {THINK_OF_YOU_TEMPLATES.map((tpl) => (
                <button
                  key={tpl}
                  onClick={() => handleSendThinkOfYou(tpl, 'template')}
                  disabled={thinkSending}
                  className="min-h-12 bg-white/70 border border-white/80 text-[#333] rounded-2xl font-medium text-base active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {tpl}
                </button>
              ))}
            </div>

            {/* 自定义输入 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#333]">
                自定义一句话
              </label>
              <div className="flex gap-2 items-end">
                <textarea
                  value={thinkContent}
                  onChange={(e) => setThinkContent(e.target.value)}
                  placeholder="想说点什么..."
                  rows={2}
                  maxLength={100}
                  className="flex-1 px-4 py-3 rounded-2xl bg-white/70 border border-white/80 text-[#333] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FF8C69]/30 focus:border-[#FF8C69] transition-all placeholder:text-[#999]"
                />
                <button
                  onClick={() => handleSendThinkOfYou(thinkContent, 'text')}
                  disabled={!thinkContent.trim() || thinkSending}
                  className="w-12 h-12 rounded-full text-white flex items-center justify-center flex-shrink-0 shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
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
