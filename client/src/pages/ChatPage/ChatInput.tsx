import { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Mic, Send, Image as ImageIcon, Video, X } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { cn } from '@client/src/utils/cn';
import { uploadApi, messagesApi } from '@client/src/api';
import type { XinyuMessage } from '@shared/api.interface';

interface ChatInputProps {
  bindingId: string;
  receiverUserId: string;
  onMessageSent: (msg: XinyuMessage) => void;
}

type RecordingState = 'idle' | 'recording' | 'cancel-swipe';

export default function ChatInput({ bindingId, receiverUserId, onMessageSent }: ChatInputProps) {
  const [text, setText] = useState('');
  const [showPlus, setShowPlus] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordDuration, setRecordDuration] = useState(0);
  const [sending, setSending] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startYRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<unknown>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    setRecordDuration(0);
    stopTimer();
    timerRef.current = window.setInterval(() => {
      setRecordDuration((d) => d + 1);
    }, 1000);
  }, [stopTimer]);

  // blob 转 base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // 去掉 data:...;base64, 前缀
        const base64 = result.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // 尝试语音转文字
  const trySpeechToText = useCallback(async (audioBlob: Blob): Promise<string> => {
    try {
      const SpeechRecognition =
        (window as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
          .SpeechRecognition ||
        (window as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
      if (!SpeechRecognition) return '';

      // 注意：浏览器 SpeechRecognition 通常基于实时麦克风输入，不能直接传音频文件
      // 这里作为降级，返回空字符串（真实项目可用服务端 ASR）
      return '';
    } catch {
      return '';
    }
  }, []);

  // 发送语音消息
  const sendVoiceMessage = useCallback(
    async (audioBlob: Blob, duration: number) => {
      try {
        setSending(true);
        const base64 = await blobToBase64(audioBlob);
        const fileName = `voice_${Date.now()}.webm`;
        const uploadRes = await uploadApi.uploadFile({
          fileName,
          fileBase64: base64,
          type: 'voice',
        });

        // 尝试转文字
        const transcript = await trySpeechToText(audioBlob);

        const msg = await messagesApi.sendFileMessage({
          bindingId,
          receiverUserId,
          messageType: 'voice',
          fileUrl: uploadRes.fileUrl,
          content: transcript,
          duration: Math.round(duration),
        });
        onMessageSent(msg);
      } catch (err) {
        const msg = err instanceof Error ? err.message : '发送失败';
        toast.error(msg);
        logger.error(`sendVoiceMessage error: ${msg}`);
      } finally {
        setSending(false);
      }
    },
    [bindingId, receiverUserId, onMessageSent, trySpeechToText]
  );

  // 开始录音
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (recordingState === 'cancel-swipe') {
          setRecordingState('idle');
          return;
        }
        if (blob.size > 0 && recordDuration > 0) {
          await sendVoiceMessage(blob, recordDuration);
        }
        setRecordingState('idle');
      };

      recorder.start();
      startTimer();
      setRecordingState('recording');
      if (navigator.vibrate) navigator.vibrate(50);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '无法访问麦克风';
      toast.error(msg);
      logger.error(`startRecording error: ${msg}`);
      setRecordingState('idle');
    }
  }, [startTimer, sendVoiceMessage, recordDuration, recordingState]);

  // 结束录音
  const stopRecording = useCallback(() => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, [stopTimer]);

  // 长按处理
  const handleTouchStart = (e: React.TouchEvent) => {
    if (text.trim()) return; // 有文字时是发送按钮
    e.preventDefault();
    startYRef.current = e.touches[0].clientY;
    startRecording();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (recordingState !== 'recording' && recordingState !== 'cancel-swipe') return;
    const currentY = e.touches[0].clientY;
    const diff = startYRef.current - currentY;
    if (diff > 60) {
      if (recordingState !== 'cancel-swipe') setRecordingState('cancel-swipe');
    } else {
      if (recordingState !== 'recording') setRecordingState('recording');
    }
  };

  const handleTouchEnd = () => {
    if (recordingState === 'idle') return;
    stopRecording();
  };

  // 鼠标事件（桌面端支持）
  const handleMouseDown = (e: React.MouseEvent) => {
    if (text.trim()) return;
    e.preventDefault();
    startYRef.current = e.clientY;
    startRecording();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (recordingState !== 'recording' && recordingState !== 'cancel-swipe') return;
    const diff = startYRef.current - e.clientY;
    if (diff > 60) {
      if (recordingState !== 'cancel-swipe') setRecordingState('cancel-swipe');
    } else {
      if (recordingState !== 'recording') setRecordingState('recording');
    }
  };

  const handleMouseUp = () => {
    if (recordingState === 'idle') return;
    stopRecording();
  };

  const handleMouseLeave = () => {
    if (recordingState !== 'idle') {
      stopRecording();
    }
  };

  useEffect(() => {
    return () => {
      stopTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [stopTimer]);

  // 发送文字
  const handleSendText = async () => {
    if (!text.trim() || sending) return;
    try {
      setSending(true);
      const msg = await messagesApi.sendTextMessage({
        bindingId,
        receiverUserId,
        content: text.trim(),
      });
      setText('');
      setShowPlus(false);
      onMessageSent(msg);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '发送失败';
      toast.error(msg);
      logger.error(`sendText error: ${msg}`);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  // 选择图片/视频
  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'image' | 'video'
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error('文件不能超过20MB');
      return;
    }
    try {
      setSending(true);
      setShowPlus(false);
      const base64 = await blobToBase64(file);
      const uploadRes = await uploadApi.uploadFile({
        fileName: file.name,
        fileBase64: base64,
        type,
      });
      const msg = await messagesApi.sendFileMessage({
        bindingId,
        receiverUserId,
        messageType: type,
        fileUrl: uploadRes.fileUrl,
      });
      onMessageSent(msg);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '发送失败';
      toast.error(msg);
      logger.error(`sendFile error: ${msg}`);
    } finally {
      setSending(false);
    }
  };

  const hasText = text.trim().length > 0;

  return (
    <div className="relative">
      {/* + 号展开面板 */}
      {showPlus && (
        <div className="absolute bottom-full left-0 right-0 bg-card border-t border-border p-4 space-y-3 animate-fadeIn">
          <div className="flex gap-6">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ImageIcon size={24} className="text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">图片</span>
            </button>
            <button
              onClick={() => videoInputRef.current?.click()}
              className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                <Video size={24} className="text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">视频</span>
            </button>
          </div>
        </div>
      )}

      {/* 录音提示遮罩 */}
      {recordingState !== 'idle' && (
        <div className="absolute bottom-full left-0 right-0 h-full w-full bg-black/30 flex items-center justify-center pointer-events-none">
          <div
            className={cn(
              'px-8 py-6 rounded-3xl text-center transition-all',
              recordingState === 'cancel-swipe' ? 'bg-destructive/90' : 'bg-primary/90'
            )}
          >
            <div className="text-white text-4xl font-bold mb-2">
              {Math.floor(recordDuration / 60)}:
              {(recordDuration % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-white/90 text-sm">
              {recordingState === 'cancel-swipe' ? '松开取消发送' : '松开发送，上滑取消'}
            </div>
          </div>
        </div>
      )}

      {/* 输入栏 */}
      <div className="flex items-end gap-3 p-4 bg-card border-t border-border">
        <button
          onClick={() => setShowPlus((s) => !s)}
           className={cn(
             'w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95',
             showPlus ? 'bg-primary text-white' : 'bg-secondary text-foreground'
           )}
           aria-label="更多"
         >
           <Plus size={22} />
        </button>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="说点什么..."
          rows={1}
          className="flex-1 px-4 py-3 rounded-xl bg-secondary text-foreground text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground max-h-32"
          style={{ minHeight: 44 }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
          }}
        />

        {hasText ? (
          <button
            onClick={handleSendText}
            disabled={sending}
             className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center flex-shrink-0 shadow-md active:scale-95 transition-all disabled:opacity-50"
             aria-label="发送"
           >
             <Send size={20} />
          </button>
        ) : (
          <button
             className={cn(
               'w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-all select-none',
               recordingState !== 'idle'
                 ? 'bg-destructive text-white'
                 : 'bg-gradient-to-br from-primary to-secondary text-white shadow-md'
             )}
             aria-label="语音"
             onTouchStart={handleTouchStart}
             onTouchMove={handleTouchMove}
             onTouchEnd={handleTouchEnd}
             onMouseDown={handleMouseDown}
             onMouseMove={handleMouseMove}
             onMouseUp={handleMouseUp}
             onMouseLeave={handleMouseLeave}
           >
             {recordingState !== 'idle' ? <X size={22} /> : <Mic size={22} />}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'image')}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'video')}
      />
    </div>
  );
}
