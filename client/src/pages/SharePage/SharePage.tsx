import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Check,
  Share2,
  Heart,
  Loader2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { useUser } from '@client/src/hooks/useUser';
import { familyApi } from '@client/src/api';

const APP_SHARE_URL = 'https://miaoda.feishu.cn/app/app_17duygeccfn';

export default function SharePage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    loadInviteCode();
  }, []);

  const loadInviteCode = async () => {
    try {
      setLoading(true);
      const res = await familyApi.getActiveInviteCode();
      if (res) {
        setInviteCode(res.code);
      } else if (user?.inviteCode) {
        setInviteCode(user.inviteCode);
      }
    } catch {
      if (user?.inviteCode) {
        setInviteCode(user.inviteCode);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      toast.success('邀请码已复制');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('复制失败，请手动复制');
    }
  };

  const handleShareLink = async () => {
    const shareText = `${user?.nickname || '我'}邀请你使用「心系」——用AI把每天的生活变成温暖的语音，让陪伴不缺席。\n\n下载/打开心系，输入我的邀请码即可绑定：${inviteCode}\n\n${APP_SHARE_URL}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '心系 - 让陪伴不缺席',
          text: shareText,
          url: APP_SHARE_URL,
        });
        return;
      } catch {
        // 用户取消分享，fallback到复制
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setLinkCopied(true);
      toast.success('分享链接已复制，快去发给家人吧');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error('复制失败，请手动复制');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center h-14 px-5">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 -ml-2 flex items-center justify-center rounded-full active:bg-muted/50 transition-colors"
          >
            <ArrowLeft size={22} className="text-foreground" />
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold text-foreground pr-8">
            分享给家人
          </h1>
        </div>
      </div>

      <div className="p-5 pb-10 space-y-6">
        {/* 邀请码卡片 */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-secondary rounded-3xl p-6 text-white shadow-lg shadow-primary/20">
          <div className="flex items-center gap-2 mb-4">
            <Heart size={20} fill="currentColor" />
            <span className="text-sm font-medium opacity-90">我的邀请码</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={28} className="animate-spin opacity-80" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-4xl font-bold tracking-widest font-mono">
                {inviteCode || '------'}
              </div>
              <button
                onClick={handleCopyCode}
                disabled={!inviteCode}
                className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center active:scale-95 transition-all disabled:opacity-50"
              >
                {copied ? (
                  <Check size={22} />
                ) : (
                  <Copy size={22} />
                )}
              </button>
            </div>
          )}

          <p className="text-xs opacity-75 mt-4">
            邀请码7天内有效，每位家人使用一次
          </p>
        </div>

        {/* 二维码卡片 */}
        <div className="bg-card rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
            扫码下载心系
          </h3>
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white rounded-2xl shadow-inner border border-border/50">
              <QRCodeSVG
                value={APP_SHARE_URL}
                size={180}
                level="H"
                fgColor="#4A3F3A"
                bgColor="#FFFFFF"
              />
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            用手机浏览器扫描二维码即可打开
          </p>
        </div>

        {/* 操作指引 */}
        <div className="bg-card rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-5">
            绑定步骤
          </h3>
          <div className="space-y-5">
            {[
              { step: 1, text: '把邀请码发给家人' },
              { step: 2, text: '家人下载/打开心系' },
              { step: 3, text: '输入邀请码绑定' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {item.step}
                  </span>
                </div>
                <p className="text-base text-foreground pt-1">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 温馨提示 */}
        <div className="bg-accent/10 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
            <Heart size={16} className="text-accent" fill="currentColor" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">温馨提示</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              家人需要先注册登录才能绑定哦。让家人用手机号注册豆包账号，打开应用输入邀请码就能和你绑定啦。
            </p>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleShareLink}
            className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-semibold text-base shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {linkCopied ? (
              <>
                <Check size={20} />
                已复制分享内容
              </>
            ) : (
              <>
                <Share2 size={20} />
                分享链接给家人
              </>
            )}
          </button>
          <button
            onClick={handleCopyCode}
            disabled={!inviteCode}
            className="w-full py-4 bg-card border-2 border-border text-foreground rounded-2xl font-semibold text-base active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Copy size={20} />
            复制邀请码
          </button>
        </div>
      </div>
    </div>
  );
}
