import { useState } from 'react';
import {
  X,
  Send,
  Loader2,
  MessageCircleHeart,
} from 'lucide-react';
import { toast } from 'sonner';
import { messagesApi } from '@client/src/api';

const THINK_OF_YOU_TEMPLATES = [
  '想你了',
  '注意身体',
  '早点休息',
  '今天开心吗',
];

interface ThinkOfYouSheetProps {
  open: boolean;
  onClose: () => void;
  targetUserId: string;
  targetName: string;
}

export function ThinkOfYouSheet({
  open,
  onClose,
  targetUserId,
  targetName,
}: ThinkOfYouSheetProps) {
  const [thinkContent, setThinkContent] = useState('');
  const [thinkSending, setThinkSending] = useState(false);

  const handleSendThinkOfYou = async (
    content: string,
    type: 'text' | 'template' = 'text',
  ) => {
    if (!targetUserId) return;
    setThinkSending(true);
    try {
      await messagesApi.sendThinkOfYou(targetUserId, content, type);
      toast.success('已记下啦💌 会整合到今晚的关心报告里哦');
      onClose();
      setThinkContent('');
    } catch {
      toast.error('发送失败，请重试');
    } finally {
      setThinkSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 animate-fadeIn"
        onClick={onClose}
      />
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-[28px] p-6 pb-8 animate-slideUp max-w-[480px] mx-auto"
        style={{
          background: 'rgba(255, 248, 243, 0.98)',
          WebkitBackdropFilter: 'blur(20px)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.8)',
        }}
      >
        {/* 顶部把手 */}
        <div className="w-10 h-1 bg-[#FFD4C4] rounded-full mx-auto mb-5" />

        {/* 标题 + 关闭 */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-[#333]">
            <MessageCircleHeart size={22} className="text-[#FF8C69]" />
            对TA说句话
          </h2>
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-white/80 border border-white/80 flex items-center justify-center text-[#999] active:scale-95 transition-transform"
            aria-label="关闭"
          >
            <X size={22} />
          </button>
        </div>

        <p className="text-sm text-[#999] mb-4">
          选一句发给 {targetName || '家人'}：
        </p>

        {/* 模板按钮 */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {THINK_OF_YOU_TEMPLATES.map((tpl) => (
            <button
              key={tpl}
              onClick={() => handleSendThinkOfYou(tpl, 'template')}
              disabled={thinkSending}
              className="h-[52px] bg-white/70 border border-white/80 text-[#333] rounded-2xl font-medium text-base active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {thinkSending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  发送中...
                </>
              ) : (
                tpl
              )}
            </button>
          ))}
        </div>

        {/* 自定义输入 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#333]">
            自定义一句话
          </label>
          <div className="flex gap-2 items-end">
            <textarea
              value={thinkContent}
              onChange={(e) => setThinkContent(e.target.value)}
              placeholder="想说点什么..."
              rows={2}
              maxLength={100}
              className="flex-1 px-4 py-3 rounded-2xl bg-white/70 border border-white/80 text-[#333] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FF8C69]/30 focus:border-[#FF8C69] transition-all placeholder:text-[#999]"
            />
            <button
              onClick={() => handleSendThinkOfYou(thinkContent, 'text')}
              disabled={!thinkContent.trim() || thinkSending}
              className="w-12 h-12 rounded-full text-white flex items-center justify-center flex-shrink-0 shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
              aria-label="发送"
            >
              {thinkSending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
}
