import { useState, useRef, useEffect } from 'react';
import { Play, Pause, X, Image as ImageIcon, Video } from 'lucide-react';
import { Image } from '@client/src/components/ui/image';
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
          <p className="text-base whitespace-pre-wrap break-words" style={{ lineHeight: 1.7 }}>
            {message.content}
          </p>
        );
      case 'image':
        return (
          <div
            className="relative cursor-pointer overflow-hidden"
            style={{ borderRadius: '16px' }}
            onClick={() => setShowImage(true)}
          >
            <Image
              src={message.fileUrl}
              alt="图片消息"
              className="max-w-[220px] max-h-[280px] object-cover"
              style={{ borderRadius: '16px' }}
            />
          </div>
        );
      case 'video':
        return (
          <div
            className="relative cursor-pointer overflow-hidden"
            style={{ borderRadius: '16px' }}
            onClick={() => setShowImage(true)}
          >
            <Image
              src={message.fileUrl}
              alt="视频消息"
              className="max-w-[220px] max-h-[280px] object-cover"
              style={{ borderRadius: '16px' }}
            />
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255, 255, 255, 0.8)' }}
              >
                <Play size={20} style={{ color: '#FF8C69' }} fill="currentColor" className="ml-0.5" />
              </div>
            </div>
            {message.duration > 0 && (
              <span
                className="absolute bottom-2 right-2 text-xs text-white px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(0,0,0,0.5)' }}
              >
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
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={
                isMine
                  ? { background: 'rgba(255, 255, 255, 0.25)' }
                  : { background: 'rgba(255, 140, 105, 0.15)' }
              }
            >
              {playing ? (
                <Pause size={16} fill="currentColor" style={{ color: isMine ? '#FFFFFF' : '#FF8C69' }} />
              ) : (
                <Play
                  size={16}
                  fill="currentColor"
                  style={{
                    color: isMine ? '#FFFFFF' : '#FF8C69',
                    marginLeft: '2px',
                  }}
                />
              )}
            </div>
            <div className="flex items-center gap-1 flex-1">
              {[...Array(Math.min(5, Math.max(2, Math.ceil(message.duration / 3))))].map((_, i) => (
                <div
                  key={i}
                  className={'rounded-full ' + (playing ? 'animate-pulse' : '')}
                  style={{
                    width: 3,
                    height: 12 + (i % 3) * 4,
                    backgroundColor: isMine ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 140, 105, 0.5)',
                  }}
                />
              ))}
            </div>
            <span
              className="text-xs flex-shrink-0"
              style={{ color: isMine ? 'rgba(255, 255, 255, 0.85)' : '#999999' }}
            >
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
      <div className={'flex gap-2 ' + (isMine ? 'flex-row-reverse' : 'flex-row')}>
        {!isMine && (
          <div
            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
            style={{
              background: 'rgba(255, 140, 105, 0.1)',
              boxShadow: '0 2px 6px rgba(255, 107, 107, 0.12)',
            }}
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt={partnerName} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon size={14} style={{ color: '#FF8C69' }} />
            )}
          </div>
        )}
        <div
          className={
            'flex flex-col max-w-[78%] gap-1 ' + (isMine ? 'items-end' : 'items-start')
          }
        >
          <div
            className="px-4 py-3"
            style={
              isMine
                ? {
                    background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                    color: '#FFFFFF',
                    borderRadius: '20px',
                    borderTopRightRadius: '8px',
                    boxShadow: '0 4px 12px rgba(255, 107, 107, 0.2)',
                  }
                : {
                    background: 'rgba(255, 255, 255, 0.85)',
                    WebkitBackdropFilter: 'blur(20px)',
                    backdropFilter: 'blur(20px)',
                    color: '#333333',
                    borderRadius: '20px',
                    borderTopLeftRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.9)',
                  }
            }
          >
            {renderContent()}
          </div>
          <span className="text-xs" style={{ color: '#999999' }}>
            {formatTime(message.createdAt)}
          </span>
        </div>
      </div>

      {/* 图片/视频大图查看 */}
      {showImage && (message.messageType === 'image' || message.messageType === 'video') && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.9)' }}
          onClick={() => setShowImage(false)}
        >
          <button
            className="absolute top-6 right-6 w-11 h-11 rounded-full flex items-center justify-center text-white z-10"
            style={{ background: 'rgba(255, 255, 255, 0.2)' }}
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
