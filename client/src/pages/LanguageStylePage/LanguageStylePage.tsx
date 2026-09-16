import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Mic,
  Plus,
  Sparkles,
  Tag,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { languageStyleApi } from '@client/src/api';
import type { LanguageSample } from '@shared/api.interface';
import { cn } from '@client/src/utils/cn';
import { logger } from '@lark-apaas/client-toolkit/logger';
import LanguageStyleRecorder from './LanguageStyleRecorder';
import SampleItem from './SampleItem';
import {
  StyleSelector,
  RecordingGuide,
  StyleProfileCard,
  STYLE_OPTIONS,
} from './StyleComponents';

type StyleProfile = {
  profile: string;
  keywords: string[];
  tone: string;
} | null;

const PROFILE_STORAGE_KEY = 'xinyu_language_profile';

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
  const [saving, setSaving] = useState(false);

  // 播放状态
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playProgress, setPlayProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const playStartTimeRef = useRef<number>(0);
  const playDurationRef = useRef<number>(0);

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
        try {
          localStorage.setItem(
            PROFILE_STORAGE_KEY,
            JSON.stringify(profileData)
          );
        } catch {
          // ignore
        }
      } else {
        try {
          const cached = localStorage.getItem(PROFILE_STORAGE_KEY);
          setProfile(cached ? JSON.parse(cached) : null);
        } catch {
          setProfile(null);
        }
      }
    } catch (error) {
      logger.error('加载数据失败', String(error));
      toast.error('加载失败，请稍后重试');
      try {
        const cached = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (cached) setProfile(JSON.parse(cached));
      } catch {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    return () => {
      stopPlayback();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadData]);

  // 播放控制
  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setPlayingId(null);
    setPlayProgress(0);
  }, []);

  const startProgressTimer = useCallback((duration: number) => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }
    playStartTimeRef.current = Date.now();
    playDurationRef.current = duration;
    setPlayProgress(0);

    progressTimerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - playStartTimeRef.current) / 1000;
      const progress = duration > 0 ? elapsed / duration : 0;
      if (progress >= 1) {
        setPlayProgress(1);
        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }
        setPlayingId(null);
      } else {
        setPlayProgress(progress);
      }
    }, 100);
  }, []);

  const handleTogglePlay = useCallback(
    (sample: LanguageSample) => {
      if (playingId === sample.id) {
        stopPlayback();
        return;
      }

      stopPlayback();

      const duration =
        sample.duration || Math.max(3, sample.transcript.length / 4);

      if (sample.audioUrl) {
        const audio = new Audio(sample.audioUrl);
        audioRef.current = audio;
        audio.addEventListener('ended', () => stopPlayback());
        audio.addEventListener('error', () => {
          toast.error('音频播放失败');
          stopPlayback();
        });
        audio.addEventListener('loadedmetadata', () => {
          const actualDuration = audio.duration || duration;
          playDurationRef.current = actualDuration;
          startProgressTimer(actualDuration);
        });
        audio.play().catch(() => {
          toast.error('无法播放音频');
          stopPlayback();
        });
        setPlayingId(sample.id);
        startProgressTimer(duration);
      } else {
        if (
          typeof window === 'undefined' ||
          !('speechSynthesis' in window) ||
          !sample.transcript
        ) {
          toast.error('当前浏览器不支持语音播放');
          return;
        }

        const utterance = new SpeechSynthesisUtterance(sample.transcript);
        utterance.lang = 'zh-CN';

        const voices = window.speechSynthesis.getVoices();
        const chineseVoice =
          voices.find(
            (v) => v.lang.startsWith('zh') && v.name.includes('女')
          ) ||
          voices.find((v) => v.lang.startsWith('zh')) ||
          voices[0];
        if (chineseVoice) {
          utterance.voice = chineseVoice;
        }

        utterance.onend = () => stopPlayback();
        utterance.onerror = () => stopPlayback();

        window.speechSynthesis.speak(utterance);
        setPlayingId(sample.id);
        startProgressTimer(duration);
      }
    },
    [playingId, startProgressTimer, stopPlayback]
  );

  // 打开录制弹层
  const openRecorder = (sample?: LanguageSample) => {
    setEditingSample(sample || null);
    setShowRecorder(true);
  };

  const closeRecorder = () => {
    setShowRecorder(false);
  };

  // 保存样本
  const handleSave = async (data: {
    id?: string;
    title: string;
    category: LanguageSample['category'];
    transcript: string;
    audioUrl: string;
    duration: number;
  }) => {
    setSaving(true);
    try {
      if (data.id) {
        const updated = await languageStyleApi.updateSample(data.id, {
          title: data.title,
          transcript: data.transcript,
          audioUrl: data.audioUrl,
          duration: data.duration,
        });
        setSamples((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s))
        );
        toast.success('样本已更新');
      } else {
        const created = await languageStyleApi.createSample({
          category: data.category,
          title: data.title,
          transcript: data.transcript,
          audioUrl: data.audioUrl,
          duration: data.duration,
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
    stopPlayback();
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
    stopPlayback();
    try {
      const result = await languageStyleApi.analyze();
      setProfile(result);
      try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(result));
      } catch {
        // ignore
      }
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
    if (!style) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        style.sample.replace(/"/g, '')
      );
      utterance.lang = 'zh-CN';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
    toast.info(`正在试听「${style.name}」风格...`);
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
        <h1 className="text-lg font-semibold text-[#333]">语言风格</h1>
      </div>

      {/* 风格画像卡片 */}
      <StyleProfileCard
        profile={profile}
        canAnalyze={canAnalyze}
        analyzing={analyzing}
        onReanalyze={handleAnalyze}
      />

      {/* 录制引导卡片 */}
      <RecordingGuide
        sampleCount={samples.length}
        onRecord={() => openRecorder()}
      />

      {/* 风格选择 */}
      <StyleSelector
        selectedStyle={selectedStyle}
        onSelect={setSelectedStyle}
      />

      {/* 预览/试听按钮 */}
      <button
        onClick={handlePreview}
        className="btn-gradient w-full flex items-center justify-center gap-2"
      >
        <Mic size={18} />
        试听效果
      </button>

      {/* 保存按钮 */}
      <button onClick={handleSaveStyle} className="btn-gradient w-full mt-4">
        保存设置
      </button>

      {/* 我的语音样本 */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Tag size={18} className="text-[#FF8C69]" />
          <h2 className="text-base font-semibold text-[#333]">
            我的语音样本
          </h2>
          <span className="text-xs text-[#999] ml-auto">
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
              <SampleItem
                key={sample.id}
                sample={sample}
                onEdit={openRecorder}
                onDelete={handleDelete}
                isPlaying={playingId === sample.id}
                progress={playingId === sample.id ? playProgress : 0}
                onTogglePlay={handleTogglePlay}
              />
            ))}
          </div>
        )}

        <button
          onClick={() => openRecorder()}
          className={cn(
            'w-full mt-4 h-[52px] rounded-2xl flex items-center justify-center gap-2 font-medium transition-all active:scale-[0.98]',
            samples.length < 3
              ? 'bg-white/60 backdrop-blur-sm border border-white/80 text-[#FF8C69]'
              : 'bg-white/30 border border-white/50 text-[#999] cursor-not-allowed'
          )}
          disabled={samples.length >= 3}
        >
          <Plus size={18} />
          录制新样本
        </button>
      </div>

      {/* 开始分析按钮 */}
      {canAnalyze && !profile && (
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="btn-gradient w-full mt-6 flex items-center justify-center gap-2"
        >
          {analyzing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              分析中，请稍候...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              开始分析语言风格
            </>
          )}
        </button>
      )}

      {/* 录制弹层 */}
      <LanguageStyleRecorder
        open={showRecorder}
        editingSample={editingSample}
        onClose={closeRecorder}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
