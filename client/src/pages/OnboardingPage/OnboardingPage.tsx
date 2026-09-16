import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Loader2,
  Copy,
  Check,
  UserPlus,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@client/src/hooks/useUser';
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

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refresh } = useUser();

  const [pairTab, setPairTab] = useState<'generate' | 'redeem'>('generate');
  const [selectedRelation, setSelectedRelation] = useState<FamilyRelation>('mother');
  const [inviteCode, setInviteCode] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const [redeemCode, setRedeemCode] = useState('');
  const [redeemRelation, setRedeemRelation] = useState<FamilyRelation>('son');
  const [redeeming, setRedeeming] = useState(false);
  const hasSubmittedRef = useRef(false);

  const handleGenerateCode = async () => {
    setGenerating(true);
    try {
      const res = await familyApi.createInviteCode({ relation: selectedRelation });
      setInviteCode(res.code);
      setExpiresAt(res.expiresAt);
      toast.success('邀请码生成成功');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || '生成失败，请重试';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(inviteCode);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = inviteCode;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        textarea.setAttribute('readonly', '');
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCodeCopied(true);
      toast.success('邀请码已复制，快去发给家人吧');
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      toast.error('复制失败，请长按手动复制');
    }
  };

  const handleRedeemCodeChange = (value: string) => {
    const clean = value.replace(/[^0-9a-zA-Z]/g, '').toUpperCase().slice(0, 6);
    setRedeemCode(clean);
    if (clean.length === 6 && !redeeming && !hasSubmittedRef.current) {
      hasSubmittedRef.current = true;
      setTimeout(() => {
        handleRedeem();
        setTimeout(() => {
          hasSubmittedRef.current = false;
        }, 1500);
      }, 300);
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
      refresh();
      navigate('/', { replace: true });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || '配对失败，请检查邀请码';
      toast.error(msg);
    } finally {
      setRedeeming(false);
    }
  };

  const handleSkip = () => {
    refresh();
    navigate('/', { replace: true });
  };

  const getTimeRemaining = (): string => {
    if (!expiresAt) return '7天';
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return '已过期';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}天${hours}小时`;
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}小时${minutes}分钟`;
    return `${minutes}分钟`;
  };

  return (
      <div className="min-h-screen w-full max-w-[480px] mx-auto px-5 pt-10 pb-32 flex flex-col animate-fade-in-up">
      {/* Logo / 标题区 */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gradient-to-br from-[#FF8C69] to-[#FF6B6B] flex items-center justify-center shadow-lg shadow-[#FF6B6B]/25">
          <Heart size={32} className="text-white" fill="white" />
        </div>
        <h1 className="text-[28px] font-bold text-[#333] text-center mb-3">
          配对家人
        </h1>
        <p className="text-base text-[#999] text-center leading-relaxed">
          {user?.nickname ? `你好，${user.nickname}！` : '你好！'}
          和家人配对后，就能收到TA的每日温暖播报啦
        </p>
      </div>

      {/* Tab 切换 */}
      <div className="glass-card p-1.5 flex h-12 mb-6">
        <button
          onClick={() => setPairTab('generate')}
          className={cn(
            'flex-1 rounded-[14px] text-base font-medium transition-all duration-300',
            pairTab === 'generate'
              ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white shadow-md shadow-[#FF6B6B]/20'
              : 'text-[#999]'
          )}
        >
          生成邀请码
        </button>
        <button
          onClick={() => setPairTab('redeem')}
          className={cn(
            'flex-1 rounded-[14px] text-base font-medium transition-all duration-300',
            pairTab === 'redeem'
              ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white shadow-md shadow-[#FF6B6B]/20'
              : 'text-[#999]'
          )}
        >
          输入邀请码
        </button>
      </div>

      {/* 生成邀请码 */}
      {pairTab === 'generate' && (
        <div className="flex-1 flex flex-col">
          <div className="mb-5">
            <label className="text-base font-medium text-[#333] mb-3 block">
              选择对方关系
            </label>
            <div className="grid grid-cols-2 gap-3">
              {RELATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedRelation(opt.value)}
                  className={cn(
                    'py-4 rounded-2xl text-base font-medium transition-all duration-200',
                    'active:scale-[0.97]',
                    selectedRelation === opt.value
                      ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white shadow-md shadow-[#FF6B6B]/20'
                      : 'glass-card text-[#333]'
                  )}
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
              className="btn-gradient w-full mt-4 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="glass-card p-6 text-center mt-2">
              <p className="text-sm text-[#999] mb-3">
                你的6位邀请码
              </p>
              <div className="text-[36px] font-bold tracking-[0.15em] mb-4 tabular-nums bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] bg-clip-text text-transparent">
                {inviteCode}
              </div>
              <p className="text-sm text-[#999] mb-5">
                有效期 {getTimeRemaining()}
              </p>
              <button
                onClick={handleCopyCode}
                className="btn-gradient px-8 h-11 inline-flex items-center gap-1.5 text-sm"
              >
                {codeCopied ? (
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

          {inviteCode && (
            <p className="text-center text-sm text-[#999] leading-relaxed mt-5">
              把邀请码发给家人，让TA在&ldquo;输入邀请码&rdquo;中输入即可配对
            </p>
          )}
        </div>
      )}

      {/* 输入邀请码 */}
      {pairTab === 'redeem' && (
        <div className="flex-1 flex flex-col">
          <div className="space-y-5">
            <div>
              <label className="text-base font-medium text-[#333] mb-3 block">
                输入6位邀请码
              </label>
              <input
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={6}
                autoFocus
                value={redeemCode}
                onChange={(e) => handleRedeemCodeChange(e.target.value)}
                placeholder="请输入6位邀请码"
                 className="glass-input h-[52px] w-full px-4 text-center text-[24px] font-bold tracking-[0.2em] text-[#333] placeholder:text-[#999] placeholder:font-normal placeholder:tracking-normal uppercase"
              />
            </div>

            <div>
              <label className="text-base font-medium text-[#333] mb-3 block">
                对方和你的关系
              </label>
              <div className="grid grid-cols-2 gap-3">
                {RELATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRedeemRelation(opt.value)}
                    className={cn(
                      'py-4 rounded-2xl text-base font-medium transition-all duration-200',
                      'active:scale-[0.97]',
                      redeemRelation === opt.value
                        ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white shadow-md shadow-[#FF6B6B]/20'
                        : 'glass-card text-[#333]'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleRedeem}
            disabled={redeemCode.length !== 6 || redeeming}
            className="btn-gradient w-full mt-8 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {redeeming ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                配对中...
              </>
            ) : (
              <>
                确认配对
                <Sparkles size={18} />
              </>
            )}
          </button>
        </div>
      )}

      {/* 底部跳过按钮 */}
      <button
        onClick={handleSkip}
        className="text-sm text-[#FF8C69] text-center mt-6 font-medium active:opacity-70 transition-opacity"
      >
        先跳过，稍后再说
      </button>
    </div>
  );
}
