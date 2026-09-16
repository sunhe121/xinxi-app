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
  Phone,
  Home,
  Play,
  MapPin,
  Clock,
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
         axisLine: { lineStyle: { color: 'rgba(255, 140, 105, 0.2)' } },
         axisLabel: { color: '#999', fontSize: 11 },
       },
       yAxis: {
         type: 'value',
         axisLine: { show: false },
         axisTick: { show: false },
         splitLine: { lineStyle: { color: 'rgba(255, 140, 105, 0.1)', type: 'dashed' } },
         axisLabel: { color: '#999', fontSize: 11 },
       },
       series: [
         {
           data: memberDetail.weekSteps.map((item) => item.steps),
           type: 'line',
           smooth: true,
           lineStyle: { color: '#FF8C69', width: 3 },
           itemStyle: { color: '#FF6B6B' },
           areaStyle: {
             color: {
               type: 'linear',
               x: 0, y: 0, x2: 0, y2: 1,
               colorStops: [
                 { offset: 0, color: 'rgba(255, 140, 105, 0.3)' },
                 { offset: 1, color: 'rgba(255, 140, 105, 0.02)' },
               ],
             },
           },
         },
       ],
       tooltip: {
         trigger: 'axis',
         backgroundColor: 'rgba(255, 255, 255, 0.95)',
         borderColor: '#FF8C69',
         textStyle: { color: '#333' },
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
    <div className="min-h-screen pb-[120px] px-5 pt-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold text-[#333]">我的家人</h1>
        <button
          onClick={() => {
            setInviteCode('');
            setRedeemCode('');
            setShowSheet(true);
          }}
          className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FF8C69] to-[#FF6B6B] text-white flex items-center justify-center active:scale-95 transition-transform shadow-lg shadow-[#FF6B6B]/30"
          aria-label="添加家人"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      </div>

      {/* 空状态 */}
      {family.length === 0 && (
        <div className="glass-card p-8 text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#FF8C69]/20 to-[#FF6B6B]/20 flex items-center justify-center">
            <UserPlus size={40} className="text-[#FF8C69]" />
          </div>
          <h3 className="text-xl font-bold text-[#333] mb-2">还没有家人</h3>
          <p className="text-sm text-[#999] mb-8 leading-relaxed">
            添加家人后，就能每天收到TA的温暖播报啦
          </p>
          <button
            onClick={() => navigate('/onboarding')}
            className="btn-gradient px-8 inline-flex items-center gap-2"
          >
            <UserPlus size={20} />
            立即配对
          </button>
        </div>
      )}

      {/* 家人列表 */}
      {family.length > 0 && (
        <div className="space-y-5">
          {family.map((member: FamilyMember) => (
            <div key={member.id}>
              {/* 家人卡片 */}
              <div className="glass-card p-6">
                {/* 顶部：头像 + 昵称 + 关系标签 */}
                <div className="flex items-start gap-4 mb-5">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-br from-[#FF8C69] to-[#FF6B6B]">
                      <div className="w-full h-full rounded-full bg-white/90 flex items-center justify-center overflow-hidden">
                        {member.avatarUrl ? (
                          <Image
                            src={member.avatarUrl}
                            alt={member.nickname}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={30} className="text-[#FF8C69]" />
                        )}
                      </div>
                    </div>
                    {(member.unreadReportCount ?? 0) > 0 && (
                      <span className="absolute top-0 right-0 w-4 h-4 bg-[#FF6B6B] rounded-full ring-2 ring-white text-white text-[10px] font-bold flex items-center justify-center">
                        {member.unreadReportCount > 9 ? '9+' : member.unreadReportCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xl font-bold text-[#333] truncate">
                        {getDisplayName(member)}
                      </p>
                      {member.remarkName && (
                        <span className="text-xs text-[#999] flex-shrink-0">
                          ({member.nickname})
                        </span>
                      )}
                      <span className="px-3 py-0.5 rounded-full bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white text-xs font-medium flex-shrink-0">
                        {RELATION_LABELS[member.relation]}
                      </span>
                    </div>
                    <p className="text-xs text-[#999] mt-1.5">
                      {member.lastBroadcastAt
                        ? `最近播报：${formatLastActive(member.lastBroadcastAt)}`
                        : '暂无播报'}
                    </p>
                  </div>
                </div>

                {/* 中部：状态信息（占位，展开后加载详情） */}
                <div className="flex items-center justify-around mb-5 py-2">
                  <div className="text-center">
                    <div className="w-9 h-9 mx-auto mb-1 rounded-full bg-white/60 flex items-center justify-center">
                      <Home size={18} className="text-[#FF8C69]" />
                    </div>
                    <p className="text-xs text-[#999]">
                      {expandedId === member.id && memberDetail?.dailyData
                        ? memberDetail.dailyData.outingStatus === 'home' ? '在家' : '外出'
                        : '—'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-9 h-9 mx-auto mb-1 rounded-full bg-white/60 flex items-center justify-center">
                      <Smile size={18} className="text-[#FFB347]" />
                    </div>
                    <p className="text-xs text-[#999]">
                      {expandedId === member.id && memberDetail?.dailyData
                        ? memberDetail.dailyData.moodIndex
                        : '—'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-9 h-9 mx-auto mb-1 rounded-full bg-white/60 flex items-center justify-center">
                      <Footprints size={18} className="text-[#98D8C8]" />
                    </div>
                    <p className="text-xs text-[#999]">
                      {expandedId === member.id && memberDetail?.dailyData
                        ? `${(memberDetail.dailyData.steps || 0).toLocaleString()}`
                        : '—'}
                    </p>
                  </div>
                </div>

                {/* 底部：操作按钮 */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/chat/${member.id}`);
                    }}
                    className="flex-1 h-11 rounded-xl bg-white/50 text-[#FF8C69] text-sm font-medium flex items-center justify-center gap-1.5 border border-white/60 active:scale-[0.97] transition-transform"
                  >
                    <MessageCircleHeart size={16} />
                    发消息
                  </button>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 h-11 rounded-xl bg-white/50 text-[#FF8C69] text-sm font-medium flex items-center justify-center gap-1.5 border border-white/60 active:scale-[0.97] transition-transform"
                  >
                    <Phone size={16} />
                    打电话
                  </button>
                  <button
                    onClick={() => handleExpand(member)}
                    className={cn(
                      'flex-1 h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 border active:scale-[0.97] transition-transform',
                      expandedId === member.id
                        ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white border-transparent'
                        : 'bg-white/50 text-[#FF8C69] border-white/60'
                    )}
                  >
                    {expandedId === member.id ? '收起' : '详情'}
                    <ChevronRight
                      size={16}
                      className={cn('transition-transform', expandedId === member.id ? 'rotate-90' : '')}
                    />
                  </button>
                </div>
              </div>

              {/* 展开详情 */}
              {expandedId === member.id && (
                <div className="space-y-5 mt-5">
                  {detailLoading ? (
                    <div className="glass-card p-8 text-center">
                      <Loader2 size={28} className="text-[#FF8C69] animate-spin mx-auto" />
                      <p className="text-sm text-[#999] mt-3">加载中...</p>
                    </div>
                  ) : memberDetail ? (
                    <>
                      {/* 今日状态详情卡片 */}
                      <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-[#333] mb-4">今日状态</h3>
                        <div className="space-y-0">
                          <div className="h-12 flex items-center border-b border-white/40">
                            <div className="w-9 h-9 rounded-full bg-[#FF8C69]/10 flex items-center justify-center mr-3">
                              <Footprints size={18} className="text-[#FF8C69]" />
                            </div>
                            <span className="text-[#333] flex-1">步数</span>
                            <span className="text-[#333] font-semibold">
                              {(memberDetail.dailyData?.steps || 0).toLocaleString()} 步
                            </span>
                          </div>
                          <div className="h-12 flex items-center border-b border-white/40">
                            <div className="w-9 h-9 rounded-full bg-[#74B9FF]/15 flex items-center justify-center mr-3">
                              <Moon size={18} className="text-[#74B9FF]" />
                            </div>
                            <span className="text-[#333] flex-1">睡眠</span>
                            <span className="text-[#333] font-semibold">
                              {memberDetail.dailyData?.sleepHours || 0} 小时
                            </span>
                          </div>
                          <div className="h-12 flex items-center border-b border-white/40">
                            <div className="w-9 h-9 rounded-full bg-[#FFB347]/15 flex items-center justify-center mr-3">
                              <Smile size={18} className="text-[#FFB347]" />
                            </div>
                            <span className="text-[#333] flex-1">心情指数</span>
                            <span className="text-[#333] font-semibold">
                              {memberDetail.dailyData?.moodIndex || 0} / 10
                            </span>
                          </div>
                          <div className="h-12 flex items-center border-b border-white/40">
                            <div className="w-9 h-9 rounded-full bg-[#98D8C8]/20 flex items-center justify-center mr-3">
                              <MapPin size={18} className="text-[#98D8C8]" />
                            </div>
                            <span className="text-[#333] flex-1">外出状态</span>
                            <span className="text-[#333] font-semibold">
                              {memberDetail.dailyData?.outingStatus === 'home' ? '在家' : '外出'}
                            </span>
                          </div>
                          <div className="h-12 flex items-center">
                            <div className="w-9 h-9 rounded-full bg-[#DDA0DD]/15 flex items-center justify-center mr-3">
                              <Phone size={18} className="text-[#DDA0DD]" />
                            </div>
                            <span className="text-[#333] flex-1">通话时长</span>
                            <span className="text-[#333] font-semibold">
                              {memberDetail.dailyData?.callDuration || 0} 分钟
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 7天步数趋势 */}
                      {memberDetail.weekSteps && memberDetail.weekSteps.length > 0 && (
                        <div className="glass-card p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar size={18} className="text-[#FF8C69]" />
                            <h4 className="font-semibold text-[#333] text-base">
                              7天步数趋势
                            </h4>
                          </div>
                          <div style={{ height: 160 }}>
                            <ReactECharts
                              option={getStepsChartOption()}
                              style={{ height: '100%', width: '100%' }}
                              opts={{ renderer: 'svg' }}
                            />
                          </div>
                        </div>
                      )}

                      {/* 最近播报 */}
                      <div className="glass-card p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-base font-semibold text-[#333]">最近播报</h3>
                          <button
                            onClick={() => navigate(`/history?familyId=${member.userId}`)}
                            className="text-[#FF8C69] text-sm font-medium flex items-center gap-0.5"
                          >
                            查看更多
                            <ChevronRight size={14} />
                          </button>
                        </div>
                        {member.lastBroadcastAt ? (
                          <div className="flex items-center py-3 border-b border-white/40">
                            <span className="text-xs text-[#999] w-14 flex-shrink-0">今天</span>
                            <span className="flex-1 text-sm text-[#333] truncate mx-2">
                              今日温暖播报已生成，点击收听
                            </span>
                            <button className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF8C69]/15 to-[#FF6B6B]/15 flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform">
                              <Play size={14} className="text-[#FF8C69] ml-0.5" fill="#FF8C69" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-[#999] text-center py-4">暂无播报记录</p>
                        )}
                      </div>

                      {/* 修改备注名 & 解除关系 */}
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenRemark(member);
                          }}
                          className="flex-1 h-11 rounded-xl bg-white/50 text-[#FF8C69] text-sm font-medium flex items-center justify-center gap-1.5 border border-white/60 active:scale-[0.97] transition-transform"
                        >
                          <Pencil size={16} />
                          修改备注
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRemoveId(member.bindingId);
                          }}
                          className="flex-1 h-11 rounded-xl bg-white/50 text-[#FF6B6B] text-sm font-medium flex items-center justify-center gap-1.5 border border-white/60 active:scale-[0.97] transition-transform"
                        >
                          <Trash2 size={16} />
                          解除关系
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 添加家人底部抽屉 */}
      {showSheet && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 animate-fadeIn"
            onClick={handleCloseSheet}
          />
          <div className="absolute bottom-0 left-0 right-0 max-w-[480px] mx-auto animate-slideUp">
            <div className="bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-2xl rounded-t-3xl border-t border-x border-white/80 shadow-2xl shadow-[#FF6B6B]/10">
              {/* 顶部把手 */}
              <div className="w-10 h-1 bg-[#FF8C69]/20 rounded-full mx-auto mt-3" />

              <div className="p-6 pb-8">
                {/* 标题 + 关闭 */}
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-[#333]">添加家人</h2>
                  <button
                    onClick={handleCloseSheet}
                    className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center text-[#999] active:scale-95 transition-transform border border-white/80"
                    aria-label="关闭"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Tab 切换 */}
                <div className="flex bg-white/50 rounded-2xl p-1 mb-5 border border-white/60">
                  <button
                    onClick={() => setActiveTab('generate')}
                    className={cn(
                      'flex-1 py-3 rounded-xl text-sm font-medium transition-all',
                      activeTab === 'generate'
                        ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white shadow-md shadow-[#FF6B6B]/20'
                        : 'text-[#999]'
                    )}
                  >
                    生成邀请码
                  </button>
                  <button
                    onClick={() => setActiveTab('redeem')}
                    className={cn(
                      'flex-1 py-3 rounded-xl text-sm font-medium transition-all',
                      activeTab === 'redeem'
                        ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white shadow-md shadow-[#FF6B6B]/20'
                        : 'text-[#999]'
                    )}
                  >
                    输入邀请码
                  </button>
                </div>

                {/* 生成邀请码 */}
                {activeTab === 'generate' && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#333]">
                        选择对方关系
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {RELATION_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setSelectedRelation(opt.value)}
                            className={cn(
                              'py-3 rounded-xl text-sm font-medium transition-all active:scale-95 border',
                              selectedRelation === opt.value
                                ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white border-transparent shadow-md shadow-[#FF6B6B]/20'
                                : 'bg-white/50 text-[#999] border-white/60'
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
                        className="btn-gradient w-full flex items-center justify-center gap-2 disabled:opacity-50"
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
                      <div className="bg-gradient-to-br from-[#FF8C69]/10 via-[#FF6B6B]/10 to-[#98D8C8]/10 rounded-2xl p-6 text-center border border-white/60">
                        <p className="text-sm text-[#999] mb-3">
                          你的6位邀请码
                        </p>
                        <div className="text-4xl font-bold text-[#FF8C69] tracking-widest mb-4 tabular-nums">
                          {inviteCode}
                        </div>
                        <p className="text-xs text-[#999] mb-4">
                          有效期 {getTimeRemaining()}
                        </p>
                         <button
                           onClick={handleCopyCode}
                           className="btn-gradient px-6 h-11 inline-flex items-center gap-1.5 !h-11 !text-sm"
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
                      <label className="text-sm font-medium text-[#333]">
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
                            className="flex-1 h-14 text-center text-2xl font-bold rounded-xl bg-white/60 border border-white/80 text-[#333] focus:outline-none focus:ring-2 focus:ring-[#FF8C69]/30 focus:border-[#FF8C69] transition-all uppercase"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#333]">
                        对方和你的关系
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {RELATION_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setRedeemRelation(opt.value)}
                            className={cn(
                              'py-3 rounded-xl text-sm font-medium transition-all active:scale-95 border',
                              redeemRelation === opt.value
                                ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white border-transparent shadow-md shadow-[#FF6B6B]/20'
                                : 'bg-white/50 text-[#999] border-white/60'
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
                      className="btn-gradient w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
      )}

      {/* 修改备注名弹窗 */}
      {showRemarkDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/40 animate-fadeIn"
            onClick={() => setShowRemarkDialog(false)}
          />
          <div className="relative glass-card rounded-3xl p-6 w-full max-w-sm animate-scaleIn">
            <h3 className="text-lg font-bold text-[#333] mb-2">修改备注名</h3>
            <p className="text-sm text-[#999] mb-4">
              备注名只在你的设备上显示
            </p>
            <input
              type="text"
              value={remarkInput}
              onChange={(e) => setRemarkInput(e.target.value)}
              placeholder={remarkMember?.nickname || '请输入备注名'}
              maxLength={20}
              className="w-full h-12 px-4 rounded-xl bg-white/60 text-[#333] text-base border border-white/80 focus:outline-none focus:ring-2 focus:ring-[#FF8C69]/30 focus:border-[#FF8C69] mb-6 transition-all"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRemarkDialog(false)}
                className="flex-1 h-12 rounded-xl bg-white/50 text-[#333] font-medium active:scale-95 transition-transform border border-white/60"
              >
                取消
              </button>
              <button
                onClick={handleSaveRemark}
                disabled={remarkSaving}
                className="flex-1 btn-gradient disabled:opacity-50 flex items-center justify-center gap-2"
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
          <div className="relative glass-card rounded-3xl p-6 w-full max-w-sm animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#FF6B6B]/15 flex items-center justify-center flex-shrink-0">
                <Trash2 size={24} className="text-[#FF6B6B]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#333]">确认解除关系</h3>
              </div>
            </div>
            <p className="text-[#999] text-sm mb-6 leading-relaxed">
              解除后将不再收到TA的播报，确定要继续吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRemoveId(null)}
                className="flex-1 h-12 rounded-xl bg-white/50 text-[#333] font-medium active:scale-95 transition-transform border border-white/60"
              >
                取消
              </button>
              <button
                onClick={() => handleRemove(removeId)}
                disabled={removing}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FF5252] text-white font-medium active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-[#FF6B6B]/25"
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
