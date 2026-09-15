import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, User, MessageCircleHeart, Loader2 } from 'lucide-react';
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

  if (!member) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const hasUnreadReport = (member.unreadReportCount ?? 0) > 0;

  return (
    <div className="h-screen flex flex-col bg-background max-w-[480px] mx-auto">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border/60">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-full flex items-center justify-center active:bg-secondary transition-colors"
            aria-label="返回"
          >
            <ChevronLeft size={24} className="text-foreground" />
          </button>

          <div className="flex-1 flex flex-col items-center">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-lg">
                {getDisplayName(member)}
              </span>
            </div>
            {hasUnreadReport && (
              <button
                onClick={() => navigate(`/history?familyId=${member.userId}`)}
                 className="flex items-center gap-1.5 text-sm text-primary mt-0.5 active:scale-95 transition-transform"
               >
                 <MessageCircleHeart size={16} />
                 今日报告已生成 →
              </button>
            )}
          </div>

          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {member.avatarUrl ? (
              <Image src={member.avatarUrl} alt={getDisplayName(member)} className="w-full h-full object-cover" />
            ) : (
               <User size={20} className="text-primary" />
            )}
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-5 space-y-4"
      >
        {loading && messages.length === 0 && (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="text-primary animate-spin" />
          </div>
        )}

        {loadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 size={18} className="text-primary animate-spin" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageCircleHeart size={32} className="text-primary" />
            </div>
            <p className="text-foreground font-medium">还没有消息</p>
            <p className="text-sm text-muted-foreground mt-1">说点什么吧~</p>
          </div>
        )}

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

      {/* 底部输入区 */}
      <ChatInput
        bindingId={member.bindingId}
        receiverUserId={member.userId}
        onMessageSent={handleMessageSent}
      />
    </div>
  );
}
