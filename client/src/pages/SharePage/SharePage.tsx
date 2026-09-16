import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Check,
  Share2,
  Heart,
  Loader2,
  MessageCircle,
  QrCode,
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
    <div className="min-h-screen w-full max-w-[480px] mx-auto">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 px-5 pt-10 pb-3 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full active:bg-white/30 transition-colors"
        >
          <ArrowLeft size={22} className="text-[#333]" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-[#333] pr-8">
          分享给家人
        </h1>
      </div>

      <div className="p-5 pb-10 space-y-5 animate-fade-in-up">
        {/* 邀请码卡片 */}
        <div className="glass-card p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF8C69] to-[#FF6B6B] flex items-center justify-center">
              <Heart size={16} className="text-white" fill="white" />
            </div>
            <span className="text-base font-semibold text-[#333]">我的邀请码</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={28} className="animate-spin text-[#FF8C69]" />
            </div>
          ) : (
            <>
              <div className="text-[40px] font-bold tracking-[0.15em] tabular-nums bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] bg-clip-text text-transparent mb-4">
                {inviteCode || '------'}
              </div>
              <button
                onClick={handleCopyCode}
                disabled={!inviteCode}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FF8C69]/10 to-[#FF6B6B]/10 text-[#FF8C69] text-sm font-medium active:scale-[0.97] transition-all disabled:opacity-50"
              >
                {copied ? (
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
            </>
          )}

          <p className="text-sm text-[#999] mt-5">
            邀请码7天内有效，每位家人使用一次
          </p>
        </div>

        {/* 二维码卡片 */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-[#333] mb-5 text-center">
            扫码下载心系
          </h3>
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white rounded-2xl shadow-inner border border-white/80">
              <QRCodeSVG
                value={APP_SHARE_URL}
                size={180}
                level="H"
                fgColor="#FF6B6B"
                bgColor="#FFFFFF"
              />
            </div>
          </div>
          <p className="text-center text-sm text-[#999]">
            用手机浏览器扫描二维码即可打开
          </p>
        </div>

        {/* 操作指引 */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-[#333] mb-5">
            绑定步骤
          </h3>
          <div className="space-y-5">
            {[
              { step: 1, text: '把邀请码发给家人' },
              { step: 2, text: '家人下载/打开心系' },
              { step: 3, text: '输入邀请码绑定' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF8C69] to-[#FF6B6B] flex items-center justify-center flex-shrink-0 shadow-sm shadow-[#FF6B6B]/20">
                  <span className="text-sm font-bold text-white">
                    {item.step}
                  </span>
                </div>
                <p className="text-base text-[#333] pt-1">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 其他分享方式 */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-[#333] mb-5 text-center">
            分享方式
          </h3>
          <div className="flex justify-center gap-8 mb-5">
            <button
              onClick={handleShareLink}
              className="flex flex-col items-center gap-2 active:scale-[0.95] transition-transform"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF8C69]/10 to-[#FF6B6B]/10 flex items-center justify-center">
                <MessageCircle size={24} className="text-[#FF8C69]" />
              </div>
              <span className="text-sm text-[#333]">微信分享</span>
            </button>
            <button
              onClick={handleCopyCode}
              disabled={!inviteCode}
              className="flex flex-col items-center gap-2 active:scale-[0.95] transition-transform disabled:opacity-50"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF8C69]/10 to-[#FF6B6B]/10 flex items-center justify-center">
                <Copy size={24} className="text-[#FF8C69]" />
              </div>
              <span className="text-sm text-[#333]">复制邀请码</span>
            </button>
            <button
              onClick={handleShareLink}
              className="flex flex-col items-center gap-2 active:scale-[0.95] transition-transform"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF8C69]/10 to-[#FF6B6B]/10 flex items-center justify-center">
                <QrCode size={24} className="text-[#FF8C69]" />
              </div>
              <span className="text-sm text-[#333]">二维码</span>
            </button>
          </div>
        </div>

        {/* 温馨提示 */}
        <div className="glass-card p-5 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#98D8C8]/20 to-[#98D8C8]/10 flex items-center justify-center flex-shrink-0">
            <Heart size={16} className="text-[#98D8C8]" fill="currentColor" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#333]">温馨提示</p>
            <p className="text-sm text-[#999] mt-1 leading-relaxed">
              家人需要先注册登录才能绑定哦。让家人用手机号注册账号，打开应用输入邀请码就能和你绑定啦。
            </p>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleShareLink}
            className="btn-gradient w-full text-base flex items-center justify-center gap-2"
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
            className="w-full h-[52px] rounded-2xl bg-white/60 backdrop-blur-sm border border-white/80 text-[#FF8C69] font-semibold text-base active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm shadow-[#FF6B6B]/5"
            style={{ WebkitBackdropFilter: 'blur(10px)' }}
          >
            <Copy size={20} />
            复制邀请码
          </button>
        </div>
      </div>
    </div>
  );
}
