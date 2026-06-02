import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { X, Edit3 } from 'lucide-react';

export default function RenameModal() {
  const { renameModal, setRenameModal, updateNodeData } = useStore();
  const [label, setLabel] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state and focus on open
  useEffect(() => {
    if (renameModal) {
      setLabel(renameModal.currentLabel);
      // Auto focus text input
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [renameModal]);

  if (!renameModal || !renameModal.isOpen) return null;

  const handleSave = () => {
    if (label.trim()) {
      updateNodeData(renameModal.nodeId, { label: label.trim() });
    }
    setRenameModal(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setRenameModal(null);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setRenameModal(null);
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in select-none"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl flex flex-col gap-4 text-slate-100 font-sans animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg p-1.5 bg-indigo-950 text-indigo-400">
              <Edit3 size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 tracking-wide uppercase m-0">
                Rename Node
              </h3>
            </div>
          </div>
          <button
            onClick={() => setRenameModal(null)}
            className="text-slate-400 hover:text-white bg-slate-950/40 p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Node Label / Name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
          />
          <span className="text-[9px] text-slate-500 block leading-normal">
            Press Enter to save or Escape to cancel.
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
          <button
            onClick={() => setRenameModal(null)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!label.trim()}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer"
          >
            Save Name
          </button>
        </div>
      </div>
    </div>
  );
}
