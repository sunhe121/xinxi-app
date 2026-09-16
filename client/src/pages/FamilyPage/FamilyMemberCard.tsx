import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import {
  User,
  ChevronRight,
  Home,
  Smile,
  Footprints,
  MessageCircleHeart,
  Phone,
  Play,
  Calendar,
  Moon,
  MapPin,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { FamilyMember, FamilyMemberDetail } from '@shared/api.interface';
import { RELATION_LABELS } from '@client/src/hooks/useUser';
import { Image } from '@client/src/components/ui/image';
import { familyApi } from '@client/src/api';
import { toast } from 'sonner';

interface FamilyMemberCardProps {
  member: FamilyMember;
  onOpenRemark: (member: FamilyMember) => void;
  onOpenRemove: (member: FamilyMember) => void;
}

export function FamilyMemberCard({ member, onOpenRemark, onOpenRemove }: FamilyMemberCardProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [memberDetail, setMemberDetail] = useState<FamilyMemberDetail | null>(null);

  const handleExpand = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
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

  const formatLastActive = (dateStr: string): string => {
    if (!dateStr) return '暂无';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return '刚刚活跃';
    if (hours < 24) return `${hours}小时前活跃`;
    const days = Math.floor(hours / 24);
    return `${days}天前活跃`;
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
        splitLine: {
          lineStyle: { color: 'rgba(255, 140, 105, 0.1)', type: 'dashed' },
        },
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

  const getDisplayName = (m: FamilyMember): string => m.remarkName || m.nickname;

  return (
    <div className="space-y-5">
      {/* 家人卡片 */}
      <div className="glass-card p-6">
        {/* 顶部：头像 + 昵称 + 关系标签 */}
        <div className="flex items-start gap-4 mb-5">
          <div className="relative flex-shrink-0">
            <div
              className="w-16 h-16 rounded-full p-[3px]"
              style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
            >
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
              <span
                className="px-3 py-0.5 rounded-full text-white text-xs font-medium flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
              >
                {RELATION_LABELS[member.relation]}
              </span>
            </div>
            <p className="text-xs text-[#999] mt-1.5 leading-relaxed">
              {member.lastBroadcastAt
                ? `最近播报：${formatLastActive(member.lastBroadcastAt)}`
                : '暂无播报'}
            </p>
          </div>
        </div>

        {/* 中部：状态信息 */}
        <div className="flex items-center justify-around mb-5 py-2">
          <div className="text-center">
            <div className="w-9 h-9 mx-auto mb-1 rounded-full bg-white/60 flex items-center justify-center backdrop-blur-sm -webkit-backdrop-filter: blur(6px) border border-white/70">
              <Home size={18} className="text-[#FF8C69]" />
            </div>
            <p className="text-xs text-[#999]">
              {expanded && memberDetail?.dailyData
                ? memberDetail.dailyData.outingStatus === 'home'
                  ? '在家'
                  : '外出'
                : '—'}
            </p>
          </div>
          <div className="text-center">
            <div className="w-9 h-9 mx-auto mb-1 rounded-full bg-white/60 flex items-center justify-center backdrop-blur-sm -webkit-backdrop-filter: blur(6px) border border-white/70">
              <Smile size={18} className="text-[#FFB347]" />
            </div>
            <p className="text-xs text-[#999]">
              {expanded && memberDetail?.dailyData
                ? memberDetail.dailyData.moodIndex
                : '—'}
            </p>
          </div>
          <div className="text-center">
            <div className="w-9 h-9 mx-auto mb-1 rounded-full bg-white/60 flex items-center justify-center backdrop-blur-sm -webkit-backdrop-filter: blur(6px) border border-white/70">
              <Footprints size={18} className="text-[#98D8C8]" />
            </div>
            <p className="text-xs text-[#999]">
              {expanded && memberDetail?.dailyData
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
            className="flex-1 h-[52px] rounded-2xl bg-white/70 text-[#FF8C69] text-sm font-semibold flex items-center justify-center gap-1.5 border border-white/80 active:scale-[0.98] transition-all"
          >
            <MessageCircleHeart size={16} />
            发消息
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="flex-1 h-[52px] rounded-2xl bg-white/70 text-[#FF8C69] text-sm font-semibold flex items-center justify-center gap-1.5 border border-white/80 active:scale-[0.98] transition-all"
          >
            <Phone size={16} />
            打电话
          </button>
          <button
            onClick={handleExpand}
            className={`flex-1 h-[52px] rounded-2xl text-sm font-semibold flex items-center justify-center gap-1.5 border active:scale-[0.98] transition-all ${
              expanded
                ? 'text-white border-transparent shadow-md'
                : 'bg-white/70 text-[#FF8C69] border-white/80'
            }`}
            style={
              expanded
                ? { background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }
                : {}
            }
          >
            {expanded ? '收起' : '详情'}
            <ChevronRight
              size={16}
              className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* 展开详情 */}
      {expanded && (
        <div className="space-y-5">
          {detailLoading ? (
            <div className="glass-card p-8 text-center">
              <div className="w-8 h-8 text-[#FF8C69] animate-spin mx-auto">
                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <p className="text-sm text-[#999] mt-3">加载中...</p>
            </div>
          ) : memberDetail ? (
            <>
              {/* 今日状态详情卡片 */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-[#333] mb-4">今日状态</h3>
                <div className="space-y-3">
                  <div className="h-16 rounded-2xl bg-white/60 backdrop-blur-sm -webkit-backdrop-filter: blur(6px) flex items-center px-4 border border-white/70">
                    <div className="w-9 h-9 rounded-full bg-[#FF8C69]/10 flex items-center justify-center mr-3">
                      <Footprints size={18} className="text-[#FF8C69]" />
                    </div>
                    <span className="text-[#333] flex-1">步数</span>
                    <span className="text-[#333] font-semibold">
                      {(memberDetail.dailyData?.steps || 0).toLocaleString()} 步
                    </span>
                  </div>
                  <div className="h-16 rounded-2xl bg-white/60 backdrop-blur-sm -webkit-backdrop-filter: blur(6px) flex items-center px-4 border border-white/70">
                    <div className="w-9 h-9 rounded-full bg-[#74B9FF]/15 flex items-center justify-center mr-3">
                      <Moon size={18} className="text-[#74B9FF]" />
                    </div>
                    <span className="text-[#333] flex-1">睡眠</span>
                    <span className="text-[#333] font-semibold">
                      {memberDetail.dailyData?.sleepHours || 0} 小时
                    </span>
                  </div>
                  <div className="h-16 rounded-2xl bg-white/60 backdrop-blur-sm -webkit-backdrop-filter: blur(6px) flex items-center px-4 border border-white/70">
                    <div className="w-9 h-9 rounded-full bg-[#FFB347]/15 flex items-center justify-center mr-3">
                      <Smile size={18} className="text-[#FFB347]" />
                    </div>
                    <span className="text-[#333] flex-1">心情指数</span>
                    <span className="text-[#333] font-semibold">
                      {memberDetail.dailyData?.moodIndex || 0} / 10
                    </span>
                  </div>
                  <div className="h-16 rounded-2xl bg-white/60 backdrop-blur-sm -webkit-backdrop-filter: blur(6px) flex items-center px-4 border border-white/70">
                    <div className="w-9 h-9 rounded-full bg-[#98D8C8]/20 flex items-center justify-center mr-3">
                      <MapPin size={18} className="text-[#98D8C8]" />
                    </div>
                    <span className="text-[#333] flex-1">外出状态</span>
                    <span className="text-[#333] font-semibold">
                      {memberDetail.dailyData?.outingStatus === 'home' ? '在家' : '外出'}
                    </span>
                  </div>
                  <div className="h-16 rounded-2xl bg-white/60 backdrop-blur-sm -webkit-backdrop-filter: blur(6px) flex items-center px-4 border border-white/70">
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
                    <h4 className="font-semibold text-[#333] text-base">7天步数趋势</h4>
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
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#333]">最近播报</h3>
                  <button
                    onClick={() => navigate(`/history?familyId=${member.userId}`)}
                    className="text-[#FF8C69] text-sm font-medium flex items-center gap-0.5"
                  >
                    查看更多
                    <ChevronRight size={14} />
                  </button>
                </div>
                {member.lastBroadcastAt ? (
                  <div className="h-16 rounded-2xl bg-white/60 backdrop-blur-sm -webkit-backdrop-filter: blur(6px) border border-white/70 flex items-center px-4">
                    <span className="text-xs text-[#999] w-14 flex-shrink-0">今天</span>
                    <span className="flex-1 text-sm text-[#333] truncate mx-2">
                      今日温暖播报已生成，点击收听
                    </span>
                    <button
                      className="w-9 h-9 rounded-full bg-white/70 flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform border border-white/80"
                      style={{ background: 'linear-gradient(135deg, rgba(255,140,105,0.15) 0%, rgba(255,107,107,0.1) 100%)' }}
                    >
                      <Play size={14} className="text-[#FF8C69] ml-0.5" fill="#FF8C69" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-[#999] text-center py-4">暂无播报记录</p>
                )}
              </div>

              {/* 修改备注名 & 解除关系 */}
              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenRemark(member);
                  }}
                  className="flex-1 h-[52px] rounded-2xl bg-white/70 text-[#FF8C69] text-sm font-semibold flex items-center justify-center gap-1.5 border border-white/80 active:scale-[0.98] transition-all"
                >
                  <Pencil size={16} />
                  修改备注
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenRemove(member);
                  }}
                  className="flex-1 h-[52px] rounded-2xl bg-white/70 text-[#FF6B6B] text-sm font-semibold flex items-center justify-center gap-1.5 border border-white/80 active:scale-[0.98] transition-all"
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
  );
}
