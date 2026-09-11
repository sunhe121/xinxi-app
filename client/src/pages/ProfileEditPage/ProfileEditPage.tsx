import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  User,
  X,
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
    <div className="min-h-screen bg-background pb-24">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-[480px] mx-auto flex items-center justify-between px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-foreground active:scale-95 transition-transform"
            aria-label="返回"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-semibold text-foreground">编辑资料</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 h-9 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-medium text-sm shadow-md shadow-primary/25 active:scale-95 transition-all disabled:opacity-60"
          >
            保存
          </button>
        </div>
      </div>

      <div className="max-w-[480px] mx-auto px-5 pt-6 space-y-6">
        {/* 头像区域 */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => setShowAvatarSheet(true)}
            className="relative group active:scale-95 transition-transform"
          >
            <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-primary/20 bg-secondary flex items-center justify-center">
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
                <User size={36} className="text-muted-foreground" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg ring-2 ring-card">
              <Camera size={16} />
            </div>
          </button>
          <p className="text-sm text-muted-foreground mt-3">点击更换头像</p>
        </div>

        {/* 昵称 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">昵称</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="请输入昵称"
            maxLength={20}
            className="w-full px-4 py-3.5 bg-card border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-base"
          />
          <p className="text-xs text-muted-foreground">家人会看到这个名字</p>
        </div>

        {/* 性别 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">性别</label>
          <div className="flex gap-3">
            <button
              onClick={() => setGender('male')}
              className={cn(
                'flex-1 py-3.5 rounded-2xl font-medium transition-all active:scale-95',
                gender === 'male'
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : 'bg-secondary text-muted-foreground'
              )}
            >
              男
            </button>
            <button
              onClick={() => setGender('female')}
              className={cn(
                'flex-1 py-3.5 rounded-2xl font-medium transition-all active:scale-95',
                gender === 'female'
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : 'bg-secondary text-muted-foreground'
              )}
            >
              女
            </button>
          </div>
        </div>

        {/* 我的称呼 */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground">我的称呼</label>
            <p className="text-xs text-muted-foreground mt-0.5">
              家人怎么称呼你，会出现在播报里
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
            {TITLE_OPTIONS.map((title) => (
              <button
                key={title}
                onClick={() => handleSelectPreset(title)}
                className={cn(
                  'px-4 py-2 rounded-full whitespace-nowrap flex-shrink-0 text-sm font-medium transition-all active:scale-95',
                  myTitle === title && !customTitle
                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                    : 'bg-secondary text-foreground'
                )}
              >
                {title}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => handleCustomTitleChange(e.target.value)}
            placeholder="自定义称呼"
            maxLength={10}
            className="w-full px-4 py-3 bg-card border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
          />
        </div>

        {/* 个性签名 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">个性签名</label>
            <span className="text-xs text-muted-foreground">{bio.length}/50</span>
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 50))}
            placeholder="一句话介绍自己"
            rows={3}
            className="w-full px-4 py-3 bg-card border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-base resize-none"
          />
        </div>
      </div>

      {/* 底部保存按钮 */}
      <div className="fixed bottom-0 left-0 right-0 p-5 pb-6 bg-gradient-to-t from-background via-background/95 to-transparent max-w-[480px] mx-auto">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-semibold text-base shadow-lg shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-60"
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
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl max-w-[480px] mx-auto animate-slideUp">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3" />
            <div className="p-6 pb-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-foreground">选择头像</h2>
                <button
                  onClick={() => setShowAvatarSheet(false)}
                  className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground active:scale-95 transition-transform"
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
                          ? 'ring-primary ring-offset-2 ring-offset-card'
                          : 'ring-transparent'
                      )}
                    >
                      {opt.emoji}
                    </div>
                    <span className="text-xs text-muted-foreground">{opt.name}</span>
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
  );
}
