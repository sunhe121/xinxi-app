import { useNavigate } from 'react-router-dom';
import { Heart, Mic, Sparkles, Shield, Clock } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Mic,
      title: '用你的声音说关心',
      desc: '提前录几句叮嘱，AI每天用你的声音说给家人听',
    },
    {
      icon: Sparkles,
      title: '自动了解彼此',
      desc: '步数、睡眠、出门情况，让你知道家人今天过得好不好',
    },
    {
      icon: Shield,
      title: '绝对隐私保护',
      desc: '不录音、不看聊天内容，所有数据你说了算',
    },
    {
      icon: Clock,
      title: '定时温暖送达',
      desc: '每天固定时间，收到家人的声音，像一封温暖的信',
    },
  ];

  return (
    <div className="min-h-screen w-full">
      <div className="max-w-[480px] mx-auto px-5 pt-20 pb-10 flex flex-col items-center">
        {/* 主视觉 */}
        <div className="w-40 h-40 rounded-full flex items-center justify-center mb-10 glass-card">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
              boxShadow: '0 8px 24px rgba(255, 107, 107, 0.3)',
            }}
          >
            <Heart size={56} className="text-white" fill="white" />
          </div>
        </div>

        {/* 大标题 */}
        <h1 className="text-[32px] font-bold text-[#333] text-center mb-4">
          心系
        </h1>

        {/* 副标题 */}
        <p className="text-base text-[#999] text-center mb-10 leading-relaxed">
          有些关心，不好意思说出口；
          <br />
          有些想念，怕打扰对方。
          <br />
          现在，有人替你说。
        </p>

        {/* 特点列表 */}
        <div className="glass-card p-6 mt-8 w-full">
          {features.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={`flex items-start gap-4 ${
                  index < features.length - 1 ? 'mb-5' : 'mb-0'
                }`}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                  }}
                >
                  <Icon size={22} className="text-white" />
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-base font-medium text-[#333] mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#999] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 底部按钮 */}
        <button
          onClick={() => navigate('/login')}
          className="btn-gradient w-full mt-10 flex items-center justify-center gap-2"
        >
          开始使用
        </button>

        {/* 辅助链接 */}
        <p className="text-sm text-[#999] text-center mt-6">
          让爱，不用开口 ♥
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
