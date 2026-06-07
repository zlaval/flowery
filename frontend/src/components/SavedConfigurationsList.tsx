import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Server, RotateCw, Clipboard, ArrowRight, Layers, Cpu, Database } from 'lucide-react';

export default function SavedConfigurationsList() {
  const { loadConfiguration, setMode } = useStore();
  const [configs, setConfigs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchConfigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8080/api/configs');
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      const data = await response.json();
      setConfigs(data);
    } catch (err: any) {
      console.error('Failed to fetch configs:', err);
      setError(err.message || 'Failed to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleLoad = (config: any) => {
    try {
      loadConfiguration(config);
      setMode('edit');
    } catch (err) {
      console.error(err);
      setToast('Failed to load configuration: invalid format.');
    }
  };

  const copyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setToast('Configuration ID copied to clipboard!');
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 h-full w-full bg-slate-950/40 p-8 overflow-y-auto flex flex-col gap-6 relative">
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Server className="text-indigo-400" size={20} />
            Server Architecture Repository
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse, restore, and edit architecture configurations saved on the active Spring Boot server.
          </p>
        </div>
        <button
          onClick={fetchConfigs}
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
        >
          <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh list
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <span className="text-sm text-slate-400 font-medium">Fetching configurations from server...</span>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto text-center gap-4">
          <div className="rounded-2xl bg-rose-950/20 border border-rose-500/20 p-4 text-rose-400 flex items-center justify-center">
            <Server size={32} />
          </div>
          <div>
            <h3 className="font-bold text-slate-200">Server Connection Failed</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Could not fetch saved configurations from <code className="text-rose-400 bg-rose-950/40 px-1 py-0.5 rounded">http://localhost:8080/api/configs</code>.
              Please verify that your Spring Boot backend service is running and accessible.
            </p>
          </div>
          <button
            onClick={fetchConfigs}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-semibold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      ) : Object.keys(configs).length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto text-center gap-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 text-slate-400 flex items-center justify-center">
            <Layers size={32} />
          </div>
          <div>
            <h3 className="font-bold text-slate-200">No Saved Configurations</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              The server repository is currently empty. Design a diagram in **Design Mode** and click **Save** to store it on the server.
            </p>
          </div>
          <button
            onClick={() => setMode('edit')}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-semibold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            Start Designing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.entries(configs).map(([id, configData]: [string, any]) => {
            const nodeCount = configData.nodes?.length || 0;
            const edgeCount = configData.edges?.length || 0;
            const startLabel = configData.nodes?.find((n: any) => n.data?.type === 'start')?.data?.label || 'Start Trigger';

            return (
              <div
                key={id}
                className="group relative rounded-xl border border-slate-800 bg-slate-900/40 p-5 hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all duration-300 flex flex-col justify-between gap-4 shadow-lg"
              >
                <div className="flex flex-col gap-2">
                  {/* Card Header ID */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-medium">Saved Diagram</span>
                    <button
                      onClick={() => copyId(id)}
                      title="Copy ID to Clipboard"
                      className="text-slate-500 hover:text-indigo-400 transition cursor-pointer"
                    >
                      <Clipboard size={14} />
                    </button>
                  </div>
                  
                  {/* Title / Trigger node name */}
                  <h3 className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors text-sm truncate" title={configData.name || 'Untitled Diagram'}>
                    {configData.name || 'Untitled Diagram'}
                  </h3>
                  
                  {/* Start Node Indicator */}
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono select-none">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    <span>Start: {startLabel}</span>
                  </div>
                  
                  {/* Truncated database ID display */}
                  <code className="text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800 font-mono select-all truncate block">
                    ID: {id}
                  </code>
                </div>

                {/* Metadata Row */}
                <div className="flex items-center gap-4 border-t border-slate-800/60 pt-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1 font-medium">
                    <Cpu size={12} className="text-slate-500" />
                    <span>{nodeCount} Nodes</span>
                  </div>
                  <div className="flex items-center gap-1 font-medium">
                    <Database size={12} className="text-slate-500" />
                    <span>{edgeCount} Paths</span>
                  </div>
                </div>

                {/* Load Button */}
                <button
                  onClick={() => handleLoad(configData)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-900 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-800 hover:border-indigo-500 py-2 text-xs font-semibold transition-all cursor-pointer group-hover:shadow-md"
                >
                  Load Architecture
                  <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating toast notification inside list view */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 shadow-2xl backdrop-blur-md animate-bounce z-50">
          <Clipboard size={14} className="text-indigo-400" />
          <p className="text-xs font-medium text-slate-200">{toast}</p>
        </div>
      )}
    </div>
  );
}
