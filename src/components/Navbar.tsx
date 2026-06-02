import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Save, FolderOpen, Network, Edit3, Cpu, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { mode, setMode, clearCanvas, nodes, edges } = useStore();
  const [toast, setToast] = useState<string | null>(null);

  // Auto-clear toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleNew = () => {
    if (nodes.length <= 1 && edges.length === 0) return;
    const confirmClear = window.confirm(
      'Are you sure you want to clear the canvas? This will delete all nodes and connections.'
    );
    if (confirmClear) {
      clearCanvas();
      setToast('Canvas cleared successfully.');
    }
  };

  const handleMockAction = (actionName: string) => {
    setToast(`${actionName}: Feature coming soon in the next version!`);
  };

  return (
    <header className="relative flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950 px-6 z-20">
      {/* Branding Logo */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
          <Network size={20} className="animate-pulse" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-100 tracking-wide m-0 p-0 flex items-center gap-1.5 leading-none">
            Flowery <span className="text-xs font-medium text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-900">v1.0</span>
          </h1>
          <span className="text-[10px] text-slate-400 font-mono tracking-wider block mt-1 uppercase">
            Architecture Flow Simulator
          </span>
        </div>
      </div>

      {/* Editor / Simulation Mode Toggle Switch */}
      <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800">
        <button
          onClick={() => setMode('edit')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
            mode === 'edit'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Edit3 size={14} />
          Design Mode
        </button>
        <button
          onClick={() => setMode('simulation')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
            mode === 'simulation'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu size={14} />
          Simulate Mode
        </button>
      </div>

      {/* Top Operations Panel */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleNew}
          disabled={nodes.length <= 1 && edges.length === 0}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold border transition-all duration-200 cursor-pointer ${
            nodes.length <= 1 && edges.length === 0
              ? 'border-slate-800 text-slate-600 bg-slate-950/20 cursor-not-allowed'
              : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:border-slate-700 hover:text-white'
          }`}
        >
          <Plus size={14} />
          New
        </button>
        <button
          onClick={() => handleMockAction('Save Architecture')}
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:border-slate-700 hover:text-white transition-all duration-200 cursor-pointer"
        >
          <Save size={14} />
          Save
        </button>
        <button
          onClick={() => handleMockAction('Open Design')}
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:border-slate-700 hover:text-white transition-all duration-200 cursor-pointer"
        >
          <FolderOpen size={14} />
          Open
        </button>
      </div>

      {/* Floating Premium Toast Notifications */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 shadow-2xl backdrop-blur-md animate-bounce z-50">
          <Sparkles size={16} className="text-indigo-400" />
          <p className="text-xs font-medium text-slate-200">{toast}</p>
        </div>
      )}
    </header>
  );
}
