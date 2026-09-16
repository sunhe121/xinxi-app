import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  Calendar,
  HeartPulse,
  Mic,
  Users,
  Bell,
  Shield,
  FileText,
  Mail,
  Star,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

const features = [
  {
    icon: Calendar,
    icon2: HeartPulse,
    title: '每日关心报告',
    desc: 'AI自动总结每日生活状态，生成温暖的语音播报',
  },
  {
    icon: Mic,
    icon2: null,
    title: '声音克隆',
    desc: '录制你的声音，让播报更有温度',
  },
  {
    icon: Users,
    icon2: Heart,
    title: '家人配对',
    desc: '邀请家人加入，互相关心彼此的生活',
  },
  {
    icon: Calendar,
    icon2: Bell,
    title: '节日提醒',
    desc: '重要节日提前提醒，不错过每一个祝福',
  },
];

const settingsItems = [
  {
    icon: Shield,
    label: '隐私政策',
    onClick: () => toast.info('即将上线'),
  },
  {
    icon: FileText,
    label: '用户协议',
    onClick: () => toast.info('即将上线'),
  },
  {
    icon: Mail,
    label: '联系我们',
    right: 'contact@xin.ai',
    onClick: () => {},
  },
  {
    icon: Star,
    label: '给个好评',
    onClick: () => toast.success('感谢支持 ❤️'),
  },
  {
    icon: RefreshCw,
    label: '检查更新',
    onClick: () => toast.success('已是最新版本'),
  },
];

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="px-5 pt-6 pb-32 max-w-[480px] mx-auto animate-fade-in-up">
      {/* 顶部导航 */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="返回"
        >
          <ArrowLeft size={20} className="text-[#333]" />
        </button>
        <h1 className="text-lg font-semibold text-[#333]">关于心系</h1>
      </div>

      <div className="space-y-5">
        {/* 应用信息 */}
        <div className="glass-card p-8 text-center">
          <div
            className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-[#FF6B6B]/30"
            style={{
              background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
            }}
          >
            <Heart size={40} className="text-white fill-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#333] mb-1">心系</h2>
          <p className="text-sm text-[#999] mb-2">版本 v1.0.0</p>
          <p className="text-base text-[#FF8C69] font-medium">
            让陪伴不缺席
          </p>
        </div>

        {/* 功能介绍 */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-[#333] mb-4">
            功能介绍
          </h3>
          <div className="flex flex-col gap-4">
            {features.map((f) => {
              const Icon = f.icon;
              const Icon2 = f.icon2;
              return (
                <div
                  key={f.title}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-white/40"
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background:
                          'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                      }}
                    >
                      <Icon size={20} className="text-white" />
                    </div>
                    {Icon2 && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <Icon2 size={12} className="text-[#FF6B6B]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h4 className="text-base font-medium text-[#333] mb-1">
                      {f.title}
                    </h4>
                    <p className="text-sm text-[#999] leading-[1.6]">
                      {f.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 设置入口 */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-[#333] mb-4">更多</h3>
          <div className="flex flex-col gap-3">
            {settingsItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="w-full h-14 rounded-2xl bg-white/60 backdrop-blur-sm px-4 flex items-center gap-3 active:scale-[0.98] transition-all text-left"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                    }}
                  >
                    <Icon size={18} className="text-white" />
                  </div>
                  <span className="flex-1 text-base text-[#333]">
                    {item.label}
                  </span>
                  {item.right && (
                    <span className="text-sm text-[#999]">{item.right}</span>
                  )}
                  <ChevronRight size={18} className="text-[#999]" />
                </button>
              );
            })}
          </div>
        </div>

        {/* 底部版权 */}
        <div className="text-center pt-2 pb-4">
          <p className="text-xs text-[#999]">
            © 2025 心系 · 用心陪伴每一天
          </p>
        </div>
      </div>
    </div>
  );
}
