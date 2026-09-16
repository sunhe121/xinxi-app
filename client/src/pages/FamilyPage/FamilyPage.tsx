import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  UserPlus,
} from 'lucide-react';
import { useUser } from '@client/src/hooks/useUser';
import type { FamilyMember } from '@shared/api.interface';
import { AddFamilySheet } from './AddFamilySheet';
import { FamilyMemberCard } from './FamilyMemberCard';
import { RemoveFamilyDialog, RemarkDialog } from './FamilyDialogs';

export default function FamilyPage() {
  const navigate = useNavigate();
  const { family, refreshFamily } = useUser();
  const [showSheet, setShowSheet] = useState(false);
  const [removeMember, setRemoveMember] = useState<FamilyMember | null>(null);
  const [remarkMember, setRemarkMember] = useState<FamilyMember | null>(null);

  const handleOpenRemark = (member: FamilyMember) => {
    setRemarkMember(member);
  };

  const handleOpenRemove = (member: FamilyMember) => {
    setRemoveMember(member);
  };

  return (
    <div className="px-5 pt-6 pb-32 space-y-5 max-w-[480px] mx-auto">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#333]">我的家人</h1>
        <button
          onClick={() => {
            setShowSheet(true);
          }}
          className="w-12 h-12 rounded-full text-white flex items-center justify-center active:scale-[0.98] transition-transform shadow-md"
          style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
          aria-label="添加家人"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      </div>

      {/* 空状态 */}
      {family.length === 0 && (
        <div className="glass-card p-6 text-center">
          <div
            className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,140,105,0.15) 0%, rgba(255,107,107,0.1) 100%)',
            }}
          >
            <UserPlus size={40} className="text-[#FF8C69]" />
          </div>
          <h3 className="text-lg font-semibold text-[#333] mb-2">还没有家人</h3>
          <p className="text-sm text-[#999] mb-6 leading-relaxed">
            添加家人后，就能每天收到TA的温暖播报啦
          </p>
          <button
            onClick={() => navigate('/onboarding')}
            className="h-[52px] px-8 rounded-2xl text-white font-semibold text-base active:scale-[0.98] transition-all inline-flex items-center gap-2 shadow-md"
            style={{ background: 'linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)' }}
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
            <FamilyMemberCard
              key={member.id}
              member={member}
              onOpenRemark={handleOpenRemark}
              onOpenRemove={handleOpenRemove}
            />
          ))}
        </div>
      )}

      {/* 添加家人底部抽屉 */}
      <AddFamilySheet
        open={showSheet}
        onClose={() => setShowSheet(false)}
        onSuccess={refreshFamily}
      />

      {/* 修改备注名弹窗 */}
      <RemarkDialog
        member={remarkMember}
        onClose={() => setRemarkMember(null)}
        onSuccess={refreshFamily}
      />

      {/* 删除确认弹窗 */}
      <RemoveFamilyDialog
        member={removeMember}
        onClose={() => setRemoveMember(null)}
        onSuccess={refreshFamily}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}
