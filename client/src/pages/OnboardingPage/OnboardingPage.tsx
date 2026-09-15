import { useState } from 'react';
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
      await navigator.clipboard.writeText(inviteCode);
      setCodeCopied(true);
      toast.success('已复制邀请码');
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      toast.error('复制失败');
    }
  };

  const handleRedeemCodeChange = (value: string) => {
    const clean = value.replace(/[^0-9a-zA-Z]/g, '').toUpperCase().slice(0, 6);
    setRedeemCode(clean);
    if (clean.length === 6 && !redeeming) {
      setTimeout(() => handleRedeem(), 200);
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
    if (!expiresAt) return '24小时';
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return '已过期';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}小时${minutes}分钟`;
    return `${minutes}分钟`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-[480px] mx-auto">
      <div className="flex-1 px-5 pt-6">
        <div className="bg-card rounded-3xl shadow-lg p-8 space-y-6 animate-fadeIn">
          {/* Logo / 标题区 */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-orange-300 flex items-center justify-center shadow-lg shadow-primary/30">
              <Heart size={32} className="text-white" fill="white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">配对家人</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {user?.nickname ? `你好，${user.nickname}！` : '你好！'}
              和家人配对后，就能收到TA的每日温暖播报啦
            </p>
          </div>

          {/* Tab 切换 */}
          <div className="flex bg-secondary rounded-2xl p-1 h-12">
            <button
              onClick={() => setPairTab('generate')}
              className={cn(
                'flex-1 rounded-xl text-base font-medium transition-all',
                pairTab === 'generate'
                  ? 'bg-card text-primary shadow-md shadow-primary/10'
                  : 'text-muted-foreground'
              )}
            >
              生成邀请码
            </button>
            <button
              onClick={() => setPairTab('redeem')}
              className={cn(
                'flex-1 rounded-xl text-base font-medium transition-all',
                pairTab === 'redeem'
                  ? 'bg-card text-primary shadow-md shadow-primary/10'
                  : 'text-muted-foreground'
              )}
            >
              输入邀请码
            </button>
          </div>

          {/* 生成邀请码 */}
          {pairTab === 'generate' && (
            <div>
              <div className="space-y-2.5">
                <label className="text-sm font-medium text-foreground">
                  选择对方关系
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {RELATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedRelation(opt.value)}
                      className={cn(
                        'py-4 rounded-xl text-base font-medium transition-all active:scale-95',
                        selectedRelation === opt.value
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-secondary text-muted-foreground'
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
                  className="w-full h-12 bg-gradient-to-r from-primary to-orange-400 text-white rounded-xl text-lg font-semibold shadow-md shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
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
                <div className="bg-gradient-to-br from-primary/10 via-orange-200/30 to-secondary/30 rounded-2xl p-6 text-center mt-6">
                  <p className="text-sm text-muted-foreground mb-3">
                    你的6位邀请码
                  </p>
                  <div className="text-4xl font-bold text-primary tracking-widest mb-4 tabular-nums">
                    {inviteCode}
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    有效期 {getTimeRemaining()}
                  </p>
                  <button
                    onClick={handleCopyCode}
                    className="px-6 py-2.5 bg-primary text-white rounded-full text-sm font-medium active:scale-95 transition-transform inline-flex items-center gap-1.5"
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
                <p className="text-center text-xs text-muted-foreground leading-relaxed mt-4">
                  把邀请码发给家人，让TA在&ldquo;输入邀请码&rdquo;中输入即可配对
                </p>
              )}
            </div>
          )}

          {/* 输入邀请码 */}
          {pairTab === 'redeem' && (
            <div>
              <div className="space-y-5">
                <div className="space-y-2.5">
                  <label className="text-sm font-medium text-foreground">
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
                    className="w-full h-12 px-4 text-center text-base text-foreground rounded-xl bg-card border border-border placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="text-sm font-medium text-foreground">
                    对方和你的关系
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {RELATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setRedeemRelation(opt.value)}
                        className={cn(
                          'py-4 rounded-xl text-base font-medium transition-all active:scale-95',
                          redeemRelation === opt.value
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-secondary text-muted-foreground'
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
                className="w-full h-12 bg-gradient-to-r from-primary to-orange-400 text-white rounded-xl text-lg font-semibold shadow-md shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
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
        </div>
      </div>

      {/* 底部跳过按钮 */}
      <div className="px-5 pb-[120px]">
        <button
          onClick={handleSkip}
          className="w-full py-3 text-muted-foreground text-sm font-medium active:scale-95 transition-transform"
        >
          先跳过，稍后再说
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}
