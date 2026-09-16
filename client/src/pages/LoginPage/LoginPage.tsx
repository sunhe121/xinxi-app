import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { authApi, setToken } from '@client/src/api';

type Mode = 'login' | 'register' | 'forgot';

const PHONE_REGEX = /^1[3-9]\d{9}$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [registerCountdown, setRegisterCountdown] = useState(0);
  const [forgotCountdown, setForgotCountdown] = useState(0);
  const [testCode, setTestCode] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (registerCountdown <= 0) return;
    const timer = setTimeout(() => setRegisterCountdown(registerCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [registerCountdown]);

  useEffect(() => {
    if (forgotCountdown <= 0) return;
    const timer = setTimeout(() => setForgotCountdown(forgotCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [forgotCountdown]);

  const handlePhoneChange = (value: string) => {
    const clean = value.replace(/\D/g, '').slice(0, 11);
    setPhone(clean);
  };

  const validatePhone = (): boolean => {
    if (!PHONE_REGEX.test(phone)) {
      toast.error('请输入正确的手机号');
      return false;
    }
    return true;
  };

  const handleSendCode = async (scene: 'register' | 'reset_password') => {
    if (!validatePhone()) return;

    try {
      const result = await authApi.sendSmsCode(phone, scene);
      setTestCode(result.code);
      toast.success('验证码已发送');

      if (scene === 'register') {
        setRegisterCountdown(60);
      } else {
        setForgotCountdown(60);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || '发送失败，请重试');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone()) return;
    if (!password || password.length < 6) {
      toast.error('密码至少6位');
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.login(phone, password);
      setToken(result.token);
      toast.success('登录成功');
      navigate('/');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone()) return;
    if (!code) {
      toast.error('请输入验证码');
      return;
    }
    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length < 2 || trimmedNickname.length > 20) {
      toast.error('昵称长度为2-20字');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('密码至少6位');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('两次密码不一致');
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.register(phone, password, trimmedNickname, code);
      setToken(result.token);
      toast.success('注册成功');
      navigate('/onboarding');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone()) return;
    if (!code) {
      toast.error('请输入验证码');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('新密码至少6位');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('两次密码不一致');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(phone, code, password);
      toast.success('密码重置成功，请使用新密码登录');
      setMode('login');
      setPassword('');
      setConfirmPassword('');
      setCode('');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || '重置失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (mode === 'login') {
      handleLogin(e);
    } else if (mode === 'register') {
      handleRegister(e);
    } else {
      handleForgot(e);
    }
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setCode('');
    setPassword('');
    setConfirmPassword('');
    setTestCode(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const inputClass =
    'glass-input w-full h-13 px-4 text-base text-[#333] placeholder:text-[#999]';

  const passwordInputClass =
    'glass-input w-full h-13 pl-4 pr-12 text-base text-[#333] placeholder:text-[#999]';

  const labelClass = 'block text-sm font-medium text-[#333] mb-2';

  const renderSendCodeButton = (scene: 'register' | 'reset_password') => {
    const countdown = scene === 'register' ? registerCountdown : forgotCountdown;
    const disabled = countdown > 0;

    return (
      <button
        type="button"
        onClick={() => handleSendCode(scene)}
        disabled={disabled}
        className="shrink-0 h-13 px-4 text-sm text-[#FF8C69] bg-[#FF8C69]/10 rounded-xl font-medium disabled:text-[#999] disabled:bg-white/40 disabled:cursor-not-allowed transition-all"
      >
        {countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
      </button>
    );
  };

  const modeTitle: Record<Mode, string> = {
    login: '登 录',
    register: '注 册',
    forgot: '重置密码',
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="w-full max-w-md mx-auto px-5 py-8">
        {/* Logo 区域 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#FF8C69] to-[#FF6B6B] mb-5 shadow-lg shadow-[#FF6B6B]/30">
            <Heart className="w-10 h-10 text-white fill-white" />
          </div>
          <h1 className="text-[28px] font-bold text-[#333] mb-2">心系</h1>
          <p className="text-base text-[#999]">让陪伴不缺席</p>
        </div>

        {/* 登录/注册卡片 */}
        <div className="glass-card p-7">
          {/* Tab 切换（登录/注册） */}
          {mode !== 'forgot' && (
            <div className="flex mb-6 bg-white/40 rounded-2xl p-1 h-12">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 text-base rounded-xl transition-all duration-300 ${
                  mode === 'login'
                    ? 'bg-white text-[#FF8C69] shadow-sm font-semibold'
                    : 'text-[#999] font-medium'
                }`}
              >
                登录
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`flex-1 text-base rounded-xl transition-all duration-300 ${
                  mode === 'register'
                    ? 'bg-white text-[#FF8C69] shadow-sm font-semibold'
                    : 'text-[#999] font-medium'
                }`}
              >
                注册
              </button>
            </div>
          )}

          {/* 忘记密码模式标题 + 返回 */}
          {mode === 'forgot' && (
            <div className="mb-8">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-[#FF8C69] mb-4 flex items-center gap-1 text-sm font-medium"
              >
                <ArrowLeft size={16} />
                返回登录
              </button>
              <h2 className="text-2xl font-bold text-[#333]">忘记密码</h2>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={labelClass}>手机号</label>
              <input
                ref={phoneInputRef}
                type="tel"
                inputMode="numeric"
                maxLength={11}
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="请输入手机号"
                className={inputClass}
                autoFocus
              />
            </div>

            {(mode === 'register' || mode === 'forgot') && (
              <div>
                <label className={labelClass}>验证码</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="请输入验证码"
                    className={`${inputClass} flex-1`}
                  />
                  {renderSendCodeButton(
                    mode === 'register' ? 'register' : 'reset_password',
                  )}
                </div>
                {testCode && (
                  <p className="text-xs text-warning mt-2">
                    测试环境验证码：{testCode}
                  </p>
                )}
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className={labelClass}>昵称</label>
                <input
                  type="text"
                  maxLength={20}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="请输入昵称（2-20字）"
                  className={inputClass}
                />
              </div>
            )}

            <div>
              <label className={labelClass}>
                {mode === 'forgot' ? '新密码' : '密码'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === 'forgot'
                      ? '请输入新密码（至少6位）'
                      : '请输入密码（至少6位）'
                  }
                  className={passwordInputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#999] hover:text-[#333] transition-colors"
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {(mode === 'register' || mode === 'forgot') && (
              <div>
                <label className={labelClass}>确认密码</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="请再次输入密码"
                    className={passwordInputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#999] hover:text-[#333] transition-colors"
                    aria-label={showConfirmPassword ? '隐藏密码' : '显示密码'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="text-right mt-3">
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-sm text-[#999]"
                >
                  忘记密码？
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-gradient w-full mt-7 text-base font-semibold disabled:opacity-50"
            >
              {loading ? '处理中...' : modeTitle[mode]}
            </button>
          </form>

          {/* 辅助切换链接 */}
          {mode === 'login' && (
            <p className="text-center text-sm text-[#999] mt-6">
              还没有账号？
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="text-[#FF8C69] font-medium ml-1"
              >
                立即注册
              </button>
            </p>
          )}

          {mode === 'register' && (
            <p className="text-center text-sm text-[#999] mt-6">
              已有账号？
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-[#FF8C69] font-medium ml-1"
              >
                去登录
              </button>
            </p>
          )}

          {/* 协议文字 */}
          {mode !== 'forgot' && (
            <p className="text-xs text-[#999] text-center mt-6 leading-relaxed">
              登录即表示同意《用户协议》和《隐私政策》
            </p>
          )}
        </div>

        {/* 底部品牌 */}
        <p className="text-xs text-[#999] text-center mt-10">
          心系 · 为异地家人搭建温暖的情感桥梁
        </p>
      </div>
    </div>
  );
}
