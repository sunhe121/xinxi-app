import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Users,
  Bell,
  HeartHandshake,
  Shield,
  Info,
  ChevronRight,
  Heart,
  Calendar,
  MessageSquare,
  Share2,
  X,
  Check,
  Pencil,
  LogOut,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@client/src/hooks/useUser';
import { authApi } from '@client/src/api';
import { TONE_STYLE_LABELS } from '@shared/api.interface';
import type { ToneStyle } from '@shared/api.interface';
import { cn } from '@client/src/utils/cn';
import { Image } from '@client/src/components/ui/image';

const PUSH_TIME_OPTIONS = [
  { value: '08:00', label: '早上8点' },
  { value: '12:00', label: '中午12点' },
  { value: '20:00', label: '晚上8点' },
];

const TONE_STYLES: Array<{ value: ToneStyle; desc: string }> = [
  { value: 'warm_chatter', desc: '像爸妈一样唠叨，句句都是关心' },
  { value: 'warm_concise', desc: '简洁实在，关心都在行动里' },
  { value: 'humorous', desc: '幽默风趣，让TA笑着听完播报' },
  { value: 'gentle', desc: '温柔细腻，像春风拂面' },
];

interface FestivalItem {
  id: string;
  name: string;
  date: string;
  type: 'birthday' | 'festival' | 'anniversary';
}

const INITIAL_FESTIVALS: FestivalItem[] = [
  { id: '1', name: '妈妈生日', date: '03-15', type: 'birthday' },
  { id: '2', name: '春节', date: '01-01', type: 'festival' },
];

const ROLE_LABELS: Record<string, string> = {
  child: '子女',
  elder: '老人',
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, family, loading, refresh } = useUser();
  const [profileError, setProfileError] = useState(false);

  // 弹层状态
  const [showPushSheet, setShowPushSheet] = useState(false);
  const [showFestivalSheet, setShowFestivalSheet] = useState(false);
  const [showToneSheet, setShowToneSheet] = useState(false);
  const [showAboutSheet, setShowAboutSheet] = useState(false);

  // 推送设置
  const [selectedPushTimes, setSelectedPushTimes] = useState<string[]>(
    user?.pushTime ? user.pushTime.split(',') : ['08:00', '20:00']
  );

  // 语言风格
  const [selectedTone, setSelectedTone] = useState<ToneStyle>(
    user?.toneStyle || 'warm_chatter'
  );

  // 节日提醒
  const [festivals, setFestivals] = useState<FestivalItem[]>(INITIAL_FESTIVALS);

  const togglePushTime = (time: string) => {
    setSelectedPushTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const handleSavePushTime = () => {
    if (selectedPushTimes.length === 0) {
      toast.error('请至少选择一个推送时间');
      return;
    }
    toast.success('推送设置已保存');
    setShowPushSheet(false);
  };

  const handleSaveTone = () => {
    toast.success('语言风格已更新');
    setShowToneSheet(false);
  };

  const handleAddFestival = () => {
    toast.info('添加功能即将上线');
  };

  const handleRetryProfile = () => {
    setProfileError(false);
    refresh();
  };

  const handleLogout = () => {
    authApi.logout();
    navigate('/login');
  };

  const menuItems = [
    {
      icon: HeartHandshake,
      label: '我的关心话',
      right: <ChevronRight size={18} className="text-[#999]" />,
      onClick: () => navigate('/voice'),
    },
    {
      icon: Users,
      label: '家人管理',
      right: (
        <>
          <span className="text-sm text-[#999] mr-1">
            {family.length > 0 ? `${family.length}位家人` : '去添加'}
          </span>
          <ChevronRight size={18} className="text-[#999]" />
        </>
      ),
      onClick: () => navigate('/family'),
    },
    {
      icon: Share2,
      label: '分享给家人',
      right: <ChevronRight size={18} className="text-[#999]" />,
      onClick: () => navigate('/share'),
    },
    {
      icon: Shield,
      label: '隐私设置',
      right: <ChevronRight size={18} className="text-[#999]" />,
      onClick: () => navigate('/privacy'),
    },
    {
      icon: Calendar,
      label: '节日提醒',
      right: (
        <>
          <span className="text-sm text-[#999] mr-1">
            {festivals.length}项
          </span>
          <ChevronRight size={18} className="text-[#999]" />
        </>
      ),
      onClick: () => setShowFestivalSheet(true),
    },
    {
      icon: Sparkles,
      label: '我的语言风格',
      right: (
        <span className="text-sm text-[#999]">
          {user?.languageProfile ? '已学习' : '去学习'}
        </span>
      ),
      onClick: () => navigate('/language-style'),
    },
    {
      icon: MessageSquare,
      label: '语气风格',
      right: (
        <span className="text-sm text-[#999]">
          {TONE_STYLE_LABELS[selectedTone]}
        </span>
      ),
      onClick: () => setShowToneSheet(true),
    },
  ];

  const personalMenuItems = menuItems.slice(0, 5);
  const notificationMenuItems = [
    {
      icon: Bell,
      label: '推送设置',
      right: (
        <span className="text-sm text-[#999]">
          {selectedPushTimes.length > 0
            ? selectedPushTimes
                .map((t) => PUSH_TIME_OPTIONS.find((o) => o.value === t)?.label)
                .join('、')
            : '未设置'}
        </span>
      ),
      onClick: () => setShowPushSheet(true),
    },
  ];
  const aboutMenuItems = [
    {
      icon: Info,
      label: '关于心系',
      right: <ChevronRight size={18} className="text-[#999]" />,
      onClick: () => setShowAboutSheet(true),
    },
  ];

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="text-sm text-[#999] font-medium px-2 mb-3 mt-2">
      {children}
    </div>
  );

  const IconCircle = ({ icon: Icon }: { icon: React.ComponentType<{ size?: number; className?: string }> }) => (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
      }}
    >
      <Icon size={20} className="text-white" />
    </div>
  );

  const stats = [
    { value: '128', label: '已陪伴天数' },
    { value: '256', label: '播报条数' },
    { value: '42', label: '录音条数' },
  ];

  return (
    <>
      <div className="min-h-screen">
        <div className="max-w-[480px] mx-auto px-5 pt-6 pb-[120px] flex flex-col gap-5">
          {/* 页面标题 */}
          <h1 className="text-xl font-bold text-[#333]">个人中心</h1>

          {/* 用户信息卡片 */}
          <div className="glass-card p-6">
            <div className="flex items-start gap-4">
              {/* 头像 */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-20 h-20 rounded-full overflow-hidden"
                  style={{
                    padding: '3px',
                    background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                    boxShadow: '0 4px 16px rgba(255, 107, 107, 0.3)',
                  }}
                >
                  <div className="w-full h-full rounded-full bg-white overflow-hidden">
                    {loading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-[#FF8C69]/30 border-t-[#FF8C69] rounded-full animate-spin" />
                      </div>
                    ) : user?.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={user.nickname}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#FFF0E6]">
                        <User size={32} className="text-[#FF8C69]" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 用户信息 */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-[#333] truncate">
                    {loading ? '加载中...' : user?.nickname || (profileError ? '加载失败' : '加载中...')}
                  </h2>
                  {!loading && !user && (
                    <button
                      onClick={handleRetryProfile}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[#999] hover:text-[#FF8C69] transition-colors"
                      aria-label="重新加载"
                    >
                      <RefreshCw size={16} />
                    </button>
                  )}
                  {user?.role && (
                    <span
                      className="text-xs text-white px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                      }}
                    >
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#999] mt-2 truncate">
                  {user?.bio || `邀请码：${user?.inviteCode || '------'}`}
                </p>
              </div>

              {/* 编辑按钮 */}
              <button
                onClick={() => navigate('/profile-edit')}
                className="w-10 h-10 rounded-full bg-white/70 backdrop-blur border border-white/80 flex items-center justify-center flex-shrink-0 active:scale-95 transition-all shadow-sm"
                aria-label="编辑资料"
              >
                <Pencil size={18} className="text-[#FF8C69]" />
              </button>
            </div>
          </div>

          {/* 数据统计卡片 */}
          <div className="glass-card p-5">
            <div className="flex items-center">
              {stats.map((stat, index) => (
                <div key={stat.label} className="flex-1 text-center">
                  <div className="text-2xl font-bold text-[#FF8C69]">
                    {stat.value}
                  </div>
                  <div className="text-xs text-[#999] mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 个人设置 */}
          <div>
            <SectionTitle>个人设置</SectionTitle>
            <div className="glass-card overflow-hidden">
              {personalMenuItems.map((item, index) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={cn(
                    'w-full flex items-center gap-3 px-5 text-left transition-all active:bg-white/40 h-14',
                    index < personalMenuItems.length - 1
                      ? 'border-b border-white/30'
                      : '',
                  )}
                >
                  <IconCircle icon={item.icon} />
                  <span className="flex-1 text-base text-[#333]">
                    {item.label}
                  </span>
                  <div className="flex items-center text-[#999]">{item.right}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 通知设置 */}
          <div>
            <SectionTitle>通知设置</SectionTitle>
            <div className="glass-card overflow-hidden">
              {notificationMenuItems.map((item, index) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={cn(
                    'w-full flex items-center gap-3 px-5 text-left transition-all active:bg-white/40 h-14',
                    index < notificationMenuItems.length - 1
                      ? 'border-b border-white/30'
                      : '',
                  )}
                >
                  <IconCircle icon={item.icon} />
                  <span className="flex-1 text-base text-[#333]">
                    {item.label}
                  </span>
                  <div className="flex items-center text-[#999]">{item.right}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 关于 */}
          <div>
            <SectionTitle>关于</SectionTitle>
            <div className="glass-card overflow-hidden">
              {aboutMenuItems.map((item, index) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={cn(
                    'w-full flex items-center gap-3 px-5 text-left transition-all active:bg-white/40 h-14',
                    index < aboutMenuItems.length - 1
                      ? 'border-b border-white/30'
                      : '',
                  )}
                >
                  <IconCircle icon={item.icon} />
                  <span className="flex-1 text-base text-[#333]">
                    {item.label}
                  </span>
                  <div className="flex items-center text-[#999]">{item.right}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 退出登录 */}
          <button
            onClick={handleLogout}
            className="glass-card w-full p-4 text-base text-[#FF6B6B] font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <LogOut size={18} />
            退出登录
          </button>

          {/* 底部版本信息 */}
          <div className="text-center pt-1">
            <p className="text-xs text-[#999]">
              心系 v1.0 · 让陪伴不缺席
            </p>
          </div>

        </div>

        {/* 推送设置弹层 */}
        {showPushSheet && (
          <BottomSheet title="推送设置" onClose={() => setShowPushSheet(false)}>
            <p className="text-sm text-[#999] mb-4">
              选择你想收到播报的时间（可多选）
            </p>
            <div className="space-y-2 mb-6">
              {PUSH_TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => togglePushTime(opt.value)}
                  className={cn(
                    'w-full flex items-center justify-between p-4 rounded-xl transition-all active:scale-[0.98]',
                    selectedPushTimes.includes(opt.value)
                      ? 'bg-[#FF8C69]/10 border-2 border-[#FF8C69]'
                      : 'bg-white/60 border-2 border-transparent'
                  )}
                >
                  <span className="font-medium text-[#333]">{opt.label}</span>
                  {selectedPushTimes.includes(opt.value) && (
                    <Check size={20} className="text-[#FF8C69]" />
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={handleSavePushTime}
              className="w-full py-4 btn-gradient"
            >
              保存设置
            </button>
          </BottomSheet>
        )}

        {/* 节日提醒弹层 */}
        {showFestivalSheet && (
          <BottomSheet title="节日提醒" onClose={() => setShowFestivalSheet(false)}>
            <p className="text-sm text-[#999] mb-4">
              重要日子提前提醒你，让关心不缺席
            </p>
            <div className="space-y-2 mb-4 max-h-[280px] overflow-y-auto">
              {festivals.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 p-3 bg-white/60 rounded-xl"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                    }}
                  >
                    <Calendar size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#333] text-sm truncate">{f.name}</p>
                    <p className="text-xs text-[#999] mt-0.5">{f.date}</p>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full text-white flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                    }}
                  >
                    {f.type === 'birthday' ? '生日' : f.type === 'festival' ? '节日' : '纪念日'}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={handleAddFestival}
              className="w-full py-4 border-2 border-dashed border-white/60 text-[#999] rounded-2xl font-medium text-base active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              + 添加提醒
            </button>
          </BottomSheet>
        )}

        {/* 语言风格弹层 */}
        {showToneSheet && (
          <BottomSheet title="语言风格" onClose={() => setShowToneSheet(false)}>
            <p className="text-sm text-[#999] mb-4">
              选择播报的语言风格，让TA感受到不一样的你
            </p>
            <div className="space-y-2 mb-6">
              {TONE_STYLES.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setSelectedTone(style.value)}
                  className={cn(
                    'w-full text-left p-4 rounded-xl transition-all active:scale-[0.98]',
                    selectedTone === style.value
                      ? 'bg-[#FF8C69]/10 border-2 border-[#FF8C69]'
                      : 'bg-white/60 border-2 border-transparent'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-[#333]">
                      {TONE_STYLE_LABELS[style.value]}
                    </span>
                    {selectedTone === style.value && (
                      <Check size={18} className="text-[#FF8C69]" />
                    )}
                  </div>
                  <p className="text-xs text-[#999]">{style.desc}</p>
                </button>
              ))}
            </div>
            <button
              onClick={handleSaveTone}
              className="w-full py-4 btn-gradient"
            >
              保存设置
            </button>
          </BottomSheet>
        )}

        {/* 关于心系弹层 */}
        {showAboutSheet && (
          <BottomSheet title="关于心系" onClose={() => setShowAboutSheet(false)}>
            <div className="text-center py-6">
              <div
                className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                  boxShadow: '0 8px 24px rgba(255, 107, 107, 0.3)',
                }}
              >
                <Heart size={36} className="text-white" fill="white" />
              </div>
              <h3 className="text-xl font-bold text-[#333] mb-1">心系</h3>
              <p className="text-sm text-[#999] mb-6">v1.0.0 · 让陪伴不缺席</p>
            </div>
            <div className="bg-white/60 rounded-2xl p-4 space-y-3">
              <p className="text-sm text-[#333] font-medium">产品理念</p>
              <p className="text-sm text-[#999] leading-relaxed">
                心系是一款AI亲情关怀应用，帮助异地子女和老人通过AI自动总结每日生活状态，
                生成温暖的语音播报，定时推送给对方，让陪伴不缺席。
              </p>
            </div>
          </BottomSheet>
        )}
      </div>
    </>
  );
}

function BottomSheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 animate-fadeIn"
        onClick={onClose}
      />
      <div
        className="absolute bottom-0 left-0 right-0 max-w-[480px] mx-auto animate-slideUp"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="w-10 h-1 bg-[#FF8C69]/20 rounded-full mx-auto mt-3" />
        <div className="p-6 pb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-[#333]">{title}</h2>
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-full bg-white/70 border border-white/80 flex items-center justify-center text-[#999] active:scale-95 transition-transform shadow-sm"
              aria-label="关闭"
            >
              <X size={20} />
            </button>
          </div>
          {children}
        </div>
      </div>
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
