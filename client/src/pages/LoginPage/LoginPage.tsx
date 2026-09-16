import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye, EyeOff, ArrowLeft, Phone, Lock, User, Sparkles } from 'lucide-react';
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

  const modeTitle: Record<Mode, string> = {
    login: '登 录',
    register: '注 册',
    forgot: '重置密码',
  };

  const renderSendCodeButton = (scene: 'register' | 'reset_password') => {
    const countdown = scene === 'register' ? registerCountdown : forgotCountdown;
    const disabled = countdown > 0;

    return (
      <button
        type="button"
        onClick={() => handleSendCode(scene)}
        disabled={disabled}
        className="login-code-btn"
      >
        {countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
      </button>
    );
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Logo 区域 */}
        <div className="text-center">
          <div className="login-logo-wrap">
            <Heart className="login-logo-icon fill-white" strokeWidth={2.5} />
          </div>
          <h1 className="login-title">心系</h1>
          <p className="login-subtitle">让陪伴不缺席</p>
        </div>

        {/* 登录/注册卡片 */}
        <div className="login-card">
          {/* Tab 切换（登录/注册） */}
          {mode !== 'forgot' && (
            <div className="login-tabs">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`login-tab ${mode === 'login' ? 'login-tab-active' : ''}`}
              >
                登录
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`login-tab ${mode === 'register' ? 'login-tab-active' : ''}`}
              >
                注册
              </button>
            </div>
          )}

          {/* 忘记密码模式标题 + 返回 */}
          {mode === 'forgot' && (
            <div>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="login-back-btn"
              >
                <ArrowLeft size={16} />
                返回登录
              </button>
              <h2 className="login-forgot-title">忘记密码</h2>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* 手机号 */}
            <div>
              <label className="login-label">手机号</label>
              <div className="login-input-wrap">
                <Phone className="login-input-icon" size={20} strokeWidth={2} />
                <input
                  ref={phoneInputRef}
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="请输入手机号"
                  className="login-input"
                />
              </div>
            </div>

            {/* 验证码 */}
            {(mode === 'register' || mode === 'forgot') && (
              <div>
                <label className="login-label">验证码</label>
                <div className="flex gap-3">
                  <div className="login-input-wrap" style={{ marginBottom: 0 }}>
                    <Sparkles className="login-input-icon" size={20} strokeWidth={2} />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="请输入验证码"
                      className="login-input"
                    />
                  </div>
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

            {/* 昵称 */}
            {mode === 'register' && (
              <div>
                <label className="login-label">昵称</label>
                <div className="login-input-wrap">
                  <User className="login-input-icon" size={20} strokeWidth={2} />
                  <input
                    type="text"
                    maxLength={20}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="请输入昵称（2-20字）"
                    className="login-input"
                  />
                </div>
              </div>
            )}

            {/* 密码 */}
            <div>
              <label className="login-label">
                {mode === 'forgot' ? '新密码' : '密码'}
              </label>
              <div className="login-input-wrap">
                <Lock className="login-input-icon" size={20} strokeWidth={2} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === 'forgot'
                      ? '请输入新密码（至少6位）'
                      : '请输入密码（至少6位）'
                  }
                  className="login-input"
                  style={{ paddingRight: '52px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-password-toggle"
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* 确认密码 */}
            {(mode === 'register' || mode === 'forgot') && (
              <div>
                <label className="login-label">确认密码</label>
                <div className="login-input-wrap">
                  <Lock className="login-input-icon" size={20} strokeWidth={2} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="请再次输入密码"
                    className="login-input"
                    style={{ paddingRight: '52px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="login-password-toggle"
                    aria-label={showConfirmPassword ? '隐藏密码' : '显示密码'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* 忘记密码 */}
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="login-forgot-link"
              >
                忘记密码？
              </button>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="login-submit-btn"
            >
              {loading ? '处理中...' : modeTitle[mode]}
            </button>
          </form>

          {/* 辅助切换链接 */}
          {mode === 'login' && (
            <p className="login-switch-text">
              还没有账号？
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="login-switch-link"
              >
                立即注册
              </button>
            </p>
          )}

          {mode === 'register' && (
            <p className="login-switch-text">
              已有账号？
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="login-switch-link"
              >
                去登录
              </button>
            </p>
          )}

          {/* 协议文字 */}
          {mode !== 'forgot' && (
            <p className="login-agreement-text">
              登录即表示同意《用户协议》和《隐私政策》
            </p>
          )}
        </div>

        {/* 底部品牌 */}
        <p className="login-brand-text">
          心系 · 为异地家人搭建温暖的情感桥梁
        </p>
      </div>
    </div>
  );
}
