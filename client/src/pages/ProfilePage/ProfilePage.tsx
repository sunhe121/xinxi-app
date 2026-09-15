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
      right: <ChevronRight size={20} className="text-muted-foreground" />,
      onClick: () => navigate('/voice'),
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      icon: Users,
      label: '家人管理',
      right: (
        <>
          <span className="text-sm text-muted-foreground mr-1">
            {family.length > 0 ? `${family.length}位家人` : '去添加'}
          </span>
          <ChevronRight size={20} className="text-muted-foreground" />
        </>
      ),
      onClick: () => navigate('/family'),
      iconBg: 'bg-secondary',
      iconColor: 'text-primary',
    },
    {
      icon: Bell,
      label: '推送设置',
      right: (
        <span className="text-sm text-muted-foreground">
          {selectedPushTimes.length > 0
            ? selectedPushTimes
                .map((t) => PUSH_TIME_OPTIONS.find((o) => o.value === t)?.label)
                .join('、')
            : '未设置'}
        </span>
      ),
      onClick: () => setShowPushSheet(true),
      iconBg: 'bg-warning/20',
      iconColor: 'text-warning',
    },
    {
      icon: Share2,
      label: '分享给家人',
      right: <ChevronRight size={20} className="text-muted-foreground" />,
      onClick: () => navigate('/share'),
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      icon: Shield,
      label: '隐私设置',
      right: <ChevronRight size={20} className="text-muted-foreground" />,
      onClick: () => navigate('/privacy'),
      iconBg: 'bg-success/15',
      iconColor: 'text-success',
    },
    {
      icon: Calendar,
      label: '节日提醒',
      right: (
        <>
          <span className="text-sm text-muted-foreground mr-1">
            {festivals.length}项
          </span>
          <ChevronRight size={20} className="text-muted-foreground" />
        </>
      ),
      onClick: () => setShowFestivalSheet(true),
      iconBg: 'bg-accent/20',
      iconColor: 'text-accent',
    },
    {
      icon: Sparkles,
      label: '我的语言风格',
      right: (
        <span className="text-sm text-muted-foreground">
          {user?.languageProfile ? '已学习' : '去学习'}
        </span>
      ),
      onClick: () => navigate('/language-style'),
      iconBg: 'bg-gradient-to-br from-purple-100 to-pink-100',
      iconColor: 'text-purple-500',
    },
    {
      icon: MessageSquare,
      label: '语气风格',
      right: (
        <span className="text-sm text-muted-foreground">
          {TONE_STYLE_LABELS[selectedTone]}
        </span>
      ),
      onClick: () => setShowToneSheet(true),
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-500',
    },
    {
      icon: Info,
      label: '关于心系',
      right: <ChevronRight size={20} className="text-muted-foreground" />,
      onClick: () => setShowAboutSheet(true),
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-400',
    },
  ];

  return (
    <div className="px-5 pb-28 space-y-5 pt-6">
        {/* 顶部用户卡片 */}
       <button
         onClick={() => navigate('/profile-edit')}
         className="relative w-full text-left bg-gradient-to-br from-primary via-primary/90 to-secondary rounded-3xl p-6 text-white overflow-hidden shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
       >
         <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10" />
         <div className="absolute -right-10 bottom-0 w-24 h-24 rounded-full bg-white/5" />

         <div className="relative flex items-center gap-4">
           <div className="relative w-16 h-16 rounded-full bg-white/30 backdrop-blur flex items-center justify-center ring-4 ring-white/20 overflow-hidden flex-shrink-0">
             {loading ? (
               <div className="w-8 h-8 border-2 border-white/40 border-t-white rounded-full animate-spin" />
             ) : user?.avatarUrl ? (
               <Image
                 src={user.avatarUrl}
                 alt={user.nickname}
                 className="w-full h-full object-cover"
               />
             ) : (
               <User size={32} className="text-white" />
             )}
             <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white text-primary flex items-center justify-center shadow-md">
               <Pencil size={12} />
             </div>
           </div>
           <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2">
               <h2 className="text-xl font-bold truncate">
                 {loading ? '加载中...' : user?.nickname || (profileError ? '加载失败' : '加载中...')}
               </h2>
               {!loading && !user && (
                 <button
                   onClick={handleRetryProfile}
                   className="w-11 h-11 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors"
                   aria-label="重新加载"
                 >
                   <RefreshCw size={20} />
                 </button>
               )}
               <Pencil size={16} className="text-white/80 flex-shrink-0" />
             </div>
             <div className="flex items-center gap-2 mt-1.5">
               <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-sm font-medium">
                 {TONE_STYLE_LABELS[selectedTone]}
               </span>
             </div>
           </div>
         </div>

         {/* 个性签名 */}
         {user?.bio && (
           <p className="relative mt-4 text-sm text-white/85 leading-relaxed border-t border-white/15 pt-4">
             {user.bio}
           </p>
         )}
       </button>

      {/* 功能菜单列表 */}
      <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
        {menuItems.map((item, index) => (
          <button
            key={item.label}
            onClick={item.onClick}
              className={cn(
                'w-full flex items-center gap-4 p-4 text-left transition-all active:bg-muted/50 min-h-14',
                index < menuItems.length - 1
                  ? 'border-b border-border/60'
                  : '',
              )}
          >
            <div
              className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
                item.iconBg,
              )}
            >
              <item.icon size={22} className={item.iconColor} />
            </div>
            <span className="flex-1 font-medium text-foreground text-base">
              {item.label}
            </span>
            <div className="flex items-center">{item.right}</div>
          </button>
        ))}
      </div>

      {/* 产品理念 */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center">
            <Heart size={20} className="text-primary" fill="currentColor" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">关于心系</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          我们相信，距离不应该成为关心的阻碍。心系用AI把每天的生活变成温暖的语音，
          让不在身边的家人，也能感受到彼此的陪伴。
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          所有数据仅用于您和家人之间的连接，绝不会用于其他用途。
        </p>
      </div>

      {/* 退出登录 */}
      <button
        onClick={handleLogout}
        className="w-full min-h-12 px-4 bg-card rounded-2xl text-destructive font-medium text-base flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
      >
        <LogOut size={20} />
        退出登录
      </button>

      {/* 底部版本信息 */}
      <div className="text-center pt-4 pb-2">
        <p className="text-xs text-muted-foreground">
           心系 v1.0 · 让陪伴不缺席
        </p>
      </div>

      {/* 推送设置弹层 */}
      {showPushSheet && (
        <BottomSheet title="推送设置" onClose={() => setShowPushSheet(false)}>
          <p className="text-sm text-muted-foreground mb-4">
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
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'bg-secondary border-2 border-transparent'
                )}
              >
                <span className="font-medium text-foreground">{opt.label}</span>
                {selectedPushTimes.includes(opt.value) && (
                  <Check size={20} className="text-primary" />
                )}
              </button>
            ))}
          </div>
          <button
            onClick={handleSavePushTime}
            className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-semibold text-base shadow-lg shadow-primary/25 active:scale-[0.98] transition-all"
          >
            保存设置
          </button>
        </BottomSheet>
      )}

      {/* 节日提醒弹层 */}
      {showFestivalSheet && (
        <BottomSheet title="节日提醒" onClose={() => setShowFestivalSheet(false)}>
          <p className="text-sm text-muted-foreground mb-4">
            重要日子提前提醒你，让关心不缺席
          </p>
          <div className="space-y-2 mb-4 max-h-[280px] overflow-y-auto">
            {festivals.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 p-3 bg-secondary rounded-xl"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Calendar size={18} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.date}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">
                  {f.type === 'birthday' ? '生日' : f.type === 'festival' ? '节日' : '纪念日'}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={handleAddFestival}
            className="w-full py-4 border-2 border-dashed border-border text-muted-foreground rounded-2xl font-medium text-base active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            + 添加提醒
          </button>
        </BottomSheet>
      )}

      {/* 语言风格弹层 */}
      {showToneSheet && (
        <BottomSheet title="语言风格" onClose={() => setShowToneSheet(false)}>
          <p className="text-sm text-muted-foreground mb-4">
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
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'bg-secondary border-2 border-transparent'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground">
                    {TONE_STYLE_LABELS[style.value]}
                  </span>
                  {selectedTone === style.value && (
                    <Check size={18} className="text-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{style.desc}</p>
              </button>
            ))}
          </div>
          <button
            onClick={handleSaveTone}
            className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-semibold text-base shadow-lg shadow-primary/25 active:scale-[0.98] transition-all"
          >
            保存设置
          </button>
        </BottomSheet>
      )}

      {/* 关于心系弹层 */}
      {showAboutSheet && (
        <BottomSheet title="关于心系" onClose={() => setShowAboutSheet(false)}>
          <div className="text-center py-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
              <Heart size={36} className="text-white" fill="white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-1">心系</h3>
            <p className="text-sm text-muted-foreground mb-6">v1.0.0 · 让陪伴不缺席</p>
          </div>
          <div className="bg-secondary/50 rounded-2xl p-4 space-y-3">
            <p className="text-sm text-foreground font-medium">产品理念</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              心系是一款AI亲情关怀应用，帮助异地子女和老人通过AI自动总结每日生活状态，
              生成温暖的语音播报，定时推送给对方，让陪伴不缺席。
            </p>
          </div>
        </BottomSheet>
      )}
    </div>
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
      <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl max-w-[480px] mx-auto animate-slideUp">
        <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3" />
        <div className="p-6 pb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-muted-foreground active:scale-95 transition-transform"
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
