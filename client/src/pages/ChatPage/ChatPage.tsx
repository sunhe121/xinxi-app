import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, User, MessageCircleHeart, Loader2, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { useUser, getDisplayName } from '@client/src/hooks/useUser';
import { messagesApi } from '@client/src/api';
import type { XinyuMessage, FamilyMember } from '@shared/api.interface';
import { Image } from '@client/src/components/ui/image';
import MessageItem from './MessageItem';
import ChatInput from './ChatInput';

export default function ChatPage() {
  const { familyId } = useParams<{ familyId: string }>();
  const navigate = useNavigate();
  const { user, family, currentFamily, refreshFamily } = useUser();

  const [messages, setMessages] = useState<XinyuMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [member, setMember] = useState<FamilyMember | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef(false);

  // 找到对应的 family member
  useEffect(() => {
    if (!familyId) return;
    const found = family.find((f: FamilyMember) => f.id === familyId);
    if (found) {
      setMember(found);
    } else if (currentFamily && currentFamily.id === familyId) {
      setMember(currentFamily);
    } else if (family.length === 0) {
      // 还没加载完，等一下
    } else {
      // 找不到，尝试刷新
      refreshFamily().catch(() => {
        toast.error('加载家人信息失败');
      });
    }
  }, [familyId, family, currentFamily, refreshFamily]);

  // 加载消息
  const loadMessages = useCallback(
    async (bindingId: string, cursor?: string) => {
      try {
        if (cursor) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        const res = await messagesApi.getMessages(bindingId, cursor, 30);
        const newItems = [...res.items].reverse(); // 倒序返回，反转成正序
        if (cursor) {
          setMessages((prev) => [...newItems, ...prev]);
        } else {
          setMessages(newItems);
          initialScrollDone.current = false;
        }
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
      } catch (err) {
        const msg = err instanceof Error ? err.message : '加载消息失败';
        toast.error(msg);
        logger.error(`loadMessages error: ${msg}`);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  // 初次加载
  useEffect(() => {
    if (member?.bindingId) {
      loadMessages(member.bindingId);
    }
  }, [member?.bindingId, loadMessages]);

  // 初次加载完成后滚动到底部
  useEffect(() => {
    if (!loading && messages.length > 0 && !initialScrollDone.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
      initialScrollDone.current = true;
    }
  }, [loading, messages.length]);

  // 加载更多
  const handleScroll = () => {
    if (!listRef.current || loadingMore || !hasMore) return;
    if (listRef.current.scrollTop <= 10) {
      loadMessages(member!.bindingId, nextCursor ?? undefined);
    }
  };

  // 发送消息后追加到列表并滚到底
  const handleMessageSent = (msg: XinyuMessage) => {
    setMessages((prev) => [...prev, msg]);
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    }, 50);
  };

  const isMine = (msg: XinyuMessage): boolean => {
    return msg.senderUserId === user?.userId;
  };

  const quickPhrases = [
    '今天身体怎么样？',
    '记得按时吃饭哦',
    '天气凉了多穿点',
    '想您了～',
  ];

  const handleQuickPhrase = (phrase: string) => {
    // 通过自定义事件发送给 ChatInput
    const event = new CustomEvent('chat-quick-phrase', { detail: phrase });
    window.dispatchEvent(event);
  };

  if (!member) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const hasUnreadReport = (member.unreadReportCount ?? 0) > 0;

  return (
    <div className="h-screen flex flex-col max-w-[480px] mx-auto bg-transparent">
      {/* 顶部导航栏 */}
      <div
        className="sticky top-0 z-20 flex items-center px-4"
        style={{
          height: '56px',
          background: 'rgba(255, 255, 255, 0.85)',
          WebkitBackdropFilter: 'blur(20px)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.6)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
          aria-label="返回"
        >
          <ChevronLeft size={22} style={{ color: '#FF8C69' }} />
        </button>

        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ boxShadow: '0 2px 8px rgba(255, 107, 107, 0.15)' }}
            >
              {member.avatarUrl ? (
                <Image src={member.avatarUrl} alt={getDisplayName(member)} className="w-full h-full object-cover" />
              ) : (
                <User size={16} style={{ color: '#FF8C69' }} />
              )}
            </div>
            <span className="text-base font-semibold" style={{ color: '#333333' }}>
              {getDisplayName(member)}
            </span>
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: '#6BCB77' }}
            />
          </div>
          {hasUnreadReport && (
            <button
              onClick={() => navigate(`/history?familyId=${member.userId}`)}
              className="flex items-center gap-1 text-xs mt-0.5 active:scale-95 transition-transform"
              style={{ color: '#FF8C69' }}
            >
              <MessageCircleHeart size={12} />
              今日报告已生成 →
            </button>
          )}
        </div>

        <button
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
          aria-label="更多"
        >
          <Phone size={20} style={{ color: '#FF8C69' }} />
        </button>
      </div>

      {/* 消息列表 */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {loading && messages.length === 0 && (
          <div className="flex justify-center py-16">
            <Loader2 size={28} style={{ color: '#FF8C69' }} className="animate-spin" />
          </div>
        )}

        {loadingMore && (
          <div className="flex justify-center py-4">
            <Loader2 size={18} style={{ color: '#FF8C69' }} className="animate-spin" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{
                background: 'rgba(255, 140, 105, 0.12)',
                boxShadow: '0 8px 24px rgba(255, 107, 107, 0.12)',
              }}
            >
              <MessageCircleHeart size={32} style={{ color: '#FF8C69' }} />
            </div>
            <p className="font-semibold text-lg" style={{ color: '#333333' }}>开始聊天吧</p>
            <p className="text-sm mt-1.5" style={{ color: '#999999' }}>
              发送一条消息，让陪伴更近一步
            </p>
            <div className="flex flex-wrap justify-center gap-2.5 mt-6 px-2">
              {quickPhrases.map((phrase: string) => (
                <button
                  key={phrase}
                  onClick={() => handleQuickPhrase(phrase)}
                  className="px-4 py-2 rounded-full text-sm active:scale-95 transition-transform"
                  style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    WebkitBackdropFilter: 'blur(10px)',
                    backdropFilter: 'blur(10px)',
                    color: '#FF8C69',
                    border: '1px solid rgba(255, 140, 105, 0.2)',
                  }}
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg: XinyuMessage) => (
            <MessageItem
              key={msg.id}
              message={msg}
              isMine={isMine(msg)}
              avatarUrl={member.avatarUrl}
              partnerName={getDisplayName(member)}
            />
          ))}
        </div>
      </div>

      {/* 底部输入区 */}
      <ChatInput
        bindingId={member.bindingId}
        receiverUserId={member.userId}
        onMessageSent={handleMessageSent}
      />
    </div>
  );
}
