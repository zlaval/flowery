import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { NodeType, ConnectionType } from '../store/useStore';
import {
  Server,
  Database,
  MessageSquare,
  Globe,
  Trash2,
  AlertCircle,
  Check,
  Sparkles,
  Flame,
} from 'lucide-react';

export default function Sidebar() {
  const {
    nodes,
    edges,
    selectedElement,
    addNode,
    updateNodeData,
    updateEdgeData,
    deleteNode,
    deleteEdge,
    triggerNodeId,
    setTriggerNode,
    mode,
  } = useStore();

  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeDesc, setNodeDesc] = useState('');
  const [nodeHost, setNodeHost] = useState('');
  const [nodePort, setNodePort] = useState('');
  const [nodeDbName, setNodeDbName] = useState('');
  const [nodeUrl, setNodeUrl] = useState('');

  const [edgeType, setEdgeType] = useState<ConnectionType>('rest');
  const [edgeDesc, setEdgeDesc] = useState('');
  const [edgePayload, setEdgePayload] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Sync selected element details with local state
  const selectedNode =
    selectedElement?.type === 'node'
      ? nodes.find((n) => n.id === selectedElement.id)
      : null;

  const selectedEdge =
    selectedElement?.type === 'edge'
      ? edges.find((e) => e.id === selectedElement.id)
      : null;

  useEffect(() => {
    if (selectedNode) {
      setNodeLabel(selectedNode.data.label || '');
      setNodeDesc(selectedNode.data.description || '');
      setNodeHost(selectedNode.data.host || '');
      setNodePort(selectedNode.data.port || '');
      setNodeDbName(selectedNode.data.dbName || '');
      setNodeUrl(selectedNode.data.url || '');
    }
  }, [selectedNode, selectedElement]);

  useEffect(() => {
    if (selectedEdge) {
      setEdgeType(selectedEdge.data?.connectionType || 'rest');
      setEdgeDesc(selectedEdge.data?.description || '');
      setEdgePayload(selectedEdge.data?.payload || '');
      setJsonError(null);
    }
  }, [selectedEdge, selectedElement]);

  const handleNodeUpdate = (field: string, val: string) => {
    if (!selectedNode) return;
    const updateData: Record<string, string> = { [field]: val };
    updateNodeData(selectedNode.id, updateData);
  };

  const handleEdgeUpdate = (field: string, val: string) => {
    if (!selectedEdge) return;
    
    if (field === 'payload') {
      setEdgePayload(val);
      try {
        JSON.parse(val);
        setJsonError(null);
        updateEdgeData(selectedEdge.id, { payload: val });
      } catch (err: any) {
        setJsonError(err.message);
      }
    } else {
      updateEdgeData(selectedEdge.id, { [field]: val });
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(edgePayload);
      const formatted = JSON.stringify(parsed, null, 2);
      setEdgePayload(formatted);
      setJsonError(null);
      if (selectedEdge) {
        updateEdgeData(selectedEdge.id, { payload: formatted });
      }
    } catch (err: any) {
      setJsonError(err.message);
    }
  };

  const nodeTypes: { type: NodeType; label: string; icon: any; color: string }[] = [
    { type: 'microservice', label: 'Microservice', icon: Server, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/10' },
    { type: 'database', label: 'Database', icon: Database, color: 'text-blue-400 border-blue-500/20 bg-blue-950/10' },
    { type: 'kafka', label: 'Message Queue', icon: MessageSquare, color: 'text-purple-400 border-purple-500/20 bg-purple-950/10' },
    { type: 'api', label: 'External API', icon: Globe, color: 'text-amber-400 border-amber-500/20 bg-amber-950/10' },
  ];

  return (
    <aside className="w-80 border-l border-slate-800 bg-slate-900/90 text-slate-100 flex flex-col h-full select-none z-10">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <h2 className="text-sm font-bold text-slate-200 tracking-wider flex items-center gap-1.5 uppercase m-0">
          <Sparkles size={16} className="text-indigo-400" />
          Dashboard
        </h2>
        {mode === 'simulation' && (
          <span className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold bg-indigo-950 text-indigo-400 border border-indigo-900">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></span>
            Simulation Active
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* ADD ELEMENTS (Only in EDIT mode) */}
        {mode === 'edit' && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Add Nodes
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {nodeTypes.map(({ type, label, icon: Icon, color }) => (
                <button
                  key={type}
                  onClick={() => addNode(type)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 hover:scale-102 hover:bg-slate-800 hover:border-slate-700 cursor-pointer group ${color}`}
                >
                  <Icon size={20} className="mb-1.5 transition-transform group-hover:scale-110" />
                  <span className="text-[10px] font-bold tracking-wide">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* INSPECTOR SECTION */}
        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider m-0">
              Inspector
            </h3>
            {selectedElement && (
              <button
                onClick={() => {
                  if (selectedElement.type === 'node') {
                    deleteNode(selectedElement.id);
                  } else {
                    deleteEdge(selectedElement.id);
                  }
                }}
                className="text-[10px] flex items-center gap-1 bg-red-950/20 text-red-400 border border-red-500/20 px-2 py-0.5 rounded hover:bg-red-900/40 hover:border-red-500/50 hover:text-red-300 transition-all duration-200 cursor-pointer"
              >
                <Trash2 size={10} />
                Delete
              </button>
            )}
          </div>

          {/* Node Selected Inspector */}
          {selectedNode && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Node Label
                </label>
                <input
                  type="text"
                  value={nodeLabel}
                  disabled={mode === 'simulation'}
                  onChange={(e) => {
                    setNodeLabel(e.target.value);
                    handleNodeUpdate('label', e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Description
                </label>
                <textarea
                  value={nodeDesc}
                  disabled={mode === 'simulation'}
                  onChange={(e) => {
                    setNodeDesc(e.target.value);
                    handleNodeUpdate('description', e.target.value);
                  }}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 resize-none disabled:opacity-50"
                />
              </div>

              {/* Dynamic Type-specific fields */}
              {selectedNode.data.type === 'microservice' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Host IP
                    </label>
                    <input
                      type="text"
                      value={nodeHost}
                      disabled={mode === 'simulation'}
                      onChange={(e) => {
                        setNodeHost(e.target.value);
                        handleNodeUpdate('host', e.target.value);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Port
                    </label>
                    <input
                      type="text"
                      value={nodePort}
                      disabled={mode === 'simulation'}
                      onChange={(e) => {
                        setNodePort(e.target.value);
                        handleNodeUpdate('port', e.target.value);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              {selectedNode.data.type === 'database' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      DB Name
                    </label>
                    <input
                      type="text"
                      value={nodeDbName}
                      disabled={mode === 'simulation'}
                      onChange={(e) => {
                        setNodeDbName(e.target.value);
                        handleNodeUpdate('dbName', e.target.value);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Port
                    </label>
                    <input
                      type="text"
                      value={nodePort}
                      disabled={mode === 'simulation'}
                      onChange={(e) => {
                        setNodePort(e.target.value);
                        handleNodeUpdate('port', e.target.value);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              {selectedNode.data.type === 'kafka' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Broker Host
                    </label>
                    <input
                      type="text"
                      value={nodeHost}
                      disabled={mode === 'simulation'}
                      onChange={(e) => {
                        setNodeHost(e.target.value);
                        handleNodeUpdate('host', e.target.value);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Broker Port
                    </label>
                    <input
                      type="text"
                      value={nodePort}
                      disabled={mode === 'simulation'}
                      onChange={(e) => {
                        setNodePort(e.target.value);
                        handleNodeUpdate('port', e.target.value);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              {selectedNode.data.type === 'api' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Base URL
                  </label>
                  <input
                    type="text"
                    value={nodeUrl}
                    disabled={mode === 'simulation'}
                    onChange={(e) => {
                      setNodeUrl(e.target.value);
                      handleNodeUpdate('url', e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>
              )}

              {/* Set Trigger Point Trigger button */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => setTriggerNode(selectedNode.id)}
                  disabled={selectedNode.id === triggerNodeId}
                  className={`w-full flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                    selectedNode.id === triggerNodeId
                      ? 'bg-indigo-950/40 text-indigo-400 border-indigo-500/20 cursor-default'
                      : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Flame size={12} className={selectedNode.id === triggerNodeId ? 'fill-indigo-400' : ''} />
                  {selectedNode.id === triggerNodeId ? 'Designated Trigger Point' : 'Set as Trigger Point'}
                </button>
              </div>

              {/* Highlight if node holds message */}
              {selectedNode.data.hasMessage && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-500/30 text-[11px] text-indigo-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span>Currently holding the message payload.</span>
                </div>
              )}
            </div>
          )}

          {/* Edge Selected Inspector */}
          {selectedEdge && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Connection Protocol
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['rest', 'grpc', 'queue'] as ConnectionType[]).map((t) => (
                    <button
                      key={t}
                      disabled={mode === 'simulation'}
                      onClick={() => {
                        setEdgeType(t);
                        handleEdgeUpdate('connectionType', t);
                      }}
                      className={`py-1 rounded-md text-[10px] font-bold uppercase border transition-all duration-200 cursor-pointer ${
                        edgeType === t
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t === 'queue' ? 'Queue' : t === 'grpc' ? 'gRPC' : 'REST'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Description
                </label>
                <input
                  type="text"
                  value={edgeDesc}
                  disabled={mode === 'simulation'}
                  onChange={(e) => {
                    setEdgeDesc(e.target.value);
                    handleEdgeUpdate('description', e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>

              {/* Message Payload Editor */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Message Payload (JSON)
                  </label>
                  <button
                    onClick={formatJson}
                    className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-950/30 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    Format
                  </button>
                </div>

                <div className="relative font-mono">
                  <textarea
                    value={edgePayload}
                    disabled={mode === 'simulation'}
                    onChange={(e) => handleEdgeUpdate('payload', e.target.value)}
                    rows={8}
                    className={`w-full bg-slate-950 border rounded-lg p-3 text-[11px] leading-relaxed text-slate-300 focus:outline-none disabled:opacity-75 ${
                      jsonError ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                  
                  {/* Status Indicator inside Code block */}
                  <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
                    {jsonError ? (
                      <span className="flex items-center gap-1 text-[9px] font-bold bg-red-950/50 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">
                        <AlertCircle size={10} />
                        Invalid JSON
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] font-bold bg-emerald-950/50 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                        <Check size={10} />
                        Valid
                      </span>
                    )}
                  </div>
                </div>

                {jsonError && (
                  <p className="text-[10px] text-red-400 mt-1 font-mono leading-normal bg-red-950/10 p-2 rounded border border-red-500/10">
                    {jsonError}
                  </p>
                )}
              </div>

              {/* Highlight if edge is simulating message */}
              {selectedEdge.data?.hasMessage && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-500/30 text-[11px] text-indigo-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span>Message packet currently transmitting.</span>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!selectedElement && (
            <div className="text-center py-8 px-4 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
              <p className="text-xs text-slate-400 leading-relaxed m-0">
                Select a node or connection line in the canvas to inspect its configuration details and payload.
              </p>
              {mode === 'edit' && (
                <p className="text-[10px] text-slate-500 mt-2 m-0">
                  Tip: Create connections by dragging between node handles.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 bg-slate-950/40 text-center font-mono">
        Active Node Count: {nodes.length} | Connections: {edges.length}
      </div>
    </aside>
  );
}
