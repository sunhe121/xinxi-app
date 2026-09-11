import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  User,
  Loader2,
  Copy,
  Check,
  UserPlus,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@client/src/hooks/useUser';
import { usersApi, familyApi } from '@client/src/api';
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
  const { setUser, refresh } = useUser();
  const [step, setStep] = useState(1);

  // Step 1: 我的信息
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Step 2: 配对家人
  const [pairTab, setPairTab] = useState<'generate' | 'redeem'>('generate');
  const [selectedRelation, setSelectedRelation] = useState<FamilyRelation>('mother');
  const [inviteCode, setInviteCode] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const [redeemCode, setRedeemCode] = useState('');
  const [redeemRelation, setRedeemRelation] = useState<FamilyRelation>('son');
  const [redeeming, setRedeeming] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleAvatarClick = () => {
    toast.info('暂不支持上传头像');
  };

  // Step 1 → Step 2
  const handleStep1Next = async () => {
    if (!nickname.trim()) {
      toast.error('请输入你的昵称');
      return;
    }
    setSubmitting(true);
    try {
      const newUser = await usersApi.initUser({
        nickname: nickname.trim(),
      });
      setUser(newUser);
      setStep(2);
    } catch {
      toast.error('初始化失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 生成邀请码
  const handleGenerateCode = async () => {
    setGenerating(true);
    try {
      const res = await familyApi.createInviteCode({ relation: selectedRelation });
      setInviteCode(res.code);
      setExpiresAt(res.expiresAt);
      toast.success('邀请码生成成功');
    } catch {
      toast.error('生成失败，请重试');
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

  // 输入邀请码
  const handleCodeInput = (index: number, value: string) => {
    const clean = value.replace(/[^0-9a-zA-Z]/g, '').slice(0, 1).toUpperCase();
    const newCode = redeemCode.split('');
    newCode[index] = clean;
    const result = newCode.join('').padEnd(6, ' ').trim();
    setRedeemCode(result);
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !redeemCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
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
    } catch {
      toast.error('配对失败，请检查邀请码');
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* 顶部进度条 */}
      <div className="flex gap-2 px-5 pt-6 pb-2">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              s <= step ? 'bg-primary' : 'bg-secondary'
            )}
          />
        ))}
      </div>

      <div className="flex-1 px-5 py-6">
        {/* Step 1: 欢迎 + 我的信息 */}
        {step === 1 && (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center pt-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
                <Heart size={40} className="text-white" fill="white" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">心系</h1>
              <p className="text-muted-foreground text-base">让陪伴不缺席</p>
            </div>

            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-foreground">你的信息</h2>

              {/* 头像 */}
              <div className="flex flex-col items-center">
                <button
                  onClick={handleAvatarClick}
                  className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden active:scale-95 transition-transform"
                  aria-label="设置头像"
                >
                  <User size={40} className="text-primary" />
                </button>
                <p className="text-sm text-muted-foreground mt-2">点击设置头像</p>
              </div>

              {/* 昵称输入 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">昵称</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="请输入你的昵称"
                  maxLength={20}
                  className="w-full px-4 py-4 rounded-2xl bg-card border border-border text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <button
              onClick={handleStep1Next}
              disabled={!nickname.trim() || submitting}
              className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-semibold text-base shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  加载中...
                </>
              ) : (
                <>
                  下一步
                  <Sparkles size={18} />
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 2: 配对家人 */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">配对家人</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                和家人配对后，就能收到TA的每日温暖播报啦
              </p>
            </div>

            {/* Tab 切换 */}
            <div className="flex bg-secondary rounded-2xl p-1">
              <button
                onClick={() => setPairTab('generate')}
                className={cn(
                  'flex-1 py-3 rounded-xl text-sm font-medium transition-all',
                  pairTab === 'generate'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                生成邀请码
              </button>
              <button
                onClick={() => setPairTab('redeem')}
                className={cn(
                  'flex-1 py-3 rounded-xl text-sm font-medium transition-all',
                  pairTab === 'redeem'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                输入邀请码
              </button>
            </div>

            {/* 生成邀请码 */}
            {pairTab === 'generate' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    选择对方关系
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {RELATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedRelation(opt.value)}
                        className={cn(
                          'py-3 rounded-xl text-sm font-medium transition-all active:scale-95',
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
                    className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-semibold text-base shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
                  <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-2xl p-6 text-center">
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
                  <p className="text-center text-xs text-muted-foreground leading-relaxed">
                    把邀请码发给家人，让TA在"输入邀请码"中输入即可配对
                  </p>
                )}
              </div>
            )}

            {/* 输入邀请码 */}
            {pairTab === 'redeem' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    输入6位邀请码
                  </label>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
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
                        className="flex-1 h-14 text-center text-2xl font-bold rounded-xl bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all uppercase"
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    对方和你的关系
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {RELATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setRedeemRelation(opt.value)}
                        className={cn(
                          'py-3 rounded-xl text-sm font-medium transition-all active:scale-95',
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

                <button
                  onClick={handleRedeem}
                  disabled={redeemCode.length !== 6 || redeeming}
                  className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-semibold text-base shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        )}
      </div>

      {/* 底部跳过按钮 */}
      {step === 2 && (
        <div className="px-5 pb-8">
          <button
            onClick={handleSkip}
            className="w-full py-3 text-muted-foreground text-sm font-medium active:scale-95 transition-transform"
          >
            先跳过，稍后再说
          </button>
        </div>
      )}

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
