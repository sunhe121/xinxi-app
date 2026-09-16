import { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Pencil,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { familyApi } from '@client/src/api';
import type { FamilyMember } from '@shared/api.interface';

interface RemoveFamilyDialogProps {
  member: FamilyMember | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function RemoveFamilyDialog({ member, onClose, onSuccess }: RemoveFamilyDialogProps) {
  const [removing, setRemoving] = useState(false);

  if (!member) return null;

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await familyApi.removeFamily(member.bindingId);
      toast.success('已解除关系');
      await onSuccess();
      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : '操作失败，请重试';
      toast.error(msg);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div
        className="absolute inset-0 bg-black/40 animate-fadeIn"
        onClick={onClose}
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
            onClick={onClose}
            className="flex-1 h-[52px] rounded-2xl bg-white/70 text-[#333] font-medium active:scale-[0.98] transition-all border border-white/80"
          >
            取消
          </button>
          <button
            onClick={handleRemove}
            disabled={removing}
            className="flex-1 h-[52px] rounded-2xl text-white font-semibold active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
            style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)' }}
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
  );
}

interface RemarkDialogProps {
  member: FamilyMember | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function RemarkDialog({ member, onClose, onSuccess }: RemarkDialogProps) {
  const [remarkInput, setRemarkInput] = useState('');
  const [remarkSaving, setRemarkSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setRemarkInput(member.remarkName || '');
    }
  }, [member]);

  if (!member) return null;

  const handleSave = async () => {
    setRemarkSaving(true);
    try {
      await familyApi.updateRemarkName(member.bindingId, remarkInput.trim());
      toast.success(remarkInput.trim() ? '备注名已更新' : '已清除备注名');
      await onSuccess();
      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : '保存失败，请重试';
      toast.error(msg);
    } finally {
      setRemarkSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div
        className="absolute inset-0 bg-black/40 animate-fadeIn"
        onClick={onClose}
      />
      <div className="relative glass-card rounded-3xl p-6 w-full max-w-sm animate-scaleIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/60 flex items-center justify-center text-[#999] active:scale-95 transition-transform"
        >
          <X size={16} />
        </button>
        <h3 className="text-lg font-bold text-[#333] mb-2">修改备注名</h3>
        <p className="text-sm text-[#999] mb-4 leading-relaxed">备注名只在你的设备上显示</p>
        <input
          type="text"
          value={remarkInput}
          onChange={(e) => setRemarkInput(e.target.value)}
          placeholder={member.nickname || '请输入备注名'}
          maxLength={20}
          className="w-full h-[52px] px-4 rounded-2xl bg-white/60 text-[#333] text-base border border-white/80 focus:outline-none focus:ring-2 focus:ring-[#FF8C69]/30 focus:border-[#FF8C69] mb-6 transition-all"
          autoFocus
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-[52px] rounded-2xl bg-white/70 text-[#333] font-medium active:scale-[0.98] transition-all border border-white/80"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={remarkSaving}
            className="flex-1 h-[52px] rounded-2xl text-white font-semibold active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
            style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
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
  );
}
