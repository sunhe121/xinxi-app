import { useState, useRef, useEffect } from 'react';
import { Mic, X, Check } from 'lucide-react';
import { toast } from 'sonner';
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

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

interface LanguageStyleRecorderProps {
  open: boolean;
  editingSample: LanguageSample | null;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    title: string;
    category: LanguageSample['category'];
    transcript: string;
    audioUrl: string;
    duration: number;
  }) => Promise<void>;
  saving: boolean;
}

export default function LanguageStyleRecorder({
  open,
  editingSample,
  onClose,
  onSave,
  saving,
}: LanguageStyleRecorderProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<LanguageSample['category']>('daily');
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [duration, setDuration] = useState(0);

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

  // 打开时初始化数据
  useEffect(() => {
    if (open) {
      if (editingSample) {
        setTitle(editingSample.title);
        setCategory(editingSample.category);
        setTranscript(editingSample.transcript);
        setAudioUrl(editingSample.audioUrl ?? '');
        setDuration(editingSample.duration);
      } else {
        setTitle('');
        setCategory('daily');
        setTranscript('');
        setAudioUrl('');
        setDuration(0);
      }
      setRecordDuration(0);
      setRecording(false);
    }
  }, [open, editingSample]);

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
        stream.getTracks().forEach((track) => track.stop());
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

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('请输入标题');
      return;
    }
    if (!transcript.trim()) {
      toast.error('请输入或录制语音文字内容');
      return;
    }
    await onSave({
      id: editingSample?.id,
      title: title.trim(),
      category,
      transcript: transcript.trim(),
      audioUrl,
      duration,
    });
  };

  const handleClose = () => {
    if (recording) {
      stopRecording();
    }
    stopSpeechRecognition();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-[480px] bg-white/90 backdrop-blur-2xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden animate-slide-up border-t border-white/80">
        {/* 弹层头部 */}
        <div className="sticky top-0 bg-white/70 backdrop-blur-xl px-5 py-4 flex items-center justify-between border-b border-white/60 z-10">
          <button
            onClick={handleClose}
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

        <div className="p-5 space-y-5 overflow-y-auto pb-8">
          {/* 标题输入 */}
          <div>
            <label className="block text-sm font-medium text-[#333] mb-2">
              标题
            </label>
            <div className="glass-input h-[52px] px-4 flex items-center">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="给这段语音起个名字"
                className="w-full bg-transparent text-base text-[#333] placeholder:text-[#999] focus:outline-none"
              />
            </div>
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
                    'px-4 h-9 rounded-full text-sm font-medium transition-all',
                    category === cat.value
                      ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white active:scale-95'
                      : 'bg-white/60 text-[#999] border border-white/80 hover:border-[#FF8C69]/50 active:scale-95',
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
                    : 'bg-gradient-to-br from-[#FF8C69] to-[#FF6B6B] text-white shadow-lg shadow-[#FF6B6B]/30 active:scale-95',
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
              className="glass-input w-full px-4 py-3 text-base text-[#333] placeholder:text-[#999] resize-none leading-[1.7] focus:outline-none"
            />
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
