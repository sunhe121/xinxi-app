import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Mic,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  X,
  Sparkles,
  Clock,
  Tag,
  Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { languageStyleApi } from '@client/src/api';
import {
  LANGUAGE_SAMPLE_CATEGORIES,
  type LanguageSample,
} from '@shared/api.interface';
import { cn } from '@client/src/utils/cn';
import { logger } from '@lark-apaas/client-toolkit/logger';

// Web Speech API 类型声明（最小化）
declare global {
  interface Window {
    SpeechRecognition?: { new (): SpeechRecognition };
    webkitSpeechRecognition?: { new (): SpeechRecognition };
  }
  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    start(): void;
    stop(): void;
    onresult: ((e: any) => void) | null;
    onerror: ((e: any) => void) | null;
    onend: (() => void) | null;
  }
}

type StyleProfile = { profile: string; keywords: string[]; tone: string } | null;

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

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getCategoryLabel(category: LanguageSample['category']): string {
  return LANGUAGE_SAMPLE_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

export default function LanguageStylePage() {
  const navigate = useNavigate();

  const [samples, setSamples] = useState<LanguageSample[]>([]);
  const [profile, setProfile] = useState<StyleProfile>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('warm');

  // 录制弹层
  const [showRecorder, setShowRecorder] = useState(false);
  const [editingSample, setEditingSample] = useState<LanguageSample | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<LanguageSample['category']>('daily');
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [saving, setSaving] = useState(false);

  // 录音状态
  const [recording, setRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const speechSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const mediaRecorderSupported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window !== 'undefined' &&
    'MediaRecorder' in window;

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [samplesData, profileData] = await Promise.all([
        languageStyleApi.getSamples(),
        languageStyleApi.getProfile(),
      ]);
      setSamples(samplesData);
      if (profileData?.profile) {
        setProfile(profileData);
      } else {
        setProfile(null);
      }
    } catch (error) {
      logger.error('加载数据失败', String(error));
      toast.error('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 打开录制弹层
  const openRecorder = (sample?: LanguageSample) => {
    if (sample) {
      setEditingSample(sample);
      setTitle(sample.title);
      setCategory(sample.category);
      setTranscript(sample.transcript);
      setAudioUrl(sample.audioUrl ?? '');
      setDuration(sample.duration);
    } else {
      setEditingSample(null);
      setTitle('');
      setCategory('daily');
      setTranscript('');
      setAudioUrl('');
      setDuration(0);
    }
    setRecordDuration(0);
    setShowRecorder(true);
  };

  const closeRecorder = () => {
    if (recording) {
      stopRecording();
    }
    setShowRecorder(false);
  };

  // 开始录音
  const startRecording = async () => {
    if (!mediaRecorderSupported) {
      toast.error('你的浏览器不支持录音功能');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setDuration(recordDuration);
        // 清理流
        stream.getTracks().forEach((track) => track.stop());
        // 启动语音识别
        startSpeechRecognition();
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordDuration(0);

      recordTimerRef.current = window.setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      logger.error('录音启动失败', String(error));
      toast.error('无法启动录音，请检查麦克风权限');
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
    }
  };

  // 语音识别
  const startSpeechRecognition = () => {
    if (!speechSupported) {
      toast.info('你的浏览器不支持语音识别，请手动输入文字');
      return;
    }
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;
    const recognition: SpeechRecognition = new SpeechRecognitionCtor();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalText = transcript;
    recognition.onresult = (event) => {
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptText = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcriptText;
        } else {
          interimText += transcriptText;
        }
      }
      setTranscript(finalText + interimText);
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        logger.warn('语音识别错误:', String(event.error));
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (error) {
      logger.warn('语音识别启动失败', String(error));
    }
  };

  // 停止语音识别
  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
  };

  // 保存样本
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('请输入标题');
      return;
    }
    if (!transcript.trim()) {
      toast.error('请输入或录制语音文字内容');
      return;
    }
    setSaving(true);
    try {
      if (editingSample) {
        const updated = await languageStyleApi.updateSample(editingSample.id, {
          title: title.trim(),
          transcript: transcript.trim(),
          audioUrl,
          duration,
        });
        setSamples((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        toast.success('样本已更新');
      } else {
        const created = await languageStyleApi.createSample({
          category,
          title: title.trim(),
          transcript: transcript.trim(),
          audioUrl,
          duration,
        });
        setSamples((prev) => [created, ...prev]);
        toast.success('样本已保存');
      }
      closeRecorder();
    } catch (error) {
      logger.error('保存失败', String(error));
      toast.error('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  // 删除样本
  const handleDelete = async (id: string) => {
    try {
      await languageStyleApi.deleteSample(id);
      setSamples((prev) => prev.filter((s) => s.id !== id));
      toast.success('样本已删除');
    } catch (error) {
      logger.error('删除失败', String(error));
      toast.error('删除失败，请稍后重试');
    }
  };

  // 分析语言风格
  const handleAnalyze = async () => {
    if (samples.length < 3) {
      toast.error('请先录制至少 3 段语音样本');
      return;
    }
    setAnalyzing(true);
    try {
      const result = await languageStyleApi.analyze();
      setProfile(result);
      toast.success('风格分析完成');
    } catch (error) {
      logger.error('分析失败', String(error));
      toast.error('分析失败，请稍后重试');
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePreview = () => {
    const style = STYLE_OPTIONS.find((s) => s.id === selectedStyle);
    toast.info(`正在试听「${style?.name}」风格...`);
  };

  const handleSaveStyle = () => {
    const style = STYLE_OPTIONS.find((s) => s.id === selectedStyle);
    toast.success(`已保存为「${style?.name}」风格`);
  };

  const canAnalyze = samples.length >= 3;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#999]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-6 max-w-[480px] mx-auto">
      {/* 顶部导航 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="返回"
        >
          <ArrowLeft size={20} className="text-[#333]" />
        </button>
        <h1 className="text-lg font-semibold text-[#333]">语言风格</h1>
      </div>

      {/* 说明区 */}
      <div className="glass-card p-6 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={20} className="text-[#FF8C69]" />
          <h2 className="text-lg font-semibold text-[#333]">选择播报风格</h2>
        </div>
        <p className="text-sm text-[#999] leading-relaxed">
          选择你喜欢的语言风格，每日播报将以这种语气生成，
          让每一句问候都充满你想要的温度。
        </p>
      </div>

      {/* 风格选项列表 */}
      <div className="space-y-4 mb-5">
        {STYLE_OPTIONS.map((style) => (
          <div
            key={style.id}
            onClick={() => setSelectedStyle(style.id)}
            className={cn(
              'glass-card p-5 cursor-pointer transition-all active:scale-[0.99]',
              selectedStyle === style.id
                ? 'border-[#FF8C69]/60 shadow-lg shadow-[#FF6B6B]/15'
                : ''
            )}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold text-[#333]">{style.name}</h3>
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                  selectedStyle === style.id
                    ? 'bg-gradient-to-br from-[#FF8C69] to-[#FF6B6B] shadow-md shadow-[#FF6B6B]/30'
                    : 'bg-white/60 border border-white/80'
                )}
              >
                {selectedStyle === style.id && (
                  <Check size={14} className="text-white" />
                )}
              </div>
            </div>
            <p className="text-sm text-[#999] mt-2 leading-relaxed">
              {style.desc}
            </p>
            <p className="text-sm text-[#FF8C69] italic mt-3">
              {style.sample}
            </p>
          </div>
        ))}
      </div>

      {/* 预览/试听按钮 */}
      <button
        onClick={handlePreview}
        className="btn-gradient w-full mt-6 flex items-center justify-center gap-2"
      >
        <Mic size={18} />
        试听效果
      </button>

      {/* 保存按钮 */}
      <button
        onClick={handleSaveStyle}
        className="btn-gradient w-full mt-4"
      >
        保存设置
      </button>

      {/* 我的语音样本 */}
      <div className="mt-8 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Tag size={18} className="text-[#FF8C69]" />
          <h2 className="text-base font-semibold text-[#333]">我的语音样本</h2>
          <span className="text-xs text-[#999]">
            {samples.length}/3
          </span>
        </div>

        {samples.length === 0 ? (
          <div className="glass-card p-6 text-center">
            <p className="text-[#999] text-sm">还没有语音样本</p>
            <p className="text-[#999]/60 text-xs mt-1">
              录制样本让AI学习你的说话方式
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {samples.map((sample) => (
              <div
                key={sample.id}
                className="glass-card p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-[#333] truncate text-sm">
                        {sample.title}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#FF8C69]/15 text-[#FF8C69] shrink-0">
                        {getCategoryLabel(sample.category)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[#999]">
                      <Clock size={12} />
                      <span>{formatDuration(sample.duration)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <button
                      onClick={() => openRecorder(sample)}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[#999] hover:bg-white/60 hover:text-[#333] transition-colors"
                      aria-label="编辑"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(sample.id)}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[#999] hover:bg-[#FF6B6B]/10 hover:text-[#FF6B6B] transition-colors"
                      aria-label="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[#999] line-clamp-2 leading-relaxed">
                  {sample.transcript}
                </p>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => openRecorder()}
          className={cn(
            'w-full mt-4 h-12 rounded-2xl flex items-center justify-center gap-2 font-medium transition-all active:scale-[0.98]',
            samples.length < 3
              ? 'bg-white/60 border border-white/80 text-[#FF8C69]'
              : 'bg-white/30 border border-white/50 text-[#999] cursor-not-allowed'
          )}
          disabled={samples.length >= 3}
        >
          <Plus size={18} />
          录制新样本
        </button>
      </div>

      {/* 风格画像 */}
      {profile && (
        <div className="glass-card p-5 mt-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#FF8C69]" />
              <h3 className="text-base font-semibold text-[#333]">我的语言风格</h3>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !canAnalyze}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                canAnalyze
                  ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white active:scale-95'
                  : 'bg-white/40 text-[#999] cursor-not-allowed',
              )}
            >
              <RefreshCw size={14} className={analyzing ? 'animate-spin' : ''} />
              {analyzing ? '分析中' : '重新分析'}
            </button>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-[#333] leading-relaxed">{profile.profile}</p>
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
        </div>
      )}

      {/* 录制弹层 */}
      {showRecorder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeRecorder}
          />
          <div className="relative w-full max-w-[480px] bg-white/90 backdrop-blur-2xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden animate-slide-up border-t border-white/80">
            {/* 弹层头部 */}
            <div className="sticky top-0 bg-white/70 backdrop-blur-xl px-5 py-4 flex items-center justify-between border-b border-white/60 z-10">
              <button
                onClick={closeRecorder}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#999] hover:bg-white/60 transition-colors"
                aria-label="关闭"
              >
                <X size={20} />
              </button>
              <h3 className="text-lg font-semibold text-[#333]">
                {editingSample ? '编辑样本' : '录制新样本'}
              </h3>
              <button
                onClick={handleSave}
                disabled={saving || recording}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium min-h-10 transition-all',
                  saving || recording
                    ? 'bg-white/40 text-[#999] cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white shadow-md shadow-[#FF6B6B]/20 active:scale-95',
                )}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto">
              {/* 标题输入 */}
              <div>
                <label className="block text-sm font-medium text-[#333] mb-2">
                  标题
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="给这段语音起个名字"
                  className="glass-input w-full px-4 py-3 text-[#333] placeholder:text-[#999]"
                />
              </div>

              {/* 分类选择 */}
              <div>
                <label className="block text-sm font-medium text-[#333] mb-2">
                  分类
                </label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_SAMPLE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      disabled={!!editingSample}
                      className={cn(
                        'px-3.5 py-2 rounded-full text-sm font-medium min-h-10 transition-all',
                        category === cat.value
                          ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white'
                          : 'bg-white/60 text-[#999] border border-white/80 hover:border-[#FF8C69]/50',
                        editingSample && 'opacity-60 cursor-not-allowed',
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 录音区域 */}
              <div>
                <label className="block text-sm font-medium text-[#333] mb-2">
                  录音
                </label>
                <div className="glass-input p-6 flex flex-col items-center">
                  <button
                    onClick={recording ? stopRecording : startRecording}
                    disabled={!mediaRecorderSupported}
                    className={cn(
                      'w-20 h-20 rounded-full flex items-center justify-center transition-all',
                      recording
                        ? 'bg-[#FF6B6B] text-white shadow-lg shadow-[#FF6B6B]/30 animate-pulse'
                        : 'bg-gradient-to-br from-[#FF8C69] to-[#FF6B6B] text-white shadow-lg shadow-[#FF6B6B]/30 hover:shadow-xl active:scale-95',
                      !mediaRecorderSupported &&
                        'bg-white/40 text-[#999] cursor-not-allowed shadow-none',
                    )}
                    aria-label={recording ? '停止录音' : '开始录音'}
                  >
                    <Mic size={32} />
                  </button>
                  <div className="mt-3 text-lg font-medium text-[#333]">
                    {formatDuration(recording ? recordDuration : duration)}
                  </div>
                  <div className="mt-1 text-xs text-[#999]">
                    {recording
                      ? '正在录音... 点击停止'
                      : duration > 0
                        ? '已录制完成'
                        : mediaRecorderSupported
                          ? '点击麦克风开始录音'
                          : '你的浏览器不支持录音功能'}
                  </div>
                  {audioUrl && !recording && (
                    <audio
                      src={audioUrl}
                      controls
                      className="mt-3 w-full max-w-[280px]"
                    />
                  )}
                </div>
              </div>

              {/* 转录文字 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-[#333]">
                    转录文字
                  </label>
                  {!speechSupported && (
                    <span className="text-xs text-[#FFB347]">
                      请手动输入文字
                    </span>
                  )}
                </div>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  onBlur={stopSpeechRecognition}
                  placeholder="录音停止后将自动识别文字，你也可以手动编辑..."
                  rows={5}
                  className="glass-input w-full px-4 py-3 text-[#333] placeholder:text-[#999] resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
