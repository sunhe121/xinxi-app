import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Footprints,
  Moon,
  MapPin,
  Mic,
  Phone,
  Heart,
  Shield,
  Loader2,
  Download,
  Trash2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  HardDrive,
  LogOut,
  FileText,
  ScrollText,
} from 'lucide-react';
import { toast } from 'sonner';
import { privacyApi, authApi } from '@client/src/api';
import type { PrivacySettings } from '@shared/api.interface';
import { cn } from '@client/src/utils/cn';
import { useUser } from '@client/src/hooks/useUser';

interface PrivacyItem {
  key: keyof PrivacySettings;
  icon: typeof Footprints;
  label: string;
  desc: string;
  iconBg: string;
  iconColor: string;
  sensitive?: boolean;
  usage: string;
}

const PRIVACY_ITEMS: PrivacyItem[] = [
  {
    key: 'stepsEnabled',
    icon: Footprints,
    label: '步数',
    desc: '手机传感器自动采集，用于了解当天活动量',
    iconBg: 'bg-[#FF8C69]/15',
    iconColor: 'text-[#FF8C69]',
    usage: '步数数据用于在每日播报中体现TA当天的活动状态，让你了解TA是否出门走动，有没有好好锻炼。',
  },
  {
    key: 'sleepEnabled',
    icon: Moon,
    label: '睡眠',
    desc: '手机传感器监测睡眠时长，用于关心休息质量',
    iconBg: 'bg-[#FF8C69]/15',
    iconColor: 'text-[#FF8C69]',
    usage: '睡眠数据用于在每日播报中反馈TA的睡眠情况，提醒TA注意休息，养成规律作息。',
  },
  {
    key: 'locationEnabled',
    icon: MapPin,
    label: '位置',
    desc: '手机GPS定位，用于判断是否出门、是否安全到家',
    iconBg: 'bg-[#FF8C69]/15',
    iconColor: 'text-[#FF8C69]',
    sensitive: true,
    usage: '位置数据仅用于判断TA的活动地点类型（家/公园/超市/医院等），不会记录精确位置轨迹，更不会分享给第三方。',
  },
  {
    key: 'ambientSoundEnabled',
    icon: Mic,
    label: '环境音',
    desc: '仅在本地提取声音特征，不保存录音内容',
    iconBg: 'bg-[#FF8C69]/15',
    iconColor: 'text-[#FF8C69]',
    usage: '环境声音仅在本地提取简单特征（如是否有人声、笑声），用于判断TA的社交状态，绝不会上传或保存任何录音文件。',
  },
  {
    key: 'callDurationEnabled',
    icon: Phone,
    label: '通话时长',
    desc: '手机系统权限，用于了解社交活跃度',
    iconBg: 'bg-[#FF8C69]/15',
    iconColor: 'text-[#FF8C69]',
    usage: '通话时长数据仅用于了解TA的社交活跃度，不会记录通话内容、联系人信息等敏感信息。',
  },
  {
    key: 'heartRateEnabled',
    icon: Heart,
    label: '心率',
    desc: '需要连接智能手表/手环，通过蓝牙同步健康数据',
    iconBg: 'bg-[#FF8C69]/15',
    iconColor: 'text-[#FF8C69]',
    usage: '心率血氧数据用于健康状态评估，需连接智能穿戴设备，关闭后不会采集任何健康相关数据。',
  },
];

const PRESERVED_LOCAL_STORAGE_KEYS = ['xinxi_token'];

export default function PrivacyPage() {
  const navigate = useNavigate();
  const { logout } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showUsageDetail, setShowUsageDetail] = useState(false);
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [settings, setSettings] = useState<PrivacySettings>({
    stepsEnabled: false,
    sleepEnabled: false,
    locationEnabled: false,
    ambientSoundEnabled: false,
    callDurationEnabled: false,
    heartRateEnabled: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await privacyApi.getSettings();
      setSettings(data);
    } catch {
      toast.error('加载隐私设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof PrivacySettings) => {
    const newValue = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: newValue }));
    setSaving(true);
    try {
      await privacyApi.updateSettings({ [key]: newValue });
      toast.success(newValue ? '已开启' : '已关闭');
    } catch {
      setSettings((prev) => ({ ...prev, [key]: !newValue }));
      toast.error('更新失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadData = () => {
    toast.info('正在生成数据文件...');
    setTimeout(() => {
      toast.success('数据文件已生成，即将开始下载');
    }, 1500);
  };

  const handleDeleteAllData = async () => {
    setDeleting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('数据已删除');
      setShowDeleteConfirm(false);
    } catch {
      toast.error('操作失败，请重试');
    } finally {
      setDeleting(false);
    }
  };

  const handleClearCache = () => {
    try {
      const preserved = new Map<string, string>();
      for (const key of PRESERVED_LOCAL_STORAGE_KEYS) {
        const val = localStorage.getItem(key);
        if (val !== null) preserved.set(key, val);
      }
      localStorage.clear();
      for (const [key, val] of preserved.entries()) {
        localStorage.setItem(key, val);
      }
      toast.success('缓存已清除');
    } catch {
      toast.error('清除失败，请重试');
    }
    setShowClearCacheConfirm(false);
  };

  const handleLogout = () => {
    authApi.logout();
    logout();
    setShowLogoutConfirm(false);
    navigate('/login', { replace: true });
  };

  const handlePolicyClick = (name: string) => {
    toast.info(`${name}即将上线`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-[#FF8C69] animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-32 max-w-[480px] mx-auto animate-fade-in-up">
      {/* 顶部导航 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="返回"
        >
          <ArrowLeft size={20} className="text-[#333]" />
        </button>
        <h1 className="text-lg font-semibold text-[#333]">隐私设置</h1>
      </div>

      {/* 说明文字 */}
      <p className="text-sm text-[#999] mb-5 leading-[1.7]">
        隐私设置帮助你管理哪些数据可以被采集用于生成每日播报。
        所有数据仅在你和绑定的家人之间共享，我们绝不会将数据用于其他用途。
      </p>

      <div className="space-y-5">
        {/* 设置项卡片 */}
        <div className="glass-card overflow-hidden">
          {PRIVACY_ITEMS.map((item, index) => (
            <div
              key={item.key}
              className={cn(
                'h-16 px-5 flex items-center justify-between',
                index < PRIVACY_ITEMS.length - 1
                  ? 'border-b border-white/30'
                  : ''
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      item.iconBg
                    )}
                  >
                    <item.icon size={20} className={item.iconColor} />
                  </div>
                  {item.sensitive && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#FF6B6B] border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base text-[#333]">{item.label}</p>
                  <p className="text-xs text-[#999] leading-relaxed truncate">
                    {item.desc}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggle(item.key)}
                disabled={saving}
                className={cn(
                  'w-12 h-7 rounded-full transition-all duration-300 relative flex-shrink-0 ml-3 active:scale-95',
                  settings[item.key]
                    ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] shadow-md shadow-[#FF6B6B]/30'
                    : 'bg-[#E8E8E8]'
                )}
                aria-label={settings[item.key] ? '关闭' : '开启'}
              >
                <span
                  className={cn(
                    'absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-300',
                    settings[item.key]
                      ? 'translate-x-5'
                      : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>
          ))}
        </div>

        {/* 数据授权说明（折叠） */}
        <div className="glass-card overflow-hidden">
          <button
            onClick={() => setShowUsageDetail(!showUsageDetail)}
            className="w-full h-16 px-5 flex items-center justify-between active:bg-white/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#98D8C8]/20 flex items-center justify-center">
                <Shield size={20} className="text-[#98D8C8]" />
              </div>
              <span className="text-base text-[#333]">数据授权说明</span>
            </div>
            {showUsageDetail ? (
              <ChevronUp size={20} className="text-[#999]" />
            ) : (
              <ChevronDown size={20} className="text-[#999]" />
            )}
          </button>
          {showUsageDetail && (
            <div className="px-5 pb-5 space-y-3 border-t border-white/30 pt-4">
              {PRIVACY_ITEMS.map((item) => (
                <div key={item.key} className="space-y-1">
                  <p className="text-sm text-[#333] font-medium flex items-center gap-1.5">
                    <item.icon size={14} className={item.iconColor} />
                    {item.label}数据
                  </p>
                  <p className="text-xs text-[#999] leading-relaxed pl-5">
                    {item.usage}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 数据管理区块 */}
        <div className="glass-card overflow-hidden">
          <div className="h-16 px-5 flex items-center gap-3 border-b border-white/30">
            <div className="w-10 h-10 rounded-xl bg-[#FF8C69]/15 flex items-center justify-center">
              <Download size={20} className="text-[#FF8C69]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base text-[#333]">下载我的数据</p>
              <p className="text-xs text-[#999] truncate">导出你的所有数据副本</p>
            </div>
            <button
              onClick={handleDownloadData}
              className="px-4 h-9 rounded-full bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white text-sm font-medium active:scale-95 transition-transform"
            >
              下载
            </button>
          </div>
          <div className="h-16 px-5 flex items-center gap-3 border-b border-white/30">
            <div className="w-10 h-10 rounded-xl bg-[#98D8C8]/20 flex items-center justify-center">
              <HardDrive size={20} className="text-[#98D8C8]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base text-[#333]">清除缓存</p>
              <p className="text-xs text-[#999] truncate">
                清除本地缓存，不会删除你的账号数据
              </p>
            </div>
            <button
              onClick={() => setShowClearCacheConfirm(true)}
              className="px-4 h-9 rounded-full border border-[#FF8C69]/50 text-[#FF8C69] text-sm font-medium active:scale-95 transition-transform"
            >
              清除
            </button>
          </div>
          <div className="h-16 px-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B6B]/15 flex items-center justify-center">
              <Trash2 size={20} className="text-[#FF6B6B]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base text-[#333]">删除全部数据</p>
              <p className="text-xs text-[#999] truncate">删除后无法恢复，请谨慎操作</p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 h-9 rounded-full border border-[#FF6B6B]/50 text-[#FF6B6B] text-sm font-medium active:scale-95 transition-transform"
            >
              删除
            </button>
          </div>
        </div>

        {/* 协议与政策 */}
        <div className="glass-card overflow-hidden">
          <button
            onClick={() => handlePolicyClick('隐私政策')}
            className="w-full h-16 px-5 flex items-center justify-between border-b border-white/30 active:bg-white/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF8C69]/15 flex items-center justify-center">
                <ScrollText size={20} className="text-[#FF8C69]" />
              </div>
              <span className="text-base text-[#333]">隐私政策</span>
            </div>
            <ChevronDown
              size={20}
              className="text-[#999] -rotate-90"
            />
          </button>
          <button
            onClick={() => handlePolicyClick('用户协议')}
            className="w-full h-16 px-5 flex items-center justify-between active:bg-white/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#98D8C8]/20 flex items-center justify-center">
                <FileText size={20} className="text-[#98D8C8]" />
              </div>
              <span className="text-base text-[#333]">用户协议</span>
            </div>
            <ChevronDown
              size={20}
              className="text-[#999] -rotate-90"
            />
          </button>
        </div>

        {/* 数据安全承诺 */}
        <div className="glass-card p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FF8C69]/15 flex items-center justify-center flex-shrink-0">
              <Shield size={20} className="text-[#FF8C69]" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[#333] mb-1">
                数据安全承诺
              </h3>
              <p className="text-xs text-[#999] leading-relaxed">
                您的数据仅在绑定的家人之间共享，采用端到端加密传输。
                每项数据采集都可独立开关，关闭后对应数据将不再被使用。
                所有采集的数据仅用于为您和家人生成每日播报，绝不会用于其他用途。
              </p>
            </div>
          </div>
        </div>

        {/* 退出登录按钮 */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full h-[52px] rounded-2xl bg-white/60 backdrop-blur-sm border border-white/80 text-[#FF6B6B] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          <LogOut size={18} />
          退出登录
        </button>
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/40 animate-fadeIn"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative glass-card rounded-3xl p-6 w-full max-w-sm animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#FF6B6B]/15 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={24} className="text-[#FF6B6B]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#333]">确认删除全部数据</h3>
              </div>
            </div>
            <p className="text-[#999] text-sm mb-6 leading-relaxed">
              删除后，所有的播报记录、录音、每日数据都将被永久清除，
              且无法恢复。确定要继续吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-12 rounded-2xl bg-white/60 text-[#333] font-medium active:scale-95 transition-transform border border-white/80"
              >
                取消
              </button>
              <button
                onClick={handleDeleteAllData}
                disabled={deleting}
                className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white font-medium active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B6B]/30"
              >
                {deleting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    删除中
                  </>
                ) : (
                  '确认删除'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 清除缓存确认弹窗 */}
      {showClearCacheConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/40 animate-fadeIn"
            onClick={() => setShowClearCacheConfirm(false)}
          />
          <div className="relative glass-card rounded-3xl p-6 w-full max-w-sm animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#98D8C8]/20 flex items-center justify-center flex-shrink-0">
                <HardDrive size={24} className="text-[#98D8C8]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#333]">清除本地缓存</h3>
              </div>
            </div>
            <p className="text-[#999] text-sm mb-6 leading-relaxed">
              确定要清除本地缓存吗？这不会删除你的账号数据，
              仅清除保存在本地的临时数据和离线内容。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearCacheConfirm(false)}
                className="flex-1 h-12 rounded-2xl bg-white/60 text-[#333] font-medium active:scale-95 transition-transform border border-white/80"
              >
                取消
              </button>
              <button
                onClick={handleClearCache}
                className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white font-medium active:scale-95 transition-transform shadow-lg shadow-[#FF6B6B]/30"
              >
                确认清除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 退出登录确认弹窗 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/40 animate-fadeIn"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative glass-card rounded-3xl p-6 w-full max-w-sm animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#FF6B6B]/15 flex items-center justify-center flex-shrink-0">
                <LogOut size={24} className="text-[#FF6B6B]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#333]">确认退出登录</h3>
              </div>
            </div>
            <p className="text-[#999] text-sm mb-6 leading-relaxed">
              退出后需要重新登录才能继续使用。确定要退出吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 h-12 rounded-2xl bg-white/60 text-[#333] font-medium active:scale-95 transition-transform border border-white/80"
              >
                取消
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white font-medium active:scale-95 transition-transform shadow-lg shadow-[#FF6B6B]/30"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}
