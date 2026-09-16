import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@client/src/utils/cn';

interface FestivalItem {
  id: string;
  name: string;
  date: string;
  calendarType: 'solar' | 'lunar';
  remindDaysAhead: number;
  enabled: boolean;
  isBuiltIn: boolean;
}

const BUILT_IN_FESTIVALS: FestivalItem[] = [
  { id: 'b1', name: '春节', date: '01-01', calendarType: 'lunar', remindDaysAhead: 3, enabled: true, isBuiltIn: true },
  { id: 'b2', name: '元宵节', date: '01-15', calendarType: 'lunar', remindDaysAhead: 1, enabled: true, isBuiltIn: true },
  { id: 'b3', name: '清明节', date: '04-05', calendarType: 'solar', remindDaysAhead: 1, enabled: true, isBuiltIn: true },
  { id: 'b4', name: '端午节', date: '05-05', calendarType: 'lunar', remindDaysAhead: 3, enabled: true, isBuiltIn: true },
  { id: 'b5', name: '中秋节', date: '08-15', calendarType: 'lunar', remindDaysAhead: 3, enabled: true, isBuiltIn: true },
  { id: 'b6', name: '重阳节', date: '09-09', calendarType: 'lunar', remindDaysAhead: 1, enabled: true, isBuiltIn: true },
  { id: 'b7', name: '冬至', date: '12-22', calendarType: 'solar', remindDaysAhead: 1, enabled: true, isBuiltIn: true },
  { id: 'b8', name: '元旦', date: '01-01', calendarType: 'solar', remindDaysAhead: 1, enabled: true, isBuiltIn: true },
  { id: 'b9', name: '情人节', date: '02-14', calendarType: 'solar', remindDaysAhead: 1, enabled: true, isBuiltIn: true },
  { id: 'b10', name: '母亲节', date: '5月第2个周日', calendarType: 'solar', remindDaysAhead: 3, enabled: true, isBuiltIn: true },
  { id: 'b11', name: '父亲节', date: '6月第3个周日', calendarType: 'solar', remindDaysAhead: 3, enabled: true, isBuiltIn: true },
  { id: 'b12', name: '儿童节', date: '06-01', calendarType: 'solar', remindDaysAhead: 1, enabled: true, isBuiltIn: true },
  { id: 'b13', name: '国庆节', date: '10-01', calendarType: 'solar', remindDaysAhead: 3, enabled: true, isBuiltIn: true },
  { id: 'b14', name: '感恩节', date: '11月第4个周四', calendarType: 'solar', remindDaysAhead: 1, enabled: true, isBuiltIn: true },
  { id: 'b15', name: '圣诞节', date: '12-25', calendarType: 'solar', remindDaysAhead: 1, enabled: true, isBuiltIn: true },
];

const Toggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={cn(
      'relative w-12 h-7 rounded-full transition-all flex-shrink-0',
      checked
        ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B]'
        : 'bg-white/60 border border-white/80'
    )}
  >
    <span
      className={cn(
        'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all',
        checked ? 'left-[22px]' : 'left-0.5'
      )}
    />
  </button>
);

export default function FestivalReminderPage() {
  const navigate = useNavigate();
  const [remindTime, setRemindTime] = useState('09:00');
  const [builtIns, setBuiltIns] = useState<FestivalItem[]>(BUILT_IN_FESTIVALS);
  const [customFestivals, setCustomFestivals] = useState<FestivalItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    calendarType: 'solar' as 'solar' | 'lunar',
    date: '01-01',
    remindDaysAhead: 1,
  });

  // 加载数据
  useEffect(() => {
    try {
      const time = localStorage.getItem('festival_settings');
      if (time) setRemindTime(time);
      const savedBuiltIn = localStorage.getItem('built_in_festivals');
      if (savedBuiltIn) {
        const saved = JSON.parse(savedBuiltIn) as Record<string, boolean>;
        setBuiltIns(
          BUILT_IN_FESTIVALS.map((f) => ({
            ...f,
            enabled: saved[f.id] !== undefined ? saved[f.id] : f.enabled,
          }))
        );
      }
      const customs = localStorage.getItem('custom_festivals');
      if (customs) setCustomFestivals(JSON.parse(customs));
    } catch {
      /* ignore */
    }
  }, []);

  const saveRemindTime = (time: string) => {
    setRemindTime(time);
    localStorage.setItem('festival_settings', time);
  };

  const toggleBuiltIn = (id: string) => {
    setBuiltIns((prev) => {
      const updated = prev.map((f) =>
        f.id === id ? { ...f, enabled: !f.enabled } : f
      );
      const states: Record<string, boolean> = {};
      updated.forEach((f) => {
        states[f.id] = f.enabled;
      });
      localStorage.setItem('built_in_festivals', JSON.stringify(states));
      return updated;
    });
  };

  const handleAddCustom = () => {
    if (!formData.name.trim()) {
      toast.error('请输入节日名称');
      return;
    }
    const newItem: FestivalItem = {
      id: `c_${Date.now()}`,
      name: formData.name.trim(),
      date: formData.date,
      calendarType: formData.calendarType,
      remindDaysAhead: formData.remindDaysAhead,
      enabled: true,
      isBuiltIn: false,
    };
    const updated = [...customFestivals, newItem];
    setCustomFestivals(updated);
    localStorage.setItem('custom_festivals', JSON.stringify(updated));
    setShowForm(false);
    setFormData({ name: '', calendarType: 'solar', date: '01-01', remindDaysAhead: 1 });
    toast.success('已添加');
  };

  const handleDeleteCustom = (id: string) => {
    const updated = customFestivals.filter((f) => f.id !== id);
    setCustomFestivals(updated);
    localStorage.setItem('custom_festivals', JSON.stringify(updated));
  };

  const FestivalRow = ({ item }: { item: FestivalItem }) => (
    <div className="h-16 rounded-2xl bg-white/60 backdrop-blur-sm px-4 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-base text-[#333] font-medium truncate">
            {item.name}
          </span>
          {item.isBuiltIn && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF8C69]/10 text-[#FF8C69] flex-shrink-0">
              内置
            </span>
          )}
        </div>
        <div className="text-sm text-[#999] truncate">
          {item.calendarType === 'lunar' ? '农历 ' : ''}
          {item.date} · 提前{item.remindDaysAhead}天
        </div>
      </div>
      {item.isBuiltIn ? (
        <Toggle checked={item.enabled} onChange={() => toggleBuiltIn(item.id)} />
      ) : (
        <button
          onClick={() => handleDeleteCustom(item.id)}
          className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center text-[#FF6B6B] active:scale-95 transition-transform"
          aria-label="删除"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );

  return (
    <div className="px-5 pt-6 pb-32 max-w-[480px] mx-auto animate-fade-in-up">
      {/* 顶部导航 */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="返回"
        >
          <ArrowLeft size={20} className="text-[#333]" />
        </button>
        <h1 className="text-lg font-semibold text-[#333]">节日提醒</h1>
      </div>

      <div className="space-y-5">
        {/* 提醒时间 */}
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-[#333] mb-4">提醒时间</h2>
          <div className="h-16 rounded-2xl bg-white/60 backdrop-blur-sm px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)',
                }}
              >
                <Tag size={18} className="text-white" />
              </div>
              <span className="text-base text-[#333]">统一提醒时间</span>
            </div>
            <input
              type="time"
              value={remindTime}
              onChange={(e) => saveRemindTime(e.target.value)}
              className="glass-input w-28 h-10 text-center text-sm"
            />
          </div>
        </div>

        {/* 内置节日 */}
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-[#333] mb-4">内置节日</h2>
          <div className="flex flex-col gap-3">
            {builtIns.map((f) => (
              <FestivalRow key={f.id} item={f} />
            ))}
          </div>
        </div>

        {/* 自定义节日 */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#333]">自定义节日</h2>
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-[#FF8C69] font-medium flex items-center gap-1 active:scale-95 transition-transform"
            >
              <Plus size={16} />
              添加
            </button>
          </div>
          {customFestivals.length === 0 ? (
            <div className="text-center py-8 text-sm text-[#999]">
              还没有自定义节日，点击上方添加
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {customFestivals.map((f) => (
                <FestivalRow key={f.id} item={f} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 添加表单弹层 */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/30 flex items-end justify-center z-50 animate-fade-in-up"
          onClick={() => setShowForm(false)}
        >
          <div
            className="w-full max-w-[480px] bg-white rounded-t-3xl p-6 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[#333] mb-5 text-center">
              添加自定义节日
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#333] font-medium mb-2 block">
                  节日名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="如：妈妈生日"
                  className="glass-input w-full"
                />
              </div>

              <div>
                <label className="text-sm text-[#333] font-medium mb-2 block">
                  日期类型
                </label>
                <div className="flex gap-2">
                  {(['solar', 'lunar'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() =>
                        setFormData({ ...formData, calendarType: type })
                      }
                      className={cn(
                        'flex-1 h-10 rounded-xl text-sm font-medium transition-all',
                        formData.calendarType === type
                          ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white'
                          : 'bg-white/60 text-[#333] border border-white/80'
                      )}
                    >
                      {type === 'solar' ? '公历' : '农历'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-[#333] font-medium mb-2 block">
                  日期（月-日）
                </label>
                <input
                  type="text"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  placeholder="MM-DD 如 03-15"
                  className="glass-input w-full"
                />
              </div>

              <div>
                <label className="text-sm text-[#333] font-medium mb-2 block">
                  提前几天提醒
                </label>
                <div className="flex gap-2">
                  {[1, 3, 7].map((days) => (
                    <button
                      key={days}
                      onClick={() =>
                        setFormData({ ...formData, remindDaysAhead: days })
                      }
                      className={cn(
                        'flex-1 h-10 rounded-xl text-sm font-medium transition-all',
                        formData.remindDaysAhead === days
                          ? 'bg-gradient-to-r from-[#FF8C69] to-[#FF6B6B] text-white'
                          : 'bg-white/60 text-[#333] border border-white/80'
                      )}
                    >
                      {days}天
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 h-[52px] rounded-2xl bg-white/75 border border-white/80 text-[#FF8C69] font-semibold active:scale-[0.98] transition-all"
              >
                取消
              </button>
              <button onClick={handleAddCustom} className="flex-1 btn-gradient">
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
