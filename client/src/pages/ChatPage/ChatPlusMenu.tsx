import { Image as ImageIcon, Video } from 'lucide-react';
import { useRef } from 'react';

interface ChatPlusMenuProps {
  visible: boolean;
  onSelectImage: (file: File) => void;
  onSelectVideo: (file: File) => void;
}

export default function ChatPlusMenu({
  visible,
  onSelectImage,
  onSelectVideo,
}: ChatPlusMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!visible) return null;

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    handler: (file: File) => void
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) handler(file);
  };

  return (
    <div
      className="absolute bottom-full left-0 right-0 p-4"
      style={{
        background: 'rgba(255, 255, 255, 0.9)',
        WebkitBackdropFilter: 'blur(20px)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.7)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.7)',
        borderRight: '1px solid rgba(255, 255, 255, 0.7)',
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
      }}
    >
      <div className="flex gap-8">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(255, 140, 105, 0.12)',
              border: '1px solid rgba(255, 140, 105, 0.2)',
            }}
          >
            <ImageIcon size={24} style={{ color: '#FF8C69' }} />
          </div>
          <span className="text-sm" style={{ color: '#999999' }}>
            图片
          </span>
        </button>
        <button
          onClick={() => videoInputRef.current?.click()}
          className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(255, 140, 105, 0.12)',
              border: '1px solid rgba(255, 140, 105, 0.2)',
            }}
          >
            <Video size={24} style={{ color: '#FF8C69' }} />
          </div>
          <span className="text-sm" style={{ color: '#999999' }}>
            视频
          </span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, onSelectImage)}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, onSelectVideo)}
      />
    </div>
  );
}
