import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Save, FolderOpen, Network, Edit3, Cpu, Sparkles, Cloud } from 'lucide-react';

export default function Navbar() {
  const { mode, setMode, clearCanvas, nodes, edges, triggerNodeId, loadConfiguration } = useStore();
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSave = () => {
    const config = {
      version: '1.0',
      triggerNodeId,
      nodes,
      edges,
    };

    // Output to console in JSON format
    console.log('=== FLOWERY ARCHITECTURE CONFIGURATION ===');
    console.log(JSON.stringify(config, null, 2));
    console.log('==========================================');

    // Also download as file to make it easily reloadable/testable locally
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', 'flowery-architecture.json');
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setToast('Configuration saved (printed to console & downloaded).');
    } catch (error) {
      console.error('Failed to download config file', error);
      setToast('Configuration saved (printed to console).');
    }
  };

  const handleSaveToServer = async () => {
    const config = {
      version: '1.0',
      triggerNodeId,
      nodes,
      edges,
    };

    try {
      const response = await fetch('http://localhost:8080/api/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Saved to server successfully:', data);

      if (data.id) {
        await navigator.clipboard.writeText(data.id);
        setToast(`Saved to server! ID copied to clipboard: ${data.id}`);
      } else {
        setToast('Saved to server successfully!');
      }
    } catch (error: any) {
      console.error('Failed to save to server:', error);
      setToast(`Failed to save to server: ${error.message || 'Network error'}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        loadConfiguration(json);
        setToast('Configuration loaded successfully.');
      } catch (err) {
        console.error(err);
        setToast('Failed to load configuration: invalid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />
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
          onClick={handleSave}
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:border-slate-700 hover:text-white transition-all duration-200 cursor-pointer"
        >
          <Save size={14} />
          Save Local
        </button>
        <button
          onClick={handleSaveToServer}
          className="flex items-center gap-1.5 rounded-lg border border-indigo-950 bg-indigo-950/40 px-3.5 py-1.5 text-xs font-semibold text-indigo-400 hover:bg-indigo-900/50 hover:border-indigo-800 hover:text-indigo-200 transition-all duration-200 cursor-pointer"
        >
          <Cloud size={14} />
          Save to Server
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
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
