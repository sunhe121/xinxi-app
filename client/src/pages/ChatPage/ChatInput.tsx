import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Send, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { cn } from '@client/src/utils/cn';
import { uploadApi, messagesApi } from '@client/src/api';
import type { XinyuMessage } from '@shared/api.interface';
import ChatPlusMenu from './ChatPlusMenu';

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

  // 监听快捷短语事件
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setText(customEvent.detail);
    };
    window.addEventListener('chat-quick-phrase', handler);
    return () => window.removeEventListener('chat-quick-phrase', handler);
  }, []);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startYRef = useRef<number>(0);

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
        const base64 = result.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // 发送文件消息（图片/视频/语音）
  const sendFileMessage = useCallback(
    async (
      fileBase64: string,
      fileName: string,
      type: 'image' | 'video' | 'voice',
      duration?: number,
      content?: string
    ) => {
      try {
        setSending(true);
        const uploadRes = await uploadApi.uploadFile({
          fileName,
          fileBase64,
          type,
        });

        const msg = await messagesApi.sendFileMessage({
          bindingId,
          receiverUserId,
          messageType: type,
          fileUrl: uploadRes.fileUrl,
          content,
          duration,
        });
        onMessageSent(msg);
      } catch (err) {
        const msg = err instanceof Error ? err.message : '发送失败';
        toast.error(msg);
        logger.error(`sendFileMessage error: ${msg}`);
      } finally {
        setSending(false);
      }
    },
    [bindingId, receiverUserId, onMessageSent]
  );

  // 发送语音消息
  const sendVoiceMessage = useCallback(
    async (audioBlob: Blob, duration: number) => {
      const base64 = await blobToBase64(audioBlob);
      const fileName = `voice_${Date.now()}.webm`;
      await sendFileMessage(base64, fileName, 'voice', Math.round(duration), '');
    },
    [sendFileMessage]
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
    if (text.trim()) return;
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

  const handleSelectImage = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error('文件不能超过20MB');
      return;
    }
    try {
      setSending(true);
      setShowPlus(false);
      const base64 = await blobToBase64(file);
      await sendFileMessage(base64, file.name, 'image');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '发送失败';
      toast.error(msg);
      logger.error(`sendImage error: ${msg}`);
    } finally {
      setSending(false);
    }
  };

  const handleSelectVideo = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error('文件不能超过20MB');
      return;
    }
    try {
      setSending(true);
      setShowPlus(false);
      const base64 = await blobToBase64(file);
      await sendFileMessage(base64, file.name, 'video');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '发送失败';
      toast.error(msg);
      logger.error(`sendVideo error: ${msg}`);
    } finally {
      setSending(false);
    }
  };

  const hasText = text.trim().length > 0;

  return (
    <div className="relative">
      {/* + 号展开面板 */}
      <ChatPlusMenu
        visible={showPlus}
        onSelectImage={handleSelectImage}
        onSelectVideo={handleSelectVideo}
      />

      {/* 录音提示遮罩 */}
      {recordingState !== 'idle' && (
        <div
          className="absolute bottom-full left-0 right-0 h-full w-full flex items-center justify-center pointer-events-none"
          style={{ background: 'rgba(0, 0, 0, 0.3)' }}
        >
          <div
            className="px-8 py-6 text-center transition-all rounded-3xl"
            style={{
              background:
                recordingState === 'cancel-swipe'
                  ? 'rgba(255, 107, 107, 0.9)'
                  : 'rgba(255, 140, 105, 0.9)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            <div className="text-white text-4xl font-bold mb-2">
              {Math.floor(recordDuration / 60)}:
              {(recordDuration % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-white/90 text-sm" style={{ lineHeight: 1.5 }}>
              {recordingState === 'cancel-swipe' ? '松开取消发送' : '松开发送，上滑取消'}
            </div>
          </div>
        </div>
      )}

      {/* 输入栏 */}
      <div
        className="flex items-end gap-3"
        style={{
          padding: '12px 16px',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          background: 'rgba(255, 255, 255, 0.9)',
          WebkitBackdropFilter: 'blur(20px)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.8)',
        }}
      >
        <button
          onClick={() => setShowPlus((s) => !s)}
          className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95'
          )}
          style={
            showPlus
              ? {
                  background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                }
              : {
                  background: 'rgba(255, 255, 255, 0.7)',
                  WebkitBackdropFilter: 'blur(10px)',
                  backdropFilter: 'blur(10px)',
                  color: '#FF8C69',
                  border: '1px solid rgba(255, 140, 105, 0.25)',
                }
          }
          aria-label="更多"
        >
          <Plus size={20} />
        </button>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="说点什么..."
          rows={1}
          className="flex-1 px-4 text-base resize-none focus:outline-none transition-all placeholder:text-[#999] max-h-32"
          style={{
            minHeight: 44,
            height: 44,
            paddingTop: 12,
            paddingBottom: 12,
            borderRadius: 22,
            background: 'rgba(255, 255, 255, 0.6)',
            WebkitBackdropFilter: 'blur(10px)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 140, 105, 0.2)',
            color: '#333',
          }}
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
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
              border: 'none',
            }}
            aria-label="发送"
          >
            <Send size={18} />
          </button>
        ) : (
          <button
            className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-all select-none'
            )}
            style={
              recordingState !== 'idle'
                ? {
                    background: '#FF6B6B',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                  }
                : {
                    background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                  }
            }
            aria-label="语音"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {recordingState !== 'idle' ? <X size={20} /> : <Mic size={20} />}
          </button>
        )}
      </div>
    </div>
  );
}
