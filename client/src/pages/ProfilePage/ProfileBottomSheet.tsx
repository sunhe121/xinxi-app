import { X, Heart, Calendar, Check } from 'lucide-react';
import { cn } from '@client/src/utils/cn';
import type { ToneStyle } from '@shared/api.interface';
import { TONE_STYLE_LABELS } from '@shared/api.interface';

// ============== BottomSheet 容器 ==============
interface BottomSheetProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export default function BottomSheet({
  title,
  children,
  onClose,
}: BottomSheetProps) {
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

// ============== 推送设置弹层内容 ==============
const PUSH_TIME_OPTIONS = [
  { value: '08:00', label: '早上8点' },
  { value: '12:00', label: '中午12点' },
  { value: '20:00', label: '晚上8点' },
];

interface PushSheetContentProps {
  selectedPushTimes: string[];
  onToggle: (time: string) => void;
  onSave: () => void;
}

export function PushSheetContent({
  selectedPushTimes,
  onToggle,
  onSave,
}: PushSheetContentProps) {
  return (
    <div>
      <p className="text-sm text-[#999] mb-4">
        选择你想收到播报的时间（可多选）
      </p>
      <div className="space-y-2 mb-6">
        {PUSH_TIME_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onToggle(opt.value)}
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
      <button onClick={onSave} className="w-full py-4 btn-gradient">
        保存设置
      </button>
    </div>
  );
}

// ============== 节日提醒弹层内容 ==============
interface FestivalItem {
  id: string;
  name: string;
  date: string;
  type: 'birthday' | 'festival' | 'anniversary';
}

interface FestivalSheetContentProps {
  festivals: FestivalItem[];
  onAdd: () => void;
}

export function FestivalSheetContent({
  festivals,
  onAdd,
}: FestivalSheetContentProps) {
  return (
    <div>
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
                background:
                  'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
              }}
            >
              <Calendar size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[#333] text-sm truncate">
                {f.name}
              </p>
              <p className="text-xs text-[#999] mt-0.5">{f.date}</p>
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-full text-white flex-shrink-0"
              style={{
                background:
                  'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
              }}
            >
              {f.type === 'birthday'
                ? '生日'
                : f.type === 'festival'
                  ? '节日'
                  : '纪念日'}
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={onAdd}
        className="w-full py-4 border-2 border-dashed border-white/60 text-[#999] rounded-2xl font-medium text-base active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
      >
        + 添加提醒
      </button>
    </div>
  );
}

// ============== 语言风格弹层内容 ==============
const TONE_STYLES: Array<{ value: ToneStyle; desc: string }> = [
  { value: 'warm_chatter', desc: '像爸妈一样唠叨，句句都是关心' },
  { value: 'warm_concise', desc: '简洁实在，关心都在行动里' },
  { value: 'humorous', desc: '幽默风趣，让TA笑着听完播报' },
  { value: 'gentle', desc: '温柔细腻，像春风拂面' },
];

interface ToneSheetContentProps {
  selectedTone: ToneStyle;
  onSelect: (tone: ToneStyle) => void;
  onSave: () => void;
}

export function ToneSheetContent({
  selectedTone,
  onSelect,
  onSave,
}: ToneSheetContentProps) {
  return (
    <div>
      <p className="text-sm text-[#999] mb-4">
        选择播报的语言风格，让TA感受到不一样的你
      </p>
      <div className="space-y-2 mb-6">
        {TONE_STYLES.map((style) => (
          <button
            key={style.value}
            onClick={() => onSelect(style.value)}
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
      <button onClick={onSave} className="w-full py-4 btn-gradient">
        保存设置
      </button>
    </div>
  );
}

// ============== 关于心系弹层内容 ==============
export function AboutSheetContent() {
  return (
    <div>
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
    </div>
  );
}
