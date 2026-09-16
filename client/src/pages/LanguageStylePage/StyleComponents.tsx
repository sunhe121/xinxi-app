import { Sparkles, Mic, Plus } from 'lucide-react';
import { cn } from '@client/src/utils/cn';

type StyleOption = {
  id: string;
  name: string;
  desc: string;
  sample: string;
};

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'warm',
    name: '温暖治愈',
    desc: '语气温柔体贴，像家人一样嘘寒问暖，充满关心和爱意。',
    sample: '"今天天气真好，出门走走吧，记得多穿点衣服哦~"',
  },
  {
    id: 'cheerful',
    name: '活泼开朗',
    desc: '语气明快积极，充满正能量，让人听了心情愉悦。',
    sample: '"哇！今天走了这么多路，太棒啦！继续保持哦~"',
  },
  {
    id: 'gentle',
    name: '温柔沉稳',
    desc: '语气温和舒缓，节奏稍慢，给人安心踏实的感觉。',
    sample: '"今天休息得还不错，慢慢来，身体最重要。"',
  },
  {
    id: 'humorous',
    name: '幽默风趣',
    desc: '语气轻松诙谐，偶尔开开玩笑，让每一天都充满欢笑。',
    sample: '"哟，今天步数破万啦，这是要去拿奥运冠军的节奏呀！"',
  },
];

export { STYLE_OPTIONS };

interface StyleSelectorProps {
  selectedStyle: string;
  onSelect: (id: string) => void;
}

export function StyleSelector({
  selectedStyle,
  onSelect,
}: StyleSelectorProps) {
  return (
    <>
      <div className="glass-card p-6 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={20} className="text-[#FF8C69]" />
          <h2 className="text-lg font-semibold text-[#333]">选择播报风格</h2>
        </div>
        <p className="text-sm text-[#999] leading-[1.7]">
          选择你喜欢的语言风格，每日播报将以这种语气生成，
          让每一句问候都充满你想要的温度。
        </p>
      </div>

      <div className="space-y-4 mb-5">
        {STYLE_OPTIONS.map((style) => (
          <div
            key={style.id}
            onClick={() => onSelect(style.id)}
            className={cn(
              'glass-card p-5 cursor-pointer transition-all active:scale-[0.99]',
              selectedStyle === style.id
                ? 'border-[#FF8C69]/60 shadow-lg shadow-[#FF6B6B]/15'
                : ''
            )}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold text-[#333]">
                {style.name}
              </h3>
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                  selectedStyle === style.id
                    ? 'bg-gradient-to-br from-[#FF8C69] to-[#FF6B6B] shadow-md shadow-[#FF6B6B]/30'
                    : 'bg-white/60 border border-white/80'
                )}
              >
                {selectedStyle === style.id && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </div>
            <p className="text-sm text-[#999] mt-2 leading-[1.7]">
              {style.desc}
            </p>
            <p className="text-sm text-[#FF8C69] italic mt-3">{style.sample}</p>
          </div>
        ))}
      </div>
    </>
  );
}

interface RecordingGuideProps {
  sampleCount: number;
  onRecord: () => void;
}

export function RecordingGuide({
  sampleCount,
  onRecord,
}: RecordingGuideProps) {
  if (sampleCount >= 3) return null;

  return (
    <div className="glass-card p-6 mb-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF8C69] to-[#FF6B6B] flex items-center justify-center shadow-md shadow-[#FF6B6B]/30">
          <Mic size={18} className="text-white" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#333]">
            录制你的声音样本
          </h3>
          <p className="text-xs text-[#999]">让AI学习你的语言风格</p>
        </div>
      </div>
      <p className="text-sm text-[#666] leading-[1.7] mb-4">
        录制至少3段语音样本，AI就能学习你的语言风格，
        让每日播报更像你在说话。建议录制不同场景的语音，效果更好。
      </p>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#999]">录制进度</span>
          <span className="text-xs font-medium text-[#FF8C69]">
            {sampleCount}/3 已录制
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/60 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] rounded-full transition-all duration-300"
            style={{ width: `${(sampleCount / 3) * 100}%` }}
          />
        </div>
      </div>
      <button
        onClick={onRecord}
        className="btn-gradient w-full flex items-center justify-center gap-2"
      >
        <Plus size={18} />
        立即录制
      </button>
    </div>
  );
}

interface StyleProfileCardProps {
  profile: { profile: string; keywords: string[]; tone: string } | null;
  canAnalyze: boolean;
  analyzing: boolean;
  onReanalyze: () => void;
}

export function StyleProfileCard({
  profile,
  canAnalyze,
  analyzing,
  onReanalyze,
}: StyleProfileCardProps) {
  if (!profile) return null;

  return (
    <div className="glass-card p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-[#FF8C69]" />
          <h3 className="text-base font-semibold text-[#333]">
            我的语言风格
          </h3>
        </div>
        <button
          onClick={onReanalyze}
          disabled={analyzing || !canAnalyze}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
            canAnalyze
              ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white active:scale-95'
              : 'bg-white/40 text-[#999] cursor-not-allowed'
          )}
        >
          <RefreshCw size={14} className={analyzing ? 'animate-spin' : ''} />
          {analyzing ? '分析中' : '重新分析'}
        </button>
      </div>
      <div className="space-y-4">
        <p className="text-sm text-[#333] leading-[1.7]">{profile.profile}</p>
        <div>
          <p className="text-xs text-[#999] mb-2">关键词</p>
          <div className="flex flex-wrap gap-2">
            {profile.keywords.map((kw: string, idx: number) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full bg-[#FF8C69]/15 text-[#FF8C69] text-xs"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-white/30">
          <Volume2 size={14} className="text-[#98D8C8]" />
          <span className="text-xs text-[#999]">语气特点：</span>
          <span className="text-xs text-[#333] font-medium">
            {profile.tone}
          </span>
        </div>
      </div>
    </div>
  );
}

// Need RefreshCw and Volume2 imports for StyleProfileCard
import { RefreshCw, Volume2 } from 'lucide-react';
