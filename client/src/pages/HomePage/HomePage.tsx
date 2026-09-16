import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, getDisplayName } from '@client/src/hooks/useUser';
import { broadcastsApi } from '@client/src/api';
import { useSpeech } from '@client/src/hooks/useSpeech';
import { getGreeting } from '@client/src/utils/date';
import type { Broadcast, FamilyMember } from '@shared/api.interface';
import {
  Play,
  Pause,
  User,
  UserPlus,
  Heart,
  ChevronRight,
  Footprints,
  Moon,
  Mic,
  Settings,
  Share2,
  Activity,
  Clock,
  Loader2,
} from 'lucide-react';
import { Image } from '@client/src/components/ui/image';
import { ThinkOfYouSheet } from './ThinkOfYouSheet';
import { LatestBroadcastCard } from './LatestBroadcastCard';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, family, currentFamily, setCurrentFamily, loading: userLoading } = useUser();

  const [latestBroadcast, setLatestBroadcast] = useState<Broadcast | null>(null);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [showThinkSheet, setShowThinkSheet] = useState(false);
  const { isSpeaking, isPaused, stop } = useSpeech({ rate: 1.0 });

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
    <div className="px-5 pt-6 pb-32 space-y-5 max-w-[480px] mx-auto">
      {/* 顶部问候区 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#333]">
            {getGreeting()}，{user?.nickname || '朋友'}
          </h1>
          <p className="text-sm text-[#999] mt-1 leading-relaxed">
            {family.length > 0 ? '来看看家人今天怎么样' : '开启你的心系之旅'}
          </p>
        </div>
        <div
          className="relative w-12 h-12 rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
            padding: '2px',
          }}
        >
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
              className={`flex items-center gap-2.5 px-3.5 py-2 min-h-11 rounded-full whitespace-nowrap transition-all duration-300 flex-shrink-0 active:scale-[0.98] ${
                currentFamily?.id === f.id
                  ? 'text-white shadow-md'
                  : 'glass-card text-[#999]'
              }`}
              style={
                currentFamily?.id === f.id
                  ? { background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }
                  : {}
              }
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden relative ${
                  currentFamily?.id === f.id ? 'bg-white/20' : ''
                }`}
                style={
                  currentFamily?.id === f.id
                    ? {}
                    : {
                        background:
                          'linear-gradient(135deg, rgba(255,140,105,0.15) 0%, rgba(255,107,107,0.1) 100%)',
                      }
                }
              >
                {f.avatarUrl ? (
                  <Image
                    src={f.avatarUrl}
                    alt={f.nickname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User
                    size={14}
                    className={currentFamily?.id === f.id ? 'text-white' : 'text-[#FF8C69]'}
                  />
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
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,140,105,0.15) 0%, rgba(255,107,107,0.1) 100%)',
            }}
          >
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
              className="flex-1 h-[52px] rounded-2xl text-white font-semibold text-base active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-md"
              style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
            >
              <UserPlus size={18} />
              生成邀请码
            </button>
            <button
              onClick={() => navigate('/family')}
              className="flex-1 h-[52px] rounded-2xl bg-white/80 backdrop-blur-xl -webkit-backdrop-blur-xl text-[#FF8C69] font-semibold text-base active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 border border-white/80"
            >
              输入邀请码
            </button>
          </div>
        </div>
      )}

      {/* 主内容区 */}
      {currentFamily && (
        <>
          {/* 播报卡片 loading 态 */}
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
              <LatestBroadcastCard
                broadcast={latestBroadcast}
                senderName={getDisplayName(currentFamily)}
              />

              {/* 数据概览卡片 */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-[#333] mb-4">今日数据</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/60 backdrop-blur-sm -webkit-backdrop-filter: blur(6px) rounded-2xl p-4 border border-white/70 flex items-center gap-3">
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
                  <div className="bg-white/60 backdrop-blur-sm -webkit-backdrop-filter: blur(6px) rounded-2xl p-4 border border-white/70 flex items-center gap-3">
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
                  <div className="bg-white/60 backdrop-blur-sm -webkit-backdrop-filter: blur(6px) rounded-2xl p-4 border border-white/70 flex items-center gap-3">
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
                  <div className="bg-white/60 backdrop-blur-sm -webkit-backdrop-filter: blur(6px) rounded-2xl p-4 border border-white/70 flex items-center gap-3">
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
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-[#333] mb-4">快捷操作</h3>
                <div className="flex justify-around">
                  <button
                    onClick={() => navigate('/recordings')}
                    className="flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
                  >
                    <div className="w-14 h-14 rounded-full glass-card flex items-center justify-center">
                      <Mic size={24} className="text-[#FF8C69]" />
                    </div>
                    <span className="text-xs text-[#333] font-medium">录关心话</span>
                  </button>
                  <button
                    onClick={() => navigate('/history')}
                    className="flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
                  >
                    <div className="w-14 h-14 rounded-full glass-card flex items-center justify-center">
                      <Activity size={24} className="text-[#FF8C69]" />
                    </div>
                    <span className="text-xs text-[#333] font-medium">家人动态</span>
                  </button>
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
                  >
                    <div className="w-14 h-14 rounded-full glass-card flex items-center justify-center">
                      <Settings size={24} className="text-[#FF8C69]" />
                    </div>
                    <span className="text-xs text-[#333] font-medium">设置</span>
                  </button>
                  <button
                    onClick={() => setShowThinkSheet(true)}
                    className="flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
                  >
                    <div className="w-14 h-14 rounded-full glass-card flex items-center justify-center">
                      <Share2 size={24} className="text-[#FF8C69]" />
                    </div>
                    <span className="text-xs text-[#333] font-medium">分享</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card p-6 text-center">
              <div
                className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,140,105,0.15) 0%, rgba(255,107,107,0.1) 100%)',
                }}
              >
                <Clock size={36} className="text-[#FF8C69]" />
              </div>
              <h3 className="text-lg font-semibold text-[#333] mb-2">今天的播报还没到</h3>
              <p className="text-sm text-[#999] leading-relaxed mb-6">
                {getDisplayName(currentFamily)}每天会定时生成播报，
                <br />
                耐心等待一下吧~
              </p>
              <button
                onClick={loadLatestBroadcast}
                className="px-6 h-[52px] rounded-2xl text-[#FF8C69] font-medium text-base active:scale-[0.98] transition-all flex items-center justify-center inline-flex bg-white/70 border border-white/80"
              >
                刷新看看
              </button>
            </div>
          )}

          {/* 想TA了按钮 */}
          <button
            onClick={() => setShowThinkSheet(true)}
            className="w-full h-[52px] rounded-2xl text-white font-semibold text-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md"
            style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
          >
            <Heart size={24} fill="white" />
            想TA了
          </button>

          {/* 最近播报列表 */}
          <div className="glass-card p-6">
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
              <div className="h-16 rounded-2xl bg-white/60 backdrop-blur-sm -webkit-backdrop-filter: blur(6px) border border-white/70 flex items-center px-4">
                <div className="flex-shrink-0 mr-4 text-center">
                  <p className="text-[#333] text-sm font-medium">
                    {new Date(latestBroadcast.broadcastDate).getDate()}日
                  </p>
                  <p className="text-[#999] text-xs">
                    {
                      ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][
                        new Date(latestBroadcast.broadcastDate).getDay()
                      ]
                    }
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#333] text-sm truncate">
                    {latestBroadcast.summary || latestBroadcast.content}
                  </p>
                </div>
                <button
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ml-3 active:scale-95 transition-transform"
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
              <div className="h-16 rounded-2xl bg-white/60 backdrop-blur-sm -webkit-backdrop-filter: blur(6px) border border-white/70 flex items-center justify-center px-4">
                <p className="text-[#999] text-sm">暂无播报记录</p>
              </div>
            )}
            <div className="pt-4 mt-4 flex items-center gap-3 border-t border-white/30">
              <div
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  latestBroadcast ? 'bg-[#6BCB77]' : 'bg-[#999]/40'
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#333] font-medium">
                  {getDisplayName(currentFamily)}
                  {latestBroadcast ? '今天已生成播报' : '今天还没有播报'}
                </p>
                <p className="text-xs text-[#999] mt-0.5 leading-relaxed">
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
      <ThinkOfYouSheet
        open={showThinkSheet}
        onClose={() => setShowThinkSheet(false)}
        targetUserId={currentFamily?.userId || ''}
        targetName={currentFamily ? getDisplayName(currentFamily) : ''}
      />
    </div>
  );
}
