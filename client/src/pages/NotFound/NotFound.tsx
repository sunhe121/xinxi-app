import { useNavigate } from 'react-router-dom';
import { Home, Heart } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
          <Heart size={48} className="text-white" fill="white" />
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-bold text-foreground">404</h1>
          <p className="text-lg text-muted-foreground">页面走丢了</p>
          <p className="text-sm text-muted-foreground">
            别担心，让我们回到温暖的地方
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-semibold text-base shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Home size={20} />
          返回首页
        </button>
      </div>
    </div>
  );
};

export default NotFound;
