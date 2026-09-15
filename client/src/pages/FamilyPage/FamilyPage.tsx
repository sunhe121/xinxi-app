import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  X,
  Copy,
  Check,
  Loader2,
  Trash2,
  User,
  Plus,
  ChevronRight,
  Footprints,
  Moon,
  Smile,
  Calendar,
  Pencil,
  MessageCircleHeart,
} from 'lucide-react';
import { toast } from 'sonner';
import ReactECharts from 'echarts-for-react';
import { useUser, RELATION_LABELS } from '@client/src/hooks/useUser';
import { familyApi } from '@client/src/api';
import type { FamilyRelation, FamilyMember, FamilyMemberDetail } from '@shared/api.interface';
import { cn } from '@client/src/utils/cn';
import { Image } from '@client/src/components/ui/image';

const RELATION_OPTIONS: { value: FamilyRelation; label: string }[] = [
  { value: 'father', label: '爸爸' },
  { value: 'mother', label: '妈妈' },
  { value: 'grandfather', label: '爷爷' },
  { value: 'grandmother', label: '奶奶' },
  { value: 'son', label: '儿子' },
  { value: 'daughter', label: '女儿' },
  { value: 'spouse', label: '配偶' },
  { value: 'other', label: '其他' },
];

export default function FamilyPage() {
  const navigate = useNavigate();
  const { family, refreshFamily, user } = useUser();
  const [showSheet, setShowSheet] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'redeem'>('generate');

  // 详情展开
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [memberDetail, setMemberDetail] = useState<FamilyMemberDetail | null>(null);

  // 生成邀请码
  const [selectedRelation, setSelectedRelation] = useState<FamilyRelation>('other');
  const [inviteCode, setInviteCode] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // 输入邀请码
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemRelation, setRedeemRelation] = useState<FamilyRelation>('other');
  const [redeeming, setRedeeming] = useState(false);

  // 删除确认
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  // 修改备注名
  const [showRemarkDialog, setShowRemarkDialog] = useState(false);
  const [remarkMember, setRemarkMember] = useState<FamilyMember | null>(null);
  const [remarkInput, setRemarkInput] = useState('');
  const [remarkSaving, setRemarkSaving] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 加载已有邀请码
  useEffect(() => {
    if (showSheet && activeTab === 'generate' && !inviteCode) {
      loadActiveInviteCode();
    }
  }, [showSheet, activeTab]);

  const loadActiveInviteCode = async () => {
    try {
      const res = await familyApi.getActiveInviteCode();
      if (res) {
        setInviteCode(res.code);
        setExpiresAt(res.expiresAt);
      }
    } catch {
      // 忽略错误
    }
  };

  const handleGenerateCode = async () => {
    setGenerating(true);
    try {
      const res = await familyApi.createInviteCode({ relation: selectedRelation });
      setInviteCode(res.code);
      setExpiresAt(res.expiresAt);
      toast.success('邀请码生成成功');
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : '生成失败，请重试';
      toast.error(msg);
    } finally {
      setGenerating(false);
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
      toast.error('复制失败');
    }
  };

  const handleCodeInput = (index: number, value: string) => {
    const clean = value.replace(/[^0-9a-zA-Z]/g, '').slice(0, 1).toUpperCase();
    const newCode = redeemCode.split('');
    newCode[index] = clean;
    const result = newCode.join('').padEnd(6, ' ').trim();
    setRedeemCode(result);
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !redeemCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleRedeem = async () => {
    if (redeemCode.length !== 6) {
      toast.error('请输入6位邀请码');
      return;
    }
    setRedeeming(true);
    try {
      await familyApi.redeemInviteCode({
        code: redeemCode,
        relation: redeemRelation,
      });
      toast.success('配对成功！');
      await refreshFamily();
      setShowSheet(false);
      setRedeemCode('');
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : '配对失败，请检查邀请码';
      toast.error(msg);
    } finally {
      setRedeeming(false);
    }
  };

  const handleOpenRemark = (member: FamilyMember) => {
    setRemarkMember(member);
    setRemarkInput(member.remarkName || '');
    setShowRemarkDialog(true);
  };

  const handleSaveRemark = async () => {
    if (!remarkMember) return;
    setRemarkSaving(true);
    try {
      await familyApi.updateRemarkName(remarkMember.bindingId, remarkInput.trim());
      toast.success(remarkInput.trim() ? '备注名已更新' : '已清除备注名');
      await refreshFamily();
      setShowRemarkDialog(false);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : '保存失败，请重试';
      toast.error(msg);
    } finally {
      setRemarkSaving(false);
    }
  };

  const getDisplayName = (member: FamilyMember): string => {
    return member.remarkName || member.nickname;
  };

  const handleRemove = async (bindingId: string) => {
    setRemoving(true);
    try {
      await familyApi.removeFamily(bindingId);
      toast.success('已解除关系');
      await refreshFamily();
      setRemoveId(null);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : '操作失败，请重试';
      toast.error(msg);
    } finally {
      setRemoving(false);
    }
  };

  const handleExpand = async (member: FamilyMember) => {
    if (expandedId === member.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(member.id);
    setDetailLoading(true);
    try {
      const detail = await familyApi.getMemberDetail(member.userId);
      setMemberDetail(detail);
    } catch {
      toast.error('加载详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const formatBoundDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日绑定`;
  };

  const formatLastActive = (dateStr: string): string => {
    if (!dateStr) return '暂无';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return '刚刚活跃';
    if (hours < 24) return `${hours}小时前活跃`;
    const days = Math.floor(hours / 24);
    return `${days}天前活跃`;
  };

  const getTimeRemaining = (): string => {
    if (!expiresAt) return '24小时';
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return '已过期';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}小时${minutes}分钟`;
    return `${minutes}分钟`;
  };

  const getStepsChartOption = () => {
    if (!memberDetail?.weekSteps?.length) return {};
    return {
       grid: { left: 40, right: 20, top: 20, bottom: 30 },
       xAxis: {
         type: 'category',
         data: memberDetail.weekSteps.map((item) => {
           const d = new Date(item.date);
           return `${d.getMonth() + 1}/${d.getDate()}`;
         }),
         axisLine: { lineStyle: { color: 'hsl(25 30% 90%)' } },
         axisLabel: { color: 'hsl(20 8% 50%)', fontSize: 11 },
       },
       yAxis: {
         type: 'value',
         axisLine: { show: false },
         axisTick: { show: false },
         splitLine: { lineStyle: { color: 'hsl(25 30% 90%)', type: 'dashed' } },
         axisLabel: { color: 'hsl(20 8% 50%)', fontSize: 11 },
       },
       series: [
         {
           data: memberDetail.weekSteps.map((item) => item.steps),
           type: 'line',
           smooth: true,
           lineStyle: { color: 'hsl(15 100% 70%)', width: 3 },
           itemStyle: { color: 'hsl(15 100% 70%)' },
           areaStyle: {
             color: {
               type: 'linear',
               x: 0, y: 0, x2: 0, y2: 1,
               colorStops: [
                 { offset: 0, color: 'hsla(15, 100%, 70%, 0.3)' },
                 { offset: 1, color: 'hsla(15, 100%, 70%, 0.02)' },
               ],
             },
           },
         },
       ],
       tooltip: {
         trigger: 'axis',
         backgroundColor: '#fff',
         borderColor: 'hsl(15 100% 70%)',
         textStyle: { color: 'hsl(20 15% 25%)' },
         formatter: (params: any) => {
           const p = params[0];
           return `${p.axisValue}<br/>步数：${p.value} 步`;
         },
       },
    };
  };

  const handleCloseSheet = () => {
    setShowSheet(false);
  };

  return (
    <div className="min-h-screen bg-background pb-[120px]">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur px-5 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">我的家人</h1>
        <button
          onClick={() => {
            setInviteCode('');
            setRedeemCode('');
            setShowSheet(true);
          }}
          className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center active:scale-95 transition-transform shadow-md shadow-primary/20"
          aria-label="添加家人"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      </div>

      <div className="px-5 space-y-4">
        {/* 空状态 */}
        {family.length === 0 && (
          <div className="bg-card rounded-2xl p-6 text-center shadow-sm">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus size={40} className="text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">还没有家人</h3>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              添加家人后，就能每天收到TA的温暖播报啦
            </p>
            <button
              onClick={() => navigate('/onboarding')}
              className="px-6 h-12 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold text-base shadow-sm shadow-primary/20 active:scale-[0.98] transition-all inline-flex items-center gap-2"
            >
              <UserPlus size={20} />
              立即配对
            </button>
          </div>
        )}

        {/* 家人列表 */}
        {family.length > 0 && (
          <div className="space-y-3">
            {family.map((member: FamilyMember) => (
              <div
                key={member.id}
                className="bg-card rounded-2xl shadow-sm overflow-hidden"
              >
                {/* 卡片主体 */}
                <button
                  onClick={() => handleExpand(member)}
                  className="w-full p-6 flex items-center gap-4 text-left active:bg-muted/30 transition-colors min-h-[56px]"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {member.avatarUrl ? (
                        <Image
                          src={member.avatarUrl}
                          alt={member.nickname}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={26} className="text-primary" />
                      )}
                    </div>
                    {(member.unreadReportCount ?? 0) > 0 && (
                      <span className="absolute top-0 right-0 w-3 h-3 bg-destructive rounded-full ring-2 ring-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground truncate text-lg">
                        {getDisplayName(member)}
                      </p>
                      {member.remarkName && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          ({member.nickname})
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium flex-shrink-0">
                        {RELATION_LABELS[member.relation]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      最近播报：{member.lastBroadcastAt
                        ? formatLastActive(member.lastBroadcastAt)
                        : '暂无'}
                    </p>
                  </div>
                  <ChevronRight
                    size={20}
                    className={cn(
                      'text-muted-foreground flex-shrink-0 transition-transform',
                      expandedId === member.id ? 'rotate-90' : ''
                    )}
                  />
                </button>

                {/* 展开详情 */}
                {expandedId === member.id && (
                  <div className="border-t border-border/60 p-6 space-y-5 bg-gradient-to-b from-primary/5 to-transparent">
                    {detailLoading ? (
                      <div className="py-8 text-center">
                        <Loader2 size={24} className="text-primary animate-spin mx-auto" />
                        <p className="text-sm text-muted-foreground mt-2">加载中...</p>
                      </div>
                    ) : memberDetail ? (
                      <>
                        {/* 基本信息 */}
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">所在城市</p>
                            <p className="text-base font-medium text-foreground mt-0.5">
                              {memberDetail.city || '未设置'}
                            </p>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">绑定时间</p>
                            <p className="text-base font-medium text-foreground mt-0.5">
                              {formatBoundDate(memberDetail.boundAt)}
                            </p>
                          </div>
                        </div>

                        {/* 今日数据概览 */}
                        <div className="grid grid-cols-3 gap-2">
                        <div className="bg-card rounded-xl p-4 text-center">
                             <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-primary/10 flex items-center justify-center">
                               <Footprints size={16} className="text-primary" />
                             </div>
                             <p className="text-lg font-bold text-foreground">
                               {memberDetail.dailyData?.steps?.toLocaleString() || 0}
                             </p>
                             <p className="text-xs text-muted-foreground">今日步数</p>
                           </div>
                           <div className="bg-card rounded-xl p-4 text-center">
                             <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-indigo-100 flex items-center justify-center">
                               <Moon size={16} className="text-indigo-400" />
                             </div>
                             <p className="text-lg font-bold text-foreground">
                               {memberDetail.dailyData?.sleepHours || 0}
                             </p>
                             <p className="text-xs text-muted-foreground">睡眠(小时)</p>
                           </div>
                           <div className="bg-card rounded-xl p-4 text-center">
                             <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-success/15 flex items-center justify-center">
                               <Smile size={16} className="text-success" />
                             </div>
                             <p className="text-lg font-bold text-foreground">
                               {memberDetail.dailyData?.moodIndex || 0}
                             </p>
                             <p className="text-xs text-muted-foreground">心情指数</p>
                           </div>
                        </div>

                        {/* 7天步数趋势 */}
                        {memberDetail.weekSteps && memberDetail.weekSteps.length > 0 && (
                          <div className="bg-card rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar size={16} className="text-primary" />
                              <h4 className="font-medium text-foreground text-sm">
                                7天步数趋势
                              </h4>
                            </div>
                            <div style={{ height: 150 }}>
                              <ReactECharts
                                option={getStepsChartOption()}
                                style={{ height: '100%', width: '100%' }}
                                opts={{ renderer: 'svg' }}
                              />
                            </div>
                          </div>
                        )}

                        {/* 发消息按钮 */}
                         <button
                           onClick={() => navigate(`/chat/${member.id}`)}
                           className="w-full min-h-11 py-3.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-medium text-base active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5 shadow-md shadow-primary/20"
                         >
                           <MessageCircleHeart size={18} />
                           发消息
                         </button>

                         {/* 修改备注名按钮 */}
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             handleOpenRemark(member);
                           }}
                           className="w-full min-h-11 py-3.5 bg-secondary text-foreground rounded-xl font-medium text-base active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
                         >
                           <Pencil size={18} />
                           修改备注名
                         </button>

                         {/* 查看历史播报按钮 */}
                         <button
                           onClick={() =>
                             navigate(`/history?familyId=${member.userId}`)
                           }
                           className="w-full min-h-11 py-3.5 bg-primary/10 text-primary rounded-xl font-medium text-base active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
                         >
                           查看TA的历史播报
                           <ChevronRight size={18} />
                         </button>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 添加家人底部抽屉 */}
      {showSheet && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 animate-fadeIn"
            onClick={handleCloseSheet}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl max-w-[480px] mx-auto animate-slideUp">
            {/* 顶部把手 */}
            <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3" />

            <div className="p-6 pb-8">
              {/* 标题 + 关闭 */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold">添加家人</h2>
                <button
                  onClick={handleCloseSheet}
                   className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-muted-foreground active:scale-95 transition-transform"
                  aria-label="关闭"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tab 切换 */}
              <div className="flex bg-secondary rounded-2xl p-1 mb-5">
                <button
                  onClick={() => setActiveTab('generate')}
                  className={cn(
                    'flex-1 py-3 rounded-xl text-sm font-medium transition-all',
                    activeTab === 'generate'
                      ? 'bg-card shadow-sm text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  生成邀请码
                </button>
                <button
                  onClick={() => setActiveTab('redeem')}
                  className={cn(
                    'flex-1 py-3 rounded-xl text-sm font-medium transition-all',
                    activeTab === 'redeem'
                      ? 'bg-card shadow-sm text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  输入邀请码
                </button>
              </div>

              {/* 生成邀请码 */}
              {activeTab === 'generate' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      选择对方关系
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {RELATION_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setSelectedRelation(opt.value)}
                          className={cn(
                            'py-3 rounded-xl text-sm font-medium transition-all active:scale-95',
                            selectedRelation === opt.value
                              ? 'bg-primary text-white shadow-md'
                              : 'bg-secondary text-muted-foreground'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {!inviteCode ? (
                    <button
                      onClick={handleGenerateCode}
                      disabled={generating}
                      className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-semibold text-base shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {generating ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <UserPlus size={20} />
                          生成邀请码
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-2xl p-6 text-center">
                      <p className="text-sm text-muted-foreground mb-3">
                        你的6位邀请码
                      </p>
                      <div className="text-4xl font-bold text-primary tracking-widest mb-4 tabular-nums">
                        {inviteCode}
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">
                        有效期 {getTimeRemaining()}
                      </p>
                       <button
                         onClick={handleCopyCode}
                         className="px-6 h-11 bg-primary text-white rounded-full text-sm font-medium active:scale-95 transition-transform inline-flex items-center gap-1.5"
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
                    </div>
                  )}
                </div>
              )}

              {/* 输入邀请码 */}
              {activeTab === 'redeem' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      输入6位邀请码
                    </label>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            inputRefs.current[index] = el;
                          }}
                          type="text"
                          inputMode="text"
                          maxLength={1}
                          value={redeemCode[index] || ''}
                          onChange={(e) => handleCodeInput(index, e.target.value)}
                          onKeyDown={(e) => handleCodeKeyDown(index, e)}
                          className="flex-1 h-14 text-center text-2xl font-bold rounded-xl bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all uppercase"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      对方和你的关系
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {RELATION_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setRedeemRelation(opt.value)}
                          className={cn(
                            'py-3 rounded-xl text-sm font-medium transition-all active:scale-95',
                            redeemRelation === opt.value
                              ? 'bg-primary text-white shadow-md'
                              : 'bg-secondary text-muted-foreground'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleRedeem}
                    disabled={redeemCode.length !== 6 || redeeming}
                    className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-semibold text-base shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {redeeming ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        配对中...
                      </>
                    ) : (
                      '确认配对'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 修改备注名弹窗 */}
      {showRemarkDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/40 animate-fadeIn"
            onClick={() => setShowRemarkDialog(false)}
          />
          <div className="relative bg-card rounded-2xl p-6 w-full max-w-sm animate-scaleIn">
            <h3 className="text-lg font-semibold mb-2">修改备注名</h3>
            <p className="text-sm text-muted-foreground mb-4">
              备注名只在你的设备上显示
            </p>
            <input
              type="text"
              value={remarkInput}
              onChange={(e) => setRemarkInput(e.target.value)}
              placeholder={remarkMember?.nickname || '请输入备注名'}
              maxLength={20}
              className="w-full h-12 px-4 rounded-xl bg-secondary text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/30 mb-6"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRemarkDialog(false)}
                className="flex-1 h-12 rounded-xl bg-secondary text-foreground font-medium active:scale-95 transition-transform"
              >
                取消
              </button>
              <button
                onClick={handleSaveRemark}
                disabled={remarkSaving}
                className="flex-1 h-12 rounded-xl bg-primary text-white font-medium active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {remarkSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    保存中
                  </>
                ) : (
                  '保存'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {removeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/40 animate-fadeIn"
            onClick={() => setRemoveId(null)}
          />
          <div className="relative bg-card rounded-2xl p-6 w-full max-w-sm animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Trash2 size={24} className="text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">确认解除关系</h3>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              解除后将不再收到TA的播报，确定要继续吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRemoveId(null)}
                className="flex-1 h-12 rounded-xl bg-secondary text-foreground font-medium active:scale-95 transition-transform"
              >
                取消
              </button>
              <button
                onClick={() => handleRemove(removeId)}
                disabled={removing}
                className="flex-1 h-12 rounded-xl bg-destructive text-white font-medium active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {removing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    解除中
                  </>
                ) : (
                  '确认解除'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}
