import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  User,
  X,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@client/src/hooks/useUser';
import { cn } from '@client/src/utils/cn';
import { Image } from '@client/src/components/ui/image';

const AVATAR_OPTIONS = [
  { id: 'sun', name: '小太阳', emoji: '☀️', bg: 'from-orange-300 to-amber-400' },
  { id: 'flower', name: '小花', emoji: '🌸', bg: 'from-pink-300 to-rose-400' },
  { id: 'tree', name: '大树', emoji: '🌳', bg: 'from-green-300 to-emerald-400' },
  { id: 'moon', name: '月亮', emoji: '🌙', bg: 'from-indigo-300 to-purple-400' },
  { id: 'bear', name: '小熊', emoji: '🐻', bg: 'from-amber-400 to-orange-500' },
  { id: 'cat', name: '小猫', emoji: '🐱', bg: 'from-yellow-300 to-amber-400' },
  { id: 'rabbit', name: '小兔', emoji: '🐰', bg: 'from-pink-200 to-pink-400' },
  { id: 'cloud', name: '云朵', emoji: '☁️', bg: 'from-sky-200 to-blue-300' },
  { id: 'star', name: '星星', emoji: '⭐', bg: 'from-yellow-300 to-orange-400' },
  { id: 'heart', name: '爱心', emoji: '❤️', bg: 'from-red-300 to-rose-500' },
  { id: 'rainbow', name: '彩虹', emoji: '🌈', bg: 'from-purple-300 via-pink-300 to-orange-300' },
  { id: 'fire', name: '小火苗', emoji: '🔥', bg: 'from-orange-400 to-red-500' },
];

const TITLE_OPTIONS = [
  '儿子', '女儿', '爸爸', '妈妈', '爷爷', '奶奶', '老公', '老婆', '宝贝',
];

const AVATAR_URL_PREFIX = 'preset:';

function getAvatarUrl(id: string): string {
  return `${AVATAR_URL_PREFIX}${id}`;
}

function isPresetAvatar(url: string | undefined): boolean {
  return !!url && url.startsWith(AVATAR_URL_PREFIX);
}

function getPresetAvatarId(url: string | undefined): string {
  if (!url || !url.startsWith(AVATAR_URL_PREFIX)) return '';
  return url.slice(AVATAR_URL_PREFIX.length);
}

function getAvatarEmoji(url: string | undefined): string {
  const id = getPresetAvatarId(url);
  return AVATAR_OPTIONS.find((a) => a.id === id)?.emoji || '';
}

function getAvatarBg(url: string | undefined): string {
  const id = getPresetAvatarId(url);
  return AVATAR_OPTIONS.find((a) => a.id === id)?.bg || 'from-orange-300 to-amber-400';
}

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const { user, editProfile } = useUser();

  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [myTitle, setMyTitle] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showAvatarSheet, setShowAvatarSheet] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setGender(user.gender || 'female');
      setMyTitle(user.myTitle || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const handleSelectPreset = (title: string) => {
    setMyTitle(title);
    setCustomTitle('');
  };

  const handleCustomTitleChange = (val: string) => {
    setCustomTitle(val);
    if (val.trim()) {
      setMyTitle(val.trim());
    }
  };

  const handleSelectAvatar = (id: string) => {
    setAvatarUrl(getAvatarUrl(id));
    setShowAvatarSheet(false);
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      toast.error('请输入昵称');
      return;
    }
    setSaving(true);
    try {
      await editProfile({
        nickname: nickname.trim(),
        gender,
        myTitle,
        bio: bio.trim(),
        avatarUrl,
      });
      toast.success('已保存');
      navigate(-1);
    } catch {
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const avatarOption = isPresetAvatar(avatarUrl)
    ? AVATAR_OPTIONS.find((a) => a.id === getPresetAvatarId(avatarUrl))
    : null;

  return (
    <>
      <div className="min-h-screen bg-transparent px-5 pt-4 pb-6">
        {/* 顶部导航栏 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#FF8C69] active:scale-95 transition-transform"
            aria-label="返回"
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <h1 className="text-lg font-semibold text-[#333333]">编辑资料</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 h-10 text-[#FF8C69] font-medium text-base active:scale-95 transition-transform disabled:opacity-50"
          >
            保存
          </button>
        </div>

        <div className="space-y-5">
          {/* 头像区域 */}
          <div className="glass-card p-6 flex flex-col items-center">
            <button
              onClick={() => setShowAvatarSheet(true)}
              className="relative group active:scale-95 transition-transform"
            >
              <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-br from-[#FF8C69] to-[#FF6B6B] shadow-lg shadow-[#FF6B6B]/20">
                <div className="w-full h-full rounded-full overflow-hidden bg-white/80 backdrop-blur-sm flex items-center justify-center">
                  {avatarUrl && !isPresetAvatar(avatarUrl) ? (
                    <Image
                      src={avatarUrl}
                      alt="头像"
                      className="w-full h-full object-cover"
                    />
                  ) : avatarOption ? (
                    <div
                      className={cn(
                        'w-full h-full bg-gradient-to-br flex items-center justify-center text-4xl',
                        avatarOption.bg
                      )}
                    >
                      {avatarOption.emoji}
                    </div>
                  ) : (
                    <User size={40} className="text-[#999999]" />
                  )}
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#FF8C69] to-[#FF6B6B] text-white flex items-center justify-center shadow-md ring-2 ring-white/80">
                <Camera size={16} />
              </div>
            </button>
            <p className="text-sm text-[#FF8C69] mt-3 font-medium">更换头像</p>
          </div>

          {/* 基本资料卡片 */}
          <div className="glass-card overflow-hidden">
            {/* 昵称 */}
            <div className="h-16 px-5 flex flex-col justify-center border-b border-white/30">
              <label className="text-xs text-[#999999] mb-1">昵称</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="请输入昵称"
                maxLength={20}
                className="text-base text-[#333333] placeholder:text-[#999999] bg-transparent focus:outline-none w-full"
              />
            </div>

            {/* 性别 */}
            <div className="h-16 px-5 flex items-center justify-between border-b border-white/30">
              <span className="text-xs text-[#999999]">性别</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setGender('male')}
                  className={cn(
                    'px-5 h-9 rounded-full text-sm font-medium transition-all active:scale-95',
                    gender === 'male'
                      ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white shadow-md shadow-[#FF6B6B]/30'
                      : 'bg-white/60 text-[#999999] border border-white/80'
                  )}
                >
                  男
                </button>
                <button
                  onClick={() => setGender('female')}
                  className={cn(
                    'px-5 h-9 rounded-full text-sm font-medium transition-all active:scale-95',
                    gender === 'female'
                      ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white shadow-md shadow-[#FF6B6B]/30'
                      : 'bg-white/60 text-[#999999] border border-white/80'
                  )}
                >
                  女
                </button>
              </div>
            </div>

            {/* 我的称呼 */}
            <div className="px-5 py-4 border-b border-white/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#999999]">我的称呼</span>
                <span className="text-xs text-[#FF8C69]">家人怎么称呼你</span>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
                {TITLE_OPTIONS.map((title) => (
                  <button
                    key={title}
                    onClick={() => handleSelectPreset(title)}
                    className={cn(
                      'px-4 min-h-9 py-2 rounded-full whitespace-nowrap flex-shrink-0 text-sm font-medium transition-all active:scale-95',
                      myTitle === title && !customTitle
                        ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white shadow-md shadow-[#FF6B6B]/25'
                        : 'bg-white/60 text-[#333333] border border-white/80'
                    )}
                  >
                    {title}
                  </button>
                ))}
              </div>
              <div className="glass-input mt-3 h-11 px-4 flex items-center">
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => handleCustomTitleChange(e.target.value)}
                  placeholder="自定义称呼"
                  maxLength={10}
                  className="w-full bg-transparent text-base text-[#333333] placeholder:text-[#999999] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 关于我卡片 */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#999999]">个性签名</span>
              <span className="text-xs text-[#999999]">{bio.length}/50</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 50))}
              placeholder="一句话介绍自己"
              className="glass-input w-full h-24 p-3 text-sm text-[#333333] resize-none placeholder:text-[#999999] focus:outline-none"
            />
          </div>

          {/* 底部保存按钮 */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-gradient w-full mt-6 text-base"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>

        {/* 头像选择底部抽屉 */}
        {showAvatarSheet && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/40 animate-fadeIn"
              onClick={() => setShowAvatarSheet(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl rounded-t-3xl max-w-[480px] mx-auto animate-slideUp border-t border-white/80">
              <div className="w-10 h-1 bg-[#FF8C69]/20 rounded-full mx-auto mt-3" />
              <div className="p-6 pb-8">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-semibold text-[#333333]">选择头像</h2>
                  <button
                    onClick={() => setShowAvatarSheet(false)}
                    className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center text-[#999999] active:scale-95 transition-transform border border-white/80"
                    aria-label="关闭"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {AVATAR_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectAvatar(opt.id)}
                      className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                    >
                      <div
                        className={cn(
                          'w-14 h-14 rounded-full bg-gradient-to-br flex items-center justify-center text-2xl ring-2 transition-all',
                          opt.bg,
                          getPresetAvatarId(avatarUrl) === opt.id
                            ? 'ring-[#FF8C69] ring-offset-2 ring-offset-white'
                            : 'ring-transparent'
                        )}
                      >
                        {opt.emoji}
                      </div>
                      <span className="text-xs text-[#999999]">{opt.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <style>{`
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes slideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
              }
              .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
              .animate-slideUp { animation: slideUp 0.3s ease-out; }
            `}</style>
          </div>
        )}
      </div>
    </>
  );
}
