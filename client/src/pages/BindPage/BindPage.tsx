import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function BindPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/family', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="glass-card p-8 flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-[#FF8C69] animate-spin" />
        <p className="text-sm text-[#999]">跳转中...</p>
      </div>
    </div>
  );
}
