import { useState, useEffect, useRef } from 'react';
import {
  X,
  Copy,
  Check,
  Loader2,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { familyApi } from '@client/src/api';
import type { FamilyRelation } from '@shared/api.interface';
import { cn } from '@client/src/utils/cn';

const RELATION_OPTIONS: { value: FamilyRelation; label: string }[] = [
  { value: 'father', label: '爸爸' },
  { value: 'mother', label: '妈妈' },
  { value: 'grandfather', label: '爷爷' },
  { value: 'grandmother', label: '奶奶' },
  { value: 'son', label: '儿子' },
  { value: 'daughter', label: '女儿' },
  { value: 'spouse', label: '配偶' },
  { value: 'other', label: '其他' },
];

interface AddFamilySheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddFamilySheet({ open, onClose, onSuccess }: AddFamilySheetProps) {
  const [activeTab, setActiveTab] = useState<'generate' | 'redeem'>('generate');
  const [selectedRelation, setSelectedRelation] = useState<FamilyRelation>('other');
  const [inviteCode, setInviteCode] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemRelation, setRedeemRelation] = useState<FamilyRelation>('other');
  const [redeeming, setRedeeming] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 加载已有邀请码
  useEffect(() => {
    if (open && activeTab === 'generate' && !inviteCode) {
      loadActiveInviteCode();
    }
  }, [open, activeTab]);

  const loadActiveInviteCode = async () => {
    try {
      const res = await familyApi.getActiveInviteCode();
      if (res) {
        setInviteCode(res.code);
        setExpiresAt(res.expiresAt);
      }
    } catch {
      // 忽略错误
    }
  };

  const handleGenerateCode = async () => {
    setGenerating(true);
    try {
      const res = await familyApi.createInviteCode({ relation: selectedRelation });
      setInviteCode(res.code);
      setExpiresAt(res.expiresAt);
      toast.success('邀请码生成成功');
    } catch (error) {
      const msg = error instanceof Error ? error.message : '生成失败，请重试';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      toast.success('邀请码已复制');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('复制失败');
    }
  };

  const handleCodeInput = (index: number, value: string) => {
    const clean = value.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
    const chars = redeemCode.padEnd(6, ' ').split('').map((c: string) => (c === ' ' ? '' : c));
    if (clean.length === 1) {
      chars[index] = clean;
      if (index < 5) {
        setTimeout(() => inputRefs.current[index + 1]?.focus(), 0);
      }
    } else if (clean.length > 1) {
      const pasted = clean.slice(0, 6 - index);
      for (let i = 0; i < pasted.length; i++) {
        chars[index + i] = pasted[i];
      }
      const nextIndex = index + pasted.length;
      if (nextIndex < 6) {
        setTimeout(() => inputRefs.current[nextIndex]?.focus(), 0);
      }
    }
    const result = chars.join('');
    setRedeemCode(result);
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      const chars = redeemCode.padEnd(6, ' ').split('').map((c: string) => (c === ' ' ? '' : c));
      if (!chars[index] && index > 0) {
        chars[index - 1] = '';
        setRedeemCode(chars.join(''));
        setTimeout(() => inputRefs.current[index - 1]?.focus(), 0);
      }
    }
  };

  const handleRedeem = async () => {
    if (redeemCode.length !== 6) {
      toast.error('请输入6位邀请码');
      return;
    }
    setRedeeming(true);
    try {
      await familyApi.redeemInviteCode({
        code: redeemCode,
        relation: redeemRelation,
      });
      toast.success('配对成功！');
      await onSuccess();
      onClose();
      setRedeemCode('');
    } catch (error) {
      const msg = error instanceof Error ? error.message : '配对失败，请检查邀请码';
      toast.error(msg);
    } finally {
      setRedeeming(false);
    }
  };

  const getTimeRemaining = (): string => {
    if (!expiresAt) return '24小时';
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return '已过期';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}小时${minutes}分钟`;
    return `${minutes}分钟`;
  };

  const handleClose = () => {
    setInviteCode('');
    setRedeemCode('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 animate-fadeIn"
        onClick={handleClose}
      />
      <div className="absolute bottom-0 left-0 right-0 max-w-[480px] mx-auto animate-slideUp">
        <div
          className="backdrop-blur-2xl rounded-t-3xl border-t border-x border-white/80 shadow-2xl"
          style={{
            background: 'rgba(255, 248, 243, 0.98)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(255, 107, 107, 0.1)',
          }}
        >
          {/* 顶部把手 */}
          <div className="w-10 h-1 bg-[#FF8C69]/20 rounded-full mx-auto mt-3" />

          <div className="p-6 pb-8">
            {/* 标题 + 关闭 */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-[#333]">添加家人</h2>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center text-[#999] active:scale-95 transition-transform border border-white/80"
                aria-label="关闭"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tab 切换 */}
            <div className="flex bg-white/50 rounded-2xl p-1 mb-5 border border-white/60">
              <button
                onClick={() => setActiveTab('generate')}
                className={cn(
                  'flex-1 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98]',
                  activeTab === 'generate'
                    ? 'text-white shadow-md'
                    : 'text-[#999]'
                )}
                style={
                  activeTab === 'generate'
                    ? { background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }
                    : {}
                }
              >
                生成邀请码
              </button>
              <button
                onClick={() => setActiveTab('redeem')}
                className={cn(
                  'flex-1 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98]',
                  activeTab === 'redeem'
                    ? 'text-white shadow-md'
                    : 'text-[#999]'
                )}
                style={
                  activeTab === 'redeem'
                    ? { background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }
                    : {}
                }
              >
                输入邀请码
              </button>
            </div>

            {/* 生成邀请码 */}
            {activeTab === 'generate' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#333]">选择对方关系</label>
                  <div className="grid grid-cols-3 gap-2">
                    {RELATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedRelation(opt.value)}
                        className={cn(
                          'py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98] border',
                          selectedRelation === opt.value
                            ? 'text-white border-transparent shadow-md'
                            : 'bg-white/50 text-[#999] border-white/60'
                        )}
                        style={
                          selectedRelation === opt.value
                            ? { background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }
                            : {}
                        }
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {!inviteCode ? (
                  <button
                    onClick={handleGenerateCode}
                    disabled={generating}
                    className="w-full h-[52px] rounded-2xl text-white font-semibold text-base active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                    style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
                  >
                    {generating ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <UserPlus size={20} />
                        生成邀请码
                      </>
                    )}
                  </button>
                ) : (
                  <div className="bg-white/70 backdrop-blur-sm -webkit-backdrop-filter: blur(6px) rounded-2xl p-6 text-center border border-white/80">
                    <p className="text-sm text-[#999] mb-3">你的6位邀请码</p>
                    <div className="text-4xl font-bold text-[#FF8C69] tracking-widest mb-4 tabular-nums">
                      {inviteCode}
                    </div>
                    <p className="text-xs text-[#999] mb-4">有效期 {getTimeRemaining()}</p>
                    <button
                      onClick={handleCopyCode}
                      className="px-6 h-11 rounded-xl text-white font-medium text-sm active:scale-[0.98] transition-all inline-flex items-center gap-1.5 shadow-md"
                      style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
                    >
                      {copied ? (
                        <>
                          <Check size={16} />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          复制邀请码
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 输入邀请码 */}
            {activeTab === 'redeem' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#333]">输入6位邀请码</label>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index: number) => (
                      <input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="text"
                        maxLength={1}
                        value={redeemCode[index] || ''}
                        onChange={(e) => handleCodeInput(index, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(index, e)}
                        className="flex-1 h-14 text-center text-2xl font-bold rounded-xl bg-white/60 border border-white/80 text-[#333] focus:outline-none focus:ring-2 focus:ring-[#FF8C69]/30 focus:border-[#FF8C69] transition-all uppercase"
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#333]">对方和你的关系</label>
                  <div className="grid grid-cols-3 gap-2">
                    {RELATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setRedeemRelation(opt.value)}
                        className={cn(
                          'py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98] border',
                          redeemRelation === opt.value
                            ? 'text-white border-transparent shadow-md'
                            : 'bg-white/50 text-[#999] border-white/60'
                        )}
                        style={
                          redeemRelation === opt.value
                            ? { background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }
                            : {}
                        }
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleRedeem}
                  disabled={redeemCode.length !== 6 || redeeming}
                  className="w-full h-[52px] rounded-2xl text-white font-semibold text-base active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
                >
                  {redeeming ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      配对中...
                    </>
                  ) : (
                    '确认配对'
                  )}
                </button>
              </div>
            )}
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
