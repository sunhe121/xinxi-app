import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Users,
  Bell,
  HeartHandshake,
  Shield,
  ChevronRight,
  Calendar,
  MessageSquare,
  Share2,
  Pencil,
  LogOut,
  Sparkles,
  RefreshCw,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@client/src/hooks/useUser';
import { authApi } from '@client/src/api';
import { TONE_STYLE_LABELS } from '@shared/api.interface';
import type { ToneStyle } from '@shared/api.interface';
import { cn } from '@client/src/utils/cn';
import { Image } from '@client/src/components/ui/image';
import BottomSheet, { ToneSheetContent } from './ProfileBottomSheet';

const ROLE_LABELS: Record<string, string> = {
  child: '子女',
  elder: '老人',
};

const stats = [
  { value: '128', label: '已陪伴天数' },
  { value: '256', label: '播报条数' },
  { value: '42', label: '录音条数' },
];

interface MenuItem {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  right: React.ReactNode;
  onClick: () => void;
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="text-sm text-[#999] font-medium px-2 mb-3 mt-2">
    {children}
  </div>
);

const MenuRow = ({ item }: { item: MenuItem }) => {
  const Icon = item.icon;
  return (
    <button
      onClick={item.onClick}
      className="w-full flex items-center gap-3 px-4 text-left h-16 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/80 active:scale-[0.98] transition-all"
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
        }}
      >
        <Icon size={18} className="text-white" />
      </div>
      <span className="flex-1 text-base text-[#333]">{item.label}</span>
      <div className="flex items-center text-[#999]">{item.right}</div>
    </button>
  );
};

const MenuGroup = ({
  title,
  items,
}: {
  title: string;
  items: MenuItem[];
}) => (
  <div>
    <SectionTitle>{title}</SectionTitle>
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <MenuRow key={item.label} item={item} />
      ))}
    </div>
  </div>
);

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, family, loading, refresh } = useUser();
  const [profileError, setProfileError] = useState(false);

  // 弹层状态
  const [showToneSheet, setShowToneSheet] = useState(false);

  // 语言风格
  const [selectedTone, setSelectedTone] = useState<ToneStyle>(
    user?.toneStyle || 'warm_chatter'
  );

  const handleSaveTone = () => {
    toast.success('语言风格已更新');
    setShowToneSheet(false);
  };

  const handleRetryProfile = () => {
    setProfileError(false);
    refresh();
  };

  const handleLogout = () => {
    authApi.logout();
    navigate('/login');
  };

  const personalMenuItems: MenuItem[] = [
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
      right: <ChevronRight size={18} className="text-[#999]" />,
      onClick: () => navigate('/festival-reminder'),
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

  const notificationMenuItems: MenuItem[] = [
    {
      icon: Bell,
      label: '推送设置',
      right: <ChevronRight size={18} className="text-[#999]" />,
      onClick: () => navigate('/push-settings'),
    },
  ];

  const aboutMenuItems: MenuItem[] = [
    {
      icon: Info,
      label: '关于心系',
      right: <ChevronRight size={18} className="text-[#999]" />,
      onClick: () => navigate('/about'),
    },
  ];

  return (
    <div className="w-full px-5 pt-6 pb-32 flex flex-col gap-5 bg-transparent">
      {/* 页面标题 */}
      <h1 className="text-2xl font-bold text-[#333]">个人中心</h1>

      {/* 用户信息卡片 */}
      <div className="glass-card p-6">
        <div className="flex items-start gap-4">
          {/* 头像 */}
          <div className="relative flex-shrink-0">
            <div
              className="w-16 h-16 rounded-full overflow-hidden"
              style={{
                padding: '3px',
                background:
                  'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
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
                    <User size={28} className="text-[#FF8C69]" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 用户信息 */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-[#333] truncate">
                {loading
                  ? '加载中...'
                  : user?.nickname ||
                    (profileError ? '加载失败' : '加载中...')}
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
                    background:
                      'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                  }}
                >
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              )}
            </div>
            <p className="text-sm text-[#999] mt-1.5 truncate">
              {user?.bio || `邀请码：${user?.inviteCode || '------'}`}
            </p>
          </div>

          {/* 编辑按钮 */}
          <button
            onClick={() => navigate('/profile-edit')}
            className="w-9 h-9 rounded-full bg-white/70 backdrop-blur-sm border border-white/80 flex items-center justify-center flex-shrink-0 active:scale-95 transition-all shadow-sm"
            aria-label="编辑资料"
          >
            <Pencil size={16} className="text-[#FF8C69]" />
          </button>
        </div>
      </div>

      {/* 数据统计卡片 */}
      <div className="glass-card p-5">
        <div className="flex items-center">
          {stats.map((stat) => (
            <div key={stat.label} className="flex-1 text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-xs text-[#999] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <MenuGroup title="个人设置" items={personalMenuItems} />
      <MenuGroup title="通知设置" items={notificationMenuItems} />
      <MenuGroup title="关于" items={aboutMenuItems} />

      {/* 退出登录 */}
      <button
        onClick={handleLogout}
        className={cn(
          'w-full h-[52px] rounded-2xl font-semibold text-base',
          'flex items-center justify-center gap-2',
          'bg-white/75 backdrop-blur-[20px] border border-white/80',
          'text-[#FF6B6B] shadow-sm',
          'active:scale-[0.98] transition-all'
        )}
      >
        <LogOut size={18} />
        退出登录
      </button>

      {/* 底部版本信息 */}
      <div className="text-center pt-1">
        <p className="text-xs text-[#999]">心系 v1.0 · 让陪伴不缺席</p>
      </div>

      {/* 语言风格弹层 */}
      {showToneSheet && (
        <BottomSheet title="语言风格" onClose={() => setShowToneSheet(false)}>
          <ToneSheetContent
            selectedTone={selectedTone}
            onSelect={setSelectedTone}
            onSave={handleSaveTone}
          />
        </BottomSheet>
      )}

    </div>
  );
}
