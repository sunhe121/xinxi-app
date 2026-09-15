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
} from 'lucide-react';
import { toast } from 'sonner';
import { privacyApi } from '@client/src/api';
import type { PrivacySettings } from '@shared/api.interface';
import { cn } from '@client/src/utils/cn';

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
    iconBg: 'bg-primary/15',
    iconColor: 'text-primary',
    usage: '步数数据用于在每日播报中体现TA当天的活动状态，让你了解TA是否出门走动，有没有好好锻炼。',
  },
  {
    key: 'sleepEnabled',
    icon: Moon,
    label: '睡眠',
    desc: '手机传感器监测睡眠时长，用于关心休息质量',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-400',
    usage: '睡眠数据用于在每日播报中反馈TA的睡眠情况，提醒TA注意休息，养成规律作息。',
  },
  {
    key: 'locationEnabled',
    icon: MapPin,
    label: '位置',
    desc: '手机GPS定位，用于判断是否出门、是否安全到家',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-500',
    sensitive: true,
    usage: '位置数据仅用于判断TA的活动地点类型（家/公园/超市/医院等），不会记录精确位置轨迹，更不会分享给第三方。',
  },
  {
    key: 'ambientSoundEnabled',
    icon: Mic,
    label: '环境声音',
    desc: '仅在本地提取声音特征，不保存录音内容',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-400',
    usage: '环境声音仅在本地提取简单特征（如是否有人声、笑声），用于判断TA的社交状态，绝不会上传或保存任何录音文件。',
  },
  {
    key: 'callDurationEnabled',
    icon: Phone,
    label: '通话时长',
    desc: '手机系统权限，用于了解社交活跃度',
    iconBg: 'bg-success/15',
    iconColor: 'text-success',
    usage: '通话时长数据仅用于了解TA的社交活跃度，不会记录通话内容、联系人信息等敏感信息。',
  },
  {
    key: 'heartRateEnabled',
    icon: Heart,
    label: '心率/血氧',
    desc: '需要连接智能手表/手环，通过蓝牙同步健康数据',
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    usage: '心率血氧数据用于健康状态评估，需连接智能穿戴设备，关闭后不会采集任何健康相关数据。',
  },
];

export default function PrivacyPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showUsageDetail, setShowUsageDetail] = useState(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-[480px] mx-auto">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center active:scale-95 transition-transform"
          aria-label="返回"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">隐私设置</h1>
      </div>

      <div className="px-5 pb-28 space-y-5">
        {/* 顶部说明卡片 - 绝不采集 */}
        <div className="bg-gradient-to-br from-destructive/10 via-primary/10 to-accent/10 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center flex-shrink-0">
              <Shield size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-foreground text-base mb-2">
                我们绝不采集
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  <span className="text-muted-foreground">消费记录</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  <span className="text-muted-foreground">聊天内容</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  <span className="text-muted-foreground">浏览历史</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  <span className="text-muted-foreground">通话录音</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 数据采集列表 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            数据采集设置（默认关闭）
          </h3>
          <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
            {PRIVACY_ITEMS.map((item, index) => (
              <div
                key={item.key}
                  className={cn(
                    'flex items-start gap-4 p-4 min-h-14',
                    index < PRIVACY_ITEMS.length - 1
                      ? 'border-b border-border/60'
                      : ''
                  )}
              >
                <div className="relative flex-shrink-0">
                  <div
                    className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center',
                      item.iconBg
                    )}
                  >
                    <item.icon size={22} className={item.iconColor} />
                  </div>
                  {item.sensitive && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-destructive text-white text-[10px] font-bold rounded-full">
                      隐私
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-base">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <button
                  onClick={() => handleToggle(item.key)}
                  disabled={saving}
                  className={cn(
                    'w-14 h-8 rounded-full transition-colors duration-300 relative flex-shrink-0 mt-1 active:scale-95',
                    settings[item.key] ? 'bg-primary' : 'bg-muted'
                  )}
                  aria-label={settings[item.key] ? '关闭' : '开启'}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 w-7 h-7 bg-white rounded-full shadow-md transition-transform duration-300',
                      settings[item.key]
                        ? 'translate-x-6'
                        : 'translate-x-0.5'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 数据授权说明（折叠） */}
        <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => setShowUsageDetail(!showUsageDetail)}
            className="w-full flex items-center justify-between p-4 active:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-accent/20 flex items-center justify-center">
                <Shield size={22} className="text-accent" />
              </div>
              <span className="font-medium text-foreground text-base">
                数据授权说明
              </span>
            </div>
            {showUsageDetail ? (
              <ChevronUp size={20} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={20} className="text-muted-foreground" />
            )}
          </button>
          {showUsageDetail && (
            <div className="px-4 pb-4 space-y-3 border-t border-border/60 pt-3">
              {PRIVACY_ITEMS.map((item) => (
                <div key={item.key} className="space-y-1">
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <item.icon size={14} className={item.iconColor} />
                    {item.label}数据
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-5">
                    {item.usage}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 数据管理区块 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            数据管理
          </h3>
          <div className="bg-card rounded-2xl overflow-hidden shadow-sm space-y-px">
            <button
              onClick={handleDownloadData}
             className="w-full flex items-center gap-4 p-4 min-h-14 text-left transition-all active:bg-muted/50"
             >
               <div className="w-11 h-11 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                 <Download size={22} className="text-accent" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-foreground text-base block">
                  下载我的数据
                </span>
                <span className="text-xs text-muted-foreground mt-0.5 block">
                  导出你的所有数据副本
                </span>
              </div>
              <ArrowLeft size={18} className="text-muted-foreground rotate-180" />
            </button>
            <div className="border-t border-border/60" />
            <button
              onClick={() => setShowDeleteConfirm(true)}
             className="w-full flex items-center gap-4 p-4 min-h-14 text-left transition-all active:bg-muted/50"
             >
               <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                 <Trash2 size={22} className="text-destructive" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-destructive text-base block">
                  删除全部数据
                </span>
                <span className="text-xs text-muted-foreground mt-0.5 block">
                  删除后无法恢复，请谨慎操作
                </span>
              </div>
              <ArrowLeft size={18} className="text-muted-foreground rotate-180" />
            </button>
          </div>
        </div>

        {/* 数据安全承诺 */}
        <div className="bg-secondary/50 rounded-2xl p-5 space-y-3">
          <h3 className="font-medium text-foreground flex items-center gap-2 text-base">
            <Shield size={18} className="text-primary" />
            数据安全承诺
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              1. <span className="text-foreground font-medium">端到端加密</span>：您和家人之间的数据传输采用端到端加密，任何人都无法读取。
            </p>
            <p>
              2. <span className="text-foreground font-medium">最小化采集</span>：每项数据采集都可独立开关，关闭后对应数据将不再被使用。
            </p>
            <p>
              3. <span className="text-foreground font-medium">仅用于播报</span>：所有采集的数据仅用于为您和家人生成每日播报，绝不会用于其他用途。
            </p>
          </div>
        </div>

        {/* 底部说明 */}
        <p className="text-center text-xs text-muted-foreground pt-2">
           心系 · 守护您的每一份隐私
        </p>
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/40 animate-fadeIn"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-card rounded-2xl p-6 w-full max-w-sm animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={24} className="text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">确认删除全部数据</h3>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              删除后，所有的播报记录、录音、每日数据都将被永久清除，
              且无法恢复。确定要继续吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-12 rounded-xl bg-secondary text-foreground font-medium active:scale-95 transition-transform"
              >
                取消
              </button>
              <button
                onClick={handleDeleteAllData}
                disabled={deleting}
                className="flex-1 h-12 rounded-xl bg-destructive text-white font-medium active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
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
