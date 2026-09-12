import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Heart } from 'lucide-react';
import { authApi, setToken } from '@client/src/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validateNickname = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return '请输入昵称';
    if (trimmed.length < 4) return '昵称至少4位';
    const hasChinese = /[\u4e00-\u9fa5]/.test(trimmed);
    const hasNumber = /\d/.test(trimmed);
    if (!hasChinese || !hasNumber) {
      return '昵称需包含中文和数字';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nickError = validateNickname(nickname);
    if (nickError) {
      toast.error(nickError);
      return;
    }
    if (!password || password.length < 6) {
      toast.error('密码至少6位');
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      toast.error('两次密码不一致');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const result = await authApi.login(nickname.trim(), password);
        setToken(result.token);
        toast.success('登录成功');
        if (result.user) {
          navigate('/');
        } else {
          navigate('/onboarding');
        }
      } else {
        const result = await authApi.register(nickname.trim(), password);
        setToken(result.token);
        toast.success('注册成功');
        navigate('/onboarding');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F3] flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#FF8C69] to-[#FFB5B5] mb-5 shadow-lg">
            <Heart className="w-10 h-10 text-white fill-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#4A3F3A] mb-2">心系</h1>
          <p className="text-[#8B7D75] text-lg">让陪伴不缺席</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-7 border border-[#F0E6DD]">
          <div className="flex mb-6 bg-[#FFF8F3] rounded-xl p-1">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-lg text-base font-medium transition-colors ${
                isLogin
                  ? 'bg-white text-[#FF8C69] shadow-sm'
                  : 'text-[#8B7D75]'
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-lg text-base font-medium transition-colors ${
                !isLogin
                  ? 'bg-white text-[#FF8C69] shadow-sm'
                  : 'text-[#8B7D75]'
              }`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[#4A3F3A] text-base font-medium mb-2">
                昵称
              </label>
               <input
                 type="text"
                 value={nickname}
                 onChange={(e) => setNickname(e.target.value)}
                 placeholder="请输入昵称"
                 className="w-full h-12 px-4 border border-[#F0E6DD] rounded-xl text-base text-[#4A3F3A] placeholder-[#B8ABA3] focus:outline-none focus:border-[#FF8C69] focus:ring-2 focus:ring-[#FF8C69]/20 transition-all"
               />
               {!isLogin && (
                 <p className="text-xs text-[#8B7D75] mt-2">
                   昵称需包含中文和数字，至少4位
                 </p>
               )}
             </div>

            <div>
              <label className="block text-[#4A3F3A] text-base font-medium mb-2">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码（至少6位）"
                className="w-full h-12 px-4 border border-[#F0E6DD] rounded-xl text-base text-[#4A3F3A] placeholder-[#B8ABA3] focus:outline-none focus:border-[#FF8C69] focus:ring-2 focus:ring-[#FF8C69]/20 transition-all"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-[#4A3F3A] text-base font-medium mb-2">
                  确认密码
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入密码"
                  className="w-full h-12 px-4 border border-[#F0E6DD] rounded-xl text-base text-[#4A3F3A] placeholder-[#B8ABA3] focus:outline-none focus:border-[#FF8C69] focus:ring-2 focus:ring-[#FF8C69]/20 transition-all"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-[#FF8C69] to-[#FFB5B5] text-white text-lg font-medium rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? '处理中...' : isLogin ? '登 录' : '注 册'}
            </button>
          </form>

          <p className="text-center text-sm text-[#8B7D75] mt-6">
            {isLogin ? '还没有账号？' : '已有账号？'}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#FF8C69] font-medium ml-1"
            >
              {isLogin ? '立即注册' : '去登录'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-[#B8ABA3] mt-6">
          心系 · 为异地家人搭建温暖的情感桥梁
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
