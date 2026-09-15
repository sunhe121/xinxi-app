import { useState, useRef, useEffect } from 'react';
import { Play, Pause, X, Image as ImageIcon, Video } from 'lucide-react';
import { Image } from '@client/src/components/ui/image';
import { cn } from '@client/src/utils/cn';
import type { XinyuMessage } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

interface MessageItemProps {
  message: XinyuMessage;
  isMine: boolean;
  avatarUrl: string;
  partnerName: string;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m > 0) return `${m}'${s.toString().padStart(2, '0')}"`;
  return `${s}"`;
}

export default function MessageItem({
  message,
  isMine,
  avatarUrl,
  partnerName,
}: MessageItemProps) {
  const [playing, setPlaying] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayVoice = () => {
    if (!message.fileUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(message.fileUrl);
      audioRef.current.onended = () => setPlaying(false);
      audioRef.current.onerror = () => {
        setPlaying(false);
        logger.error('语音播放失败');
      };
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {
        setPlaying(false);
      });
      setPlaying(true);
    }
  };

  const renderContent = () => {
    switch (message.messageType) {
      case 'text':
        return (
          <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        );
      case 'image':
        return (
          <div
            className="relative cursor-pointer overflow-hidden rounded-2xl"
            onClick={() => setShowImage(true)}
          >
            <Image
              src={message.fileUrl}
              alt="图片消息"
              className="max-w-[220px] max-h-[280px] object-cover rounded-2xl"
            />
          </div>
        );
      case 'video':
        return (
          <div
            className="relative cursor-pointer overflow-hidden rounded-2xl"
            onClick={() => setShowImage(true)}
          >
            <Image
              src={message.fileUrl}
              alt="视频消息"
              className="max-w-[220px] max-h-[280px] object-cover rounded-2xl"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
                <Play size={20} className="text-primary ml-0.5" fill="currentColor" />
              </div>
            </div>
            {message.duration > 0 && (
              <span className="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 py-0.5 rounded-full">
                {formatDuration(message.duration)}
              </span>
            )}
          </div>
        );
      case 'voice':
        return (
          <button
            onClick={handlePlayVoice}
             className="flex items-center gap-3 min-w-[120px] active:scale-95 transition-transform"
           >
             <div
               className={cn(
                 'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                 isMine ? 'bg-white/20' : 'bg-primary/10'
               )}
             >
               {playing ? (
                 <Pause size={18} className={isMine ? 'text-white' : 'text-primary'} fill="currentColor" />
               ) : (
                 <Play size={18} className={isMine ? 'text-white ml-0.5' : 'text-primary ml-0.5'} fill="currentColor" />
              )}
            </div>
             <div className="flex items-center gap-1.5 flex-1">
               {[...Array(Math.min(5, Math.max(2, Math.ceil(message.duration / 3))))].map((_, i) => (
                 <div
                   key={i}
                   className={cn(
                     'rounded-full',
                     isMine ? 'bg-white/60' : 'bg-primary/40',
                     playing ? 'animate-pulse' : ''
                   )}
                   style={{
                     width: 4,
                     height: 14 + (i % 3) * 5,
                   }}
                 />
               ))}
             </div>
             <span className={cn('text-sm flex-shrink-0', isMine ? 'text-white/80' : 'text-muted-foreground')}>
              {formatDuration(message.duration)}
            </span>
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className={cn('flex gap-2', isMine ? 'flex-row-reverse' : 'flex-row')}>
        {!isMine && (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={partnerName} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon size={18} className="text-primary" />
            )}
          </div>
        )}
        <div className={cn('flex flex-col max-w-[78%] gap-1.5', isMine ? 'items-end' : 'items-start')}>
          <div
            className={cn(
              'px-4 py-3 rounded-3xl shadow-sm',
              isMine
                ? 'bg-gradient-to-br from-primary to-secondary text-white rounded-tr-md'
                : 'bg-card text-foreground rounded-tl-md'
            )}
          >
            {renderContent()}
          </div>
          <div className={cn('flex items-center gap-2', isMine ? 'flex-row-reverse' : 'flex-row')}>
            <span className="text-xs text-muted-foreground">
              {formatTime(message.createdAt)}
            </span>
            {isMine && (
              <span className="text-xs text-muted-foreground/70">
                已收集，将在每日报告中送达
              </span>
            )}
          </div>
        </div>
        {isMine && null}
      </div>

      {/* 图片/视频大图查看 */}
      {showImage && (message.messageType === 'image' || message.messageType === 'video') && (
        <div
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          onClick={() => setShowImage(false)}
        >
          <button
             className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white z-10"
            onClick={() => setShowImage(false)}
            aria-label="关闭"
          >
             <X size={24} />
          </button>
          {message.messageType === 'image' ? (
            <Image
              src={message.fileUrl}
              alt="大图"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <video
              src={message.fileUrl}
              controls
              className="max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </>
  );
}
