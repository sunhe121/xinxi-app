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

  const canAnalyze = samples.length >= 3;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F3] flex items-center justify-center">
        <div className="text-[#8B7D75]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F3] pb-8">
      {/* 顶部导航 */}
      <div className="max-w-[480px] mx-auto bg-[#FFF8F3] sticky top-0 z-10 px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-full bg-white shadow-sm flex items-center justify-center text-[#4A3F3A] hover:bg-[#FFF0E8] transition-colors"
          aria-label="返回"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold text-[#4A3F3A]">语言风格学习</h1>
      </div>

      <div className="max-w-[480px] mx-auto px-5 space-y-5">
        {/* 风格画像展示区 */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-[#FF8C69]" />
              <h2 className="text-lg font-semibold text-[#4A3F3A]">我的语言风格</h2>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !canAnalyze}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 rounded-full text-base font-medium min-h-11 transition-all',
                canAnalyze
                  ? 'bg-gradient-to-r from-[#FF8C69] to-[#FFB347] text-white hover:shadow-md active:scale-95'
                  : 'bg-[#F0E6DD] text-[#B0A59F] cursor-not-allowed',
              )}
              title={canAnalyze ? '重新分析' : '请先录制至少 3 段语音样本'}
            >
              <RefreshCw size={18} className={analyzing ? 'animate-spin' : ''} />
              {analyzing ? '分析中...' : profile ? '重新分析' : '分析风格'}
            </button>
          </div>

          {profile ? (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-[#8B7D75] mb-1">风格画像</div>
                <p className="text-[#4A3F3A] leading-relaxed">{profile.profile}</p>
              </div>

              <div>
                <div className="text-sm text-[#8B7D75] mb-2">关键词</div>
                <div className="flex flex-wrap gap-2">
                  {profile.keywords.map((kw: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 rounded-full bg-[#FFF0E8] text-[#FF8C69] text-sm"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm text-[#8B7D75] mb-1">语气特点</div>
                <p className="text-[#4A3F3A]">{profile.tone}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#FFF0E8] flex items-center justify-center">
                <Mic size={28} className="text-[#FF8C69]" />
              </div>
              <p className="text-[#8B7D75] text-sm">
                录制至少 3 段语音，AI 将分析你的语言风格
              </p>
              <p className="text-[#B0A59F] text-xs mt-1">
                当前样本数：{samples.length}/3
              </p>
            </div>
          )}
        </div>

        {/* 语音样本列表 */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tag size={18} className="text-[#FF8C69]" />
              <h2 className="text-lg font-semibold text-[#4A3F3A]">语音样本</h2>
              <span className="text-sm text-[#8B7D75]">
                样本数：{samples.length}/3
              </span>
            </div>
            <button
              onClick={() => openRecorder()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#FF8C69] to-[#FFB347] text-white text-base font-medium min-h-11 hover:shadow-md active:scale-95 transition-all"
            >
              <Plus size={18} />
              录制新样本
            </button>
          </div>

          {samples.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#B0A59F] text-sm">还没有语音样本</p>
              <p className="text-[#C9BFB8] text-xs mt-1">
                点击"录制新样本"开始录制
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {samples.map((sample) => (
                <div
                  key={sample.id}
                  className="p-4 rounded-xl bg-[#FFFAF7] border border-[#F0E6DD] min-h-16"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-[#4A3F3A] truncate">
                          {sample.title}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFF0E8] text-[#FF8C69] shrink-0">
                          {getCategoryLabel(sample.category)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[#8B7D75]">
                        <Clock size={12} />
                        <span>{formatDuration(sample.duration)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <button
                        onClick={() => openRecorder(sample)}
                         className="w-11 h-11 rounded-full flex items-center justify-center text-[#8B7D75] hover:bg-[#F0E6DD] hover:text-[#4A3F3A] transition-colors"
                        aria-label="编辑"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(sample.id)}
                         className="w-11 h-11 rounded-full flex items-center justify-center text-[#8B7D75] hover:bg-[#FFE4E0] hover:text-[#FF6B6B] transition-colors"
                        aria-label="删除"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-[#8B7D75] line-clamp-2 leading-relaxed">
                    {sample.transcript}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 录制弹层 */}
      {showRecorder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeRecorder}
          />
          <div className="relative w-full max-w-[480px] bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden animate-slide-up">
            {/* 弹层头部 */}
            <div className="sticky top-0 bg-white px-5 py-4 flex items-center justify-between border-b border-[#F0E6DD] z-10">
              <button
                onClick={closeRecorder}
                className="w-11 h-11 rounded-full flex items-center justify-center text-[#8B7D75] hover:bg-[#F0E6DD] transition-colors"
                aria-label="关闭"
              >
                <X size={20} />
              </button>
              <h3 className="text-lg font-semibold text-[#4A3F3A]">
                {editingSample ? '编辑样本' : '录制新样本'}
              </h3>
              <button
                onClick={handleSave}
                disabled={saving || recording}
                className={cn(
                  'px-4 py-2.5 rounded-full text-base font-medium min-h-11 transition-all',
                  saving || recording
                    ? 'bg-[#F0E6DD] text-[#B0A59F] cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#FF8C69] to-[#FFB347] text-white hover:shadow-md active:scale-95',
                )}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto">
              {/* 标题输入 */}
              <div>
                <label className="block text-sm font-medium text-[#4A3F3A] mb-2">
                  标题
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="给这段语音起个名字"
                  className="w-full px-4 py-3 rounded-xl bg-[#FFFAF7] border border-[#F0E6DD] text-[#4A3F3A] placeholder:text-[#B0A59F] focus:outline-none focus:border-[#FF8C69] focus:ring-2 focus:ring-[#FF8C69]/20 transition-all"
                />
              </div>

              {/* 分类选择 */}
              <div>
                <label className="block text-sm font-medium text-[#4A3F3A] mb-2">
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
                          ? 'bg-[#FF8C69] text-white'
                          : 'bg-[#FFFAF7] text-[#8B7D75] border border-[#F0E6DD] hover:border-[#FF8C69]/50',
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
                <label className="block text-sm font-medium text-[#4A3F3A] mb-2">
                  录音
                </label>
                <div className="p-6 rounded-xl bg-[#FFFAF7] border border-[#F0E6DD] flex flex-col items-center">
                  <button
                    onClick={recording ? stopRecording : startRecording}
                    disabled={!mediaRecorderSupported}
                    className={cn(
                      'w-20 h-20 rounded-full flex items-center justify-center transition-all',
                      recording
                        ? 'bg-[#FF6B6B] text-white shadow-lg shadow-[#FF6B6B]/30 animate-pulse'
                        : 'bg-gradient-to-br from-[#FF8C69] to-[#FFB347] text-white shadow-lg shadow-[#FF8C69]/30 hover:shadow-xl active:scale-95',
                      !mediaRecorderSupported &&
                        'bg-[#F0E6DD] text-[#B0A59F] cursor-not-allowed shadow-none',
                    )}
                    aria-label={recording ? '停止录音' : '开始录音'}
                  >
                    <Mic size={32} />
                  </button>
                  <div className="mt-3 text-lg font-medium text-[#4A3F3A]">
                    {formatDuration(recording ? recordDuration : duration)}
                  </div>
                  <div className="mt-1 text-xs text-[#8B7D75]">
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
                  <label className="block text-sm font-medium text-[#4A3F3A]">
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
                  className="w-full px-4 py-3 rounded-xl bg-[#FFFAF7] border border-[#F0E6DD] text-[#4A3F3A] placeholder:text-[#B0A59F] focus:outline-none focus:border-[#FF8C69] focus:ring-2 focus:ring-[#FF8C69]/20 transition-all resize-none"
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
