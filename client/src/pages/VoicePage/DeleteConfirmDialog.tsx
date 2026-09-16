interface DeleteConfirmDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmDialog({
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div
        className="absolute inset-0 animate-fade-in"
        style={{ background: 'rgba(0, 0, 0, 0.4)' }}
        onClick={onCancel}
      />
      <div
        className="relative rounded-3xl p-6 w-full max-w-sm animate-scale-in"
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          WebkitBackdropFilter: 'blur(20px)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.85)',
          boxShadow: '0 8px 32px rgba(255, 107, 107, 0.15)',
        }}
      >
        <h3 className="text-lg font-semibold text-[#333] mb-2">确认删除</h3>
        <p className="text-sm text-[#999] mb-6" style={{ lineHeight: 1.6 }}>
          删除后录音将无法恢复，确定要删除吗？
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-[52px] rounded-2xl font-semibold active:scale-[0.98] transition-transform"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              color: '#333',
              border: '1px solid rgba(255, 255, 255, 0.8)',
            }}
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-[52px] rounded-2xl text-white font-semibold active:scale-[0.98] transition-transform"
            style={{
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)',
              boxShadow: '0 4px 16px rgba(255, 107, 107, 0.3)',
              border: 'none',
            }}
          >
            删除
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-scale-in { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}
