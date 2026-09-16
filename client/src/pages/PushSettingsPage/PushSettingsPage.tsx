import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  FileText,
  Calendar,
  Volume2,
  Gauge,
  Plus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@client/src/utils/cn';

interface PushSettings {
  enabled: boolean;
  dailyReportEnabled: boolean;
  festivalReminderEnabled: boolean;
  pushTimes: string[];
  frequency: 'daily' | 'weekdays' | 'custom';
  customDays: number[];
  voiceType: 'male' | 'female' | 'family';
  playbackSpeed: number;
}

const DEFAULT_SETTINGS: PushSettings = {
  enabled: true,
  dailyReportEnabled: true,
  festivalReminderEnabled: true,
  pushTimes: ['08:00', '20:00'],
  frequency: 'daily',
  customDays: [1, 2, 3, 4, 5],
  voiceType: 'female',
  playbackSpeed: 1.0,
};

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

const VOICE_OPTIONS = [
  { value: 'male' as const, label: '男声' },
  { value: 'female' as const, label: '女声' },
  { value: 'family' as const, label: '家人声音' },
];

const SPEED_OPTIONS = [
  { value: 0.8, label: '慢', sub: '0.8x' },
  { value: 1.0, label: '正常', sub: '1.0x' },
  { value: 1.2, label: '快', sub: '1.2x' },
];

const Toggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={cn(
      'relative w-12 h-7 rounded-full transition-all flex-shrink-0',
      checked
        ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B]'
        : 'bg-white/60 border border-white/80'
    )}
  >
    <span
      className={cn(
        'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all',
        checked ? 'left-[22px]' : 'left-0.5'
      )}
    />
  </button>
);

export default function PushSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<PushSettings>(DEFAULT_SETTINGS);
  const [newTime, setNewTime] = useState('09:00');
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('push_settings');
      if (saved) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const updateSetting = <K extends keyof PushSettings>(
    key: K,
    value: PushSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddTime = () => {
    if (!newTime) return;
    if (settings.pushTimes.includes(newTime)) {
      toast.error('该时间已添加');
      return;
    }
    const times = [...settings.pushTimes, newTime].sort();
    updateSetting('pushTimes', times);
    setShowTimePicker(false);
  };

  const handleRemoveTime = (time: string) => {
    if (settings.pushTimes.length <= 1) {
      toast.error('至少保留一个推送时间');
      return;
    }
    updateSetting(
      'pushTimes',
      settings.pushTimes.filter((t) => t !== time)
    );
  };

  const toggleCustomDay = (day: number) => {
    const days = settings.customDays.includes(day)
      ? settings.customDays.filter((d) => d !== day)
      : [...settings.customDays, day].sort();
    updateSetting('customDays', days);
  };

  const handleSave = () => {
    if (settings.frequency === 'custom' && settings.customDays.length === 0) {
      toast.error('请至少选择一天');
      return;
    }
    localStorage.setItem('push_settings', JSON.stringify(settings));
    toast.success('设置已保存');
  };

  const ListItem = ({
    icon: Icon,
    title,
    desc,
    right,
  }: {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    title: string;
    desc?: string;
    right: React.ReactNode;
  }) => (
    <div className="h-16 rounded-2xl bg-white/60 backdrop-blur-sm px-4 flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
        }}
      >
        <Icon size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-base text-[#333]">{title}</div>
        {desc && <div className="text-sm text-[#999] truncate">{desc}</div>}
      </div>
      {right}
    </div>
  );

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
        <h1 className="text-lg font-semibold text-[#333]">推送设置</h1>
      </div>

      <div className="space-y-5">
        {/* 总开关区 */}
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-[#333] mb-4">推送开关</h2>
          <div className="flex flex-col gap-3">
            <ListItem
              icon={Bell}
              title="总推送开关"
              desc="开启后接收所有推送通知"
              right={
                <Toggle
                  checked={settings.enabled}
                  onChange={(v) => updateSetting('enabled', v)}
                />
              }
            />
            <ListItem
              icon={FileText}
              title="每日关心报告"
              desc="每天定时推送关心播报"
              right={
                <Toggle
                  checked={settings.dailyReportEnabled}
                  onChange={(v) => updateSetting('dailyReportEnabled', v)}
                />
              }
            />
            <ListItem
              icon={Calendar}
              title="节日提醒"
              desc="重要节日提前提醒"
              right={
                <Toggle
                  checked={settings.festivalReminderEnabled}
                  onChange={(v) =>
                    updateSetting('festivalReminderEnabled', v)
                  }
                />
              }
            />
          </div>
        </div>

        {/* 推送时间 */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#333]">推送时间</h2>
            <button
              onClick={() => setShowTimePicker(true)}
              className="text-sm text-[#FF8C69] font-medium flex items-center gap-1 active:scale-95 transition-transform"
            >
              <Plus size={16} />
              添加
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {settings.pushTimes.map((time) => (
              <div
                key={time}
                className="h-16 rounded-2xl bg-white/60 backdrop-blur-sm px-4 flex items-center justify-between"
              >
                <span className="text-base text-[#333] font-medium">
                  {time}
                </span>
                <button
                  onClick={() => handleRemoveTime(time)}
                  className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center text-[#999] active:scale-95 transition-transform"
                  aria-label="删除"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 推送频率 */}
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-[#333] mb-4">推送频率</h2>
          <div className="flex gap-2 mb-4">
            {(['daily', 'weekdays', 'custom'] as const).map((freq) => (
              <button
                key={freq}
                onClick={() => updateSetting('frequency', freq)}
                className={cn(
                  'flex-1 h-10 rounded-xl text-sm font-medium transition-all',
                  settings.frequency === freq
                    ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white shadow-md shadow-[#FF6B6B]/20'
                    : 'bg-white/60 text-[#333] border border-white/80'
                )}
              >
                {freq === 'daily' ? '每天' : freq === 'weekdays' ? '工作日' : '自定义'}
              </button>
            ))}
          </div>
          {settings.frequency === 'custom' && (
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_LABELS.map((label, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleCustomDay(idx)}
                  className={cn(
                    'w-10 h-10 rounded-full text-sm font-medium transition-all',
                    settings.customDays.includes(idx)
                      ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white'
                      : 'bg-white/60 text-[#333] border border-white/80'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 播报声音 */}
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-[#333] mb-4">播报声音</h2>
          <div className="flex gap-2">
            {VOICE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateSetting('voiceType', opt.value)}
                className={cn(
                  'flex-1 h-12 rounded-2xl text-sm font-medium transition-all flex items-center justify-center gap-2',
                  settings.voiceType === opt.value
                    ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white shadow-md shadow-[#FF6B6B]/20'
                    : 'bg-white/60 text-[#333] border border-white/80'
                )}
              >
                <Volume2 size={16} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 播报语速 */}
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-[#333] mb-4">播报语速</h2>
          <div className="flex gap-2">
            {SPEED_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateSetting('playbackSpeed', opt.value)}
                className={cn(
                  'flex-1 h-12 rounded-2xl transition-all flex flex-col items-center justify-center',
                  settings.playbackSpeed === opt.value
                    ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white shadow-md shadow-[#FF6B6B]/20'
                    : 'bg-white/60 text-[#333] border border-white/80'
                )}
              >
                <Gauge size={16} />
                <span className="text-xs font-medium">{opt.label}</span>
                <span className="text-[10px] opacity-80">{opt.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 保存按钮 */}
        <button onClick={handleSave} className="btn-gradient w-full">
          保存设置
        </button>
      </div>

      {/* 添加时间弹层 */}
      {showTimePicker && (
        <div
          className="fixed inset-0 bg-black/30 flex items-end justify-center z-50 animate-fade-in-up"
          onClick={() => setShowTimePicker(false)}
        >
          <div
            className="w-full max-w-[480px] bg-white rounded-t-3xl p-6 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[#333] mb-5 text-center">
              选择推送时间
            </h3>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="glass-input w-full text-center text-xl font-medium mb-5"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowTimePicker(false)}
                className="flex-1 h-[52px] rounded-2xl bg-white/75 border border-white/80 text-[#FF8C69] font-semibold active:scale-[0.98] transition-all"
              >
                取消
              </button>
              <button
                onClick={handleAddTime}
                className="flex-1 btn-gradient"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
