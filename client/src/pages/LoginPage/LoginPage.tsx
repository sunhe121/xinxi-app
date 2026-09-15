import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Heart } from 'lucide-react';
import { authApi, setToken } from '@client/src/api';

type Mode = 'login' | 'register' | 'forgot';

const PHONE_REGEX = /^1[3-9]\d{9}$/;

const LoginPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [registerCountdown, setRegisterCountdown] = useState(0);
  const [forgotCountdown, setForgotCountdown] = useState(0);
  const [testCode, setTestCode] = useState<string | null>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // 注册验证码倒计时
  useEffect(() => {
    if (registerCountdown <= 0) return;
    const timer = setInterval(() => {
      setRegisterCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [registerCountdown]);

  // 忘记密码验证码倒计时
  useEffect(() => {
    if (forgotCountdown <= 0) return;
    const timer = setInterval(() => {
      setForgotCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [forgotCountdown]);

  // 测试环境验证码 5 秒后消失
  useEffect(() => {
    if (!testCode) return;
    const timer = setTimeout(() => {
      setTestCode(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [testCode]);

  // 切换模式时自动聚焦手机号输入框
  useEffect(() => {
    if (phoneInputRef.current) {
      phoneInputRef.current.focus();
    }
  }, [mode]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setPhone(value);
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
  };

  const inputClass =
    'w-full h-12 px-4 border border-border rounded-xl text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-card';

  const labelClass = 'block text-foreground text-base font-medium mb-2';

  const renderSendCodeButton = (scene: 'register' | 'reset_password') => {
    const countdown = scene === 'register' ? registerCountdown : forgotCountdown;
    const disabled = countdown > 0;

    return (
      <button
        type="button"
        onClick={() => handleSendCode(scene)}
        disabled={disabled}
         className="shrink-0 h-12 px-4 text-sm font-medium text-primary bg-primary/10 border border-border rounded-xl hover:bg-primary/15 disabled:text-muted-foreground disabled:bg-muted disabled:cursor-not-allowed transition-all"
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
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-sm">
        {/* Logo 区域 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary mb-5 shadow-lg shadow-primary/20">
            <Heart className="w-10 h-10 text-white fill-white" />
          </div>
           <h1 className="text-3xl font-bold text-foreground mb-2">心系</h1>
           <p className="text-muted-foreground text-lg">让陪伴不缺席</p>
        </div>

        {/* 卡片 */}
         <div className="bg-card rounded-2xl shadow-sm p-7 border border-border">
          {/* 模式切换 Tab（登录/注册 用 tab，忘记密码不显示） */}
          {mode !== 'forgot' && (
             <div className="flex mb-6 bg-secondary rounded-xl p-1">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 min-h-11 px-4 rounded-lg text-base font-medium transition-colors ${
                   mode === 'login'
                     ? 'bg-card text-primary shadow-sm'
                     : 'text-muted-foreground'
                }`}
              >
                登录
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`flex-1 min-h-11 px-4 rounded-lg text-base font-medium transition-colors ${
                   mode === 'register'
                     ? 'bg-card text-primary shadow-sm'
                     : 'text-muted-foreground'
                }`}
              >
                注册
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <h2 className="text-xl font-semibold text-foreground mb-6">忘记密码</h2>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 手机号 */}
            <div>
              <label className={labelClass}>手机号</label>
              <input
                ref={phoneInputRef}
                type="tel"
                inputMode="numeric"
                maxLength={11}
                value={phone}
                onChange={handlePhoneChange}
                placeholder="请输入手机号"
                className={inputClass}
                autoFocus
              />
            </div>

            {/* 验证码（注册 & 忘记密码） */}
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

            {/* 昵称（注册） */}
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

            {/* 密码 */}
            <div>
              <label className={labelClass}>
                {mode === 'forgot' ? '新密码' : '密码'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  mode === 'forgot'
                    ? '请输入新密码（至少6位）'
                    : '请输入密码（至少6位）'
                }
                className={inputClass}
              />
            </div>

            {/* 确认密码（注册 & 忘记密码） */}
            {(mode === 'register' || mode === 'forgot') && (
              <div>
                <label className={labelClass}>确认密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入密码"
                  className={inputClass}
                />
              </div>
            )}

            {/* 忘记密码链接（仅登录模式） */}
            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-sm text-primary font-medium"
                >
                  忘记密码？
                </button>
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading}
               className="w-full min-h-12 px-6 bg-gradient-to-r from-primary to-secondary text-white text-lg font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
            >
              {loading ? '处理中...' : modeTitle[mode]}
            </button>
          </form>

          {/* 底部切换文字 */}
          {mode === 'login' && (
             <p className="text-center text-sm text-muted-foreground mt-6">
               还没有账号？
               <button
                 type="button"
                 onClick={() => switchMode('register')}
                 className="text-primary font-medium ml-1"
               >
                 立即注册
               </button>
             </p>
           )}

           {mode === 'register' && (
             <p className="text-center text-sm text-muted-foreground mt-6">
               已有账号？
               <button
                 type="button"
                 onClick={() => switchMode('login')}
                 className="text-primary font-medium ml-1"
               >
                 去登录
               </button>
             </p>
           )}

           {mode === 'forgot' && (
             <p className="text-center text-sm text-muted-foreground mt-6">
               想起来了？
               <button
                 type="button"
                 onClick={() => switchMode('login')}
                 className="text-primary font-medium ml-1"
               >
                 去登录
               </button>
             </p>
           )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          心系 · 为异地家人搭建温暖的情感桥梁
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
