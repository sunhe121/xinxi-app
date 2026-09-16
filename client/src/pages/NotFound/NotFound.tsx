import { useNavigate } from 'react-router-dom';
import { Home, Heart } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-5">
      {/* 大图标 */}
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
        style={{
          background:
            'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
          boxShadow: '0 8px 32px rgba(255, 107, 107, 0.3)',
        }}
      >
        <Heart size={48} className="text-white" fill="white" />
      </div>

      {/* 大标题 */}
      <h1
        className="text-[80px] font-bold mb-2 leading-none"
        style={{
          background:
            'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        404
      </h1>

      {/* 副标题 */}
      <p className="text-lg text-[#999] mb-8">
        页面走丢了，我们回家吧
      </p>

      {/* 返回按钮 */}
      <button
        onClick={() => navigate('/')}
        className="btn-gradient px-8 flex items-center gap-2"
      >
        <Home size={20} />
        返回首页
      </button>
    </div>
  );
};

export default NotFound;
