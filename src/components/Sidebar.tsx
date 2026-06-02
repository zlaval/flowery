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
  Route,
  Terminal,
  Code2,
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
    activeMessages,
    toggleRoute,
  } = useStore();

  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeDesc, setNodeDesc] = useState('');
  const [nodeUrl, setNodeUrl] = useState('');
  
  // V2 node response template states
  const [nodeResponseTemplate, setNodeResponseTemplate] = useState('');
  const [nodeJsonError, setNodeJsonError] = useState<string | null>(null);

  // V3 routing selected inbound ID state
  const [selectedInboundId, setSelectedInboundId] = useState('trigger');

  // V2 edge routing condition and payloads
  const [edgeType, setEdgeType] = useState<ConnectionType>('rest');
  const [edgeDesc, setEdgeDesc] = useState('');
  const [edgePayload, setEdgePayload] = useState('');
  const [edgeCondition, setEdgeCondition] = useState('');
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
      setNodeUrl(selectedNode.data.url || '');
      setNodeResponseTemplate(selectedNode.data.responseTemplate || '');
      setNodeJsonError(null);
      
      const nodeInboundPaths = edges.filter((e) => e.target === selectedNode.id && e.source !== selectedNode.id);
      
      const currentIsValid = selectedInboundId === 'trigger'
        ? !!selectedNode.data.isTrigger
        : nodeInboundPaths.some(e => e.id === selectedInboundId);
      
      if (!currentIsValid) {
        const defaultInbound = selectedNode.data.isTrigger
          ? 'trigger'
          : (nodeInboundPaths[0]?.id || 'trigger');
        setSelectedInboundId(defaultInbound);
      }
    }
  }, [selectedNode, selectedElement, edges, selectedInboundId]);

  useEffect(() => {
    if (selectedEdge) {
      setEdgeType(selectedEdge.data?.connectionType || 'rest');
      setEdgeDesc(selectedEdge.data?.description || '');
      setEdgePayload(selectedEdge.data?.payload || '');
      setEdgeCondition(selectedEdge.data?.routingCondition || '');
      setJsonError(null);
    }
  }, [selectedEdge, selectedElement]);

  const handleNodeUpdate = (field: string, val: string) => {
    if (!selectedNode) return;
    updateNodeData(selectedNode.id, { [field]: val });
  };

  const handleNodeResponseTemplateChange = (val: string) => {
    if (!selectedNode) return;
    setNodeResponseTemplate(val);
    if (!val.trim()) {
      setNodeJsonError(null);
      updateNodeData(selectedNode.id, { responseTemplate: '' });
      return;
    }
    try {
      JSON.parse(val);
      setNodeJsonError(null);
      updateNodeData(selectedNode.id, { responseTemplate: val });
    } catch (err: any) {
      setNodeJsonError(err.message);
    }
  };

  const formatNodeJson = () => {
    try {
      const parsed = JSON.parse(nodeResponseTemplate);
      const formatted = JSON.stringify(parsed, null, 2);
      setNodeResponseTemplate(formatted);
      setNodeJsonError(null);
      if (selectedNode) {
        updateNodeData(selectedNode.id, { responseTemplate: formatted });
      }
    } catch (err: any) {
      setNodeJsonError(err.message);
    }
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

  const handleConditionChange = (val: string) => {
    setEdgeCondition(val);
    if (selectedEdge) {
      updateEdgeData(selectedEdge.id, { routingCondition: val });
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
    { type: 'function', label: 'Function', icon: Code2, color: 'text-pink-400 border-pink-500/20 bg-pink-950/10' },
  ];

  // Retrieve active simulation payload if any selected element currently has one
  const activeSimulationPayload = selectedNode 
    ? activeMessages.find((m) => m.locationId === selectedNode.id && m.locationType === 'node')?.payload
    : selectedEdge 
      ? activeMessages.find((m) => m.locationId === selectedEdge.id && m.locationType === 'edge')?.payload
      : null;

  // Filter outgoing paths for selected node (excluding self-loops)
  const outgoingPaths = selectedNode
    ? edges.filter((e) => e.source === selectedNode.id && e.target !== selectedNode.id)
    : [];

  // Filter inbound paths for selected node (excluding self-loops)
  const inboundPaths = selectedNode
    ? edges.filter((e) => e.target === selectedNode.id && e.source !== selectedNode.id)
    : [];

  return (
    <aside className="w-80 border-l border-slate-800 bg-slate-900/90 text-slate-100 flex flex-col h-full select-none z-10 font-sans">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <h2 className="text-sm font-bold text-slate-200 tracking-wider flex items-center gap-1.5 uppercase m-0">
          <Sparkles size={16} className="text-indigo-400" />
          Dashboard
        </h2>
        {mode === 'simulation' && (
          <span className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold bg-indigo-950 text-indigo-400 border border-indigo-900 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
            Sim Active
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

          {/* V3 Live Payload Reader during Simulation */}
          {mode === 'simulation' && activeSimulationPayload && (
            <div className="space-y-2 p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 animate-pulse">
              <div className="flex justify-between items-center select-none">
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Terminal size={12} />
                  Active Telemetry
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-mono text-emerald-400 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-48 scrollbar-thin">
                {activeSimulationPayload}
              </pre>
            </div>
          )}

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

              {/* V2 Node Response Template Editor */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Response Template (JSON)
                  </label>
                  <button
                    onClick={formatNodeJson}
                    className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-950/30 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    Format
                  </button>
                </div>
                <div className="relative font-mono">
                  <textarea
                    value={nodeResponseTemplate}
                    disabled={mode === 'simulation'}
                    onChange={(e) => handleNodeResponseTemplateChange(e.target.value)}
                    placeholder='{"status": "SUCCESS"}'
                    rows={6}
                    className={`w-full bg-slate-950 border rounded-lg p-3 text-[11px] leading-relaxed text-slate-300 focus:outline-none disabled:opacity-75 ${
                      nodeJsonError ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                  {nodeResponseTemplate.trim() && (
                    <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
                      {nodeJsonError ? (
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
                  )}
                </div>
                {nodeJsonError && (
                  <p className="text-[10px] text-red-400 mt-1 font-mono leading-normal bg-red-950/10 p-2 rounded border border-red-500/10">
                    {nodeJsonError}
                  </p>
                )}
                <span className="text-[9px] text-slate-500 block leading-normal">
                  If set, outgoing connection payloads will merge with or be overridden by this template.
                </span>
              </div>

              {/* V3 Outbound Routing Table Section */}
              <div className="space-y-3.5 pt-2.5 border-t border-slate-800/80">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Node Routing Table
                </label>

                {/* Inbound Selection */}
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                    Inbound Connection (Source)
                  </span>
                  <select
                    value={selectedInboundId}
                    disabled={mode === 'simulation'}
                    onChange={(e) => setSelectedInboundId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  >
                    {selectedNode.data.isTrigger && (
                      <option value="trigger">Initial Trigger</option>
                    )}
                    {inboundPaths.map((edge) => {
                      const sourceNode = nodes.find((n) => n.id === edge.source);
                      const sourceName = sourceNode ? sourceNode.data.label : 'Unknown';
                      const protocol = edge.data?.connectionType?.toUpperCase() || 'REST';
                      return (
                        <option key={edge.id} value={edge.id}>
                          {sourceName} ({protocol})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Outbound Paths Checklist */}
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                    Allowed Outbound Paths
                  </span>
                  {outgoingPaths.length > 0 ? (
                    <div className="space-y-1.5 bg-slate-950 p-2.5 rounded-lg border border-slate-800 max-h-36 overflow-y-auto scrollbar-thin select-none">
                      {outgoingPaths.map((edge) => {
                        const target = nodes.find((n) => n.id === edge.target);
                        const targetName = target ? target.data.label : 'Unknown Node';
                        const protocol = edge.data?.connectionType?.toUpperCase() || 'REST';
                        const isChecked = selectedNode.data.routingTable?.[selectedInboundId]?.[edge.id] === true;

                        return (
                          <div key={edge.id} className="flex items-center justify-between text-xs text-slate-300 py-0.5">
                            <span className="truncate max-w-[170px]" title={`➔ ${targetName} (${protocol})`}>
                              ➔ {targetName} <span className="text-[9px] font-mono text-slate-500 font-bold">({protocol})</span>
                            </span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={mode === 'simulation'}
                              onChange={() => toggleRoute(selectedNode.id, selectedInboundId, edge.id, !isChecked)}
                              className="h-4.5 w-4.5 rounded border-slate-800 text-indigo-600 bg-slate-950 focus:ring-indigo-500 cursor-pointer accent-indigo-500 disabled:opacity-50 transition-colors"
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 italic m-0 bg-slate-950/40 p-2.5 border border-dashed border-slate-800/40 rounded-lg">
                      No outgoing connections from this node.
                    </p>
                  )}
                </div>

                <span className="text-[9px] text-slate-500 block leading-normal">
                  Opt-out routing: Uncheck paths to block message propagation for messages entering from the selected inbound connection.
                </span>
              </div>

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
            </div>
          )}

          {/* Edge Selected Inspector */}
          {selectedEdge && (
            <div className="space-y-4">
              {/* V2 Protocol Selection Layer Sections */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Connection Protocol
                </label>
                
                {/* Application Layer protocols */}
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Application Layer</span>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      ['rest', 'REST'],
                      ['grpc', 'gRPC'],
                      ['graphql', 'GraphQL'],
                      ['soap', 'SOAP'],
                      ['websocket', 'WS'],
                    ].map(([t, label]) => (
                      <button
                        key={t}
                        disabled={mode === 'simulation'}
                        onClick={() => {
                          setEdgeType(t as ConnectionType);
                          handleEdgeUpdate('connectionType', t);
                        }}
                        className={`py-1 rounded-md text-[9px] font-bold border transition-all duration-200 cursor-pointer ${
                          edgeType === t
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transport Layer protocols */}
                <div className="space-y-1 pt-1.5">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Transport Layer</span>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      ['tcp', 'TCP'],
                      ['udp', 'UDP'],
                    ].map(([t, label]) => (
                      <button
                        key={t}
                        disabled={mode === 'simulation'}
                        onClick={() => {
                          setEdgeType(t as ConnectionType);
                          handleEdgeUpdate('connectionType', t);
                        }}
                        className={`py-1 rounded-md text-[9px] font-bold border transition-all duration-200 cursor-pointer ${
                          edgeType === t
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Queues / Messaging Layer protocols */}
                <div className="space-y-1 pt-1.5">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Message Brokers</span>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      ['kafka', 'Kafka'],
                      ['rabbitmq', 'RabbitMQ'],
                    ].map(([t, label]) => (
                      <button
                        key={t}
                        disabled={mode === 'simulation'}
                        onClick={() => {
                          setEdgeType(t as ConnectionType);
                          handleEdgeUpdate('connectionType', t);
                        }}
                        className={`py-1 rounded-md text-[9px] font-bold border transition-all duration-200 cursor-pointer ${
                          edgeType === t
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
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

              {/* V2 Routing Condition IF logic */}
              <div className="space-y-1.5 pt-2.5 border-t border-slate-800/80">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 block">
                  <Route size={12} className="text-indigo-400" />
                  Routing Condition (IF Expression)
                </label>
                <input
                  type="text"
                  value={edgeCondition}
                  disabled={mode === 'simulation'}
                  placeholder="e.g. payload.amount > 100"
                  onChange={(e) => handleConditionChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
                
                {/* Condition Tip Box */}
                <div className="bg-slate-950/80 p-2.5 border border-slate-800 rounded-lg text-[9px] text-slate-400 font-mono leading-normal space-y-1">
                  <span className="text-slate-500 uppercase font-bold text-[8px] block">Formatting Examples:</span>
                  <p className="m-0 text-slate-300">`price &gt; 100`</p>
                  <p className="m-0 text-slate-300">`status === "ACTIVE"`</p>
                  <p className="m-0 text-slate-300">`payload.requires_shipping === true`</p>
                  <p className="m-0 text-slate-500">If evaluation is false, this connection path is blocked and flashes red.</p>
                </div>
              </div>

              {/* Message Payload Editor */}
              <div className="space-y-1.5 pt-2.5 border-t border-slate-800/80">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Default Message Payload (JSON)
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
                    rows={6}
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
                  Tip: Create connections by dragging between node handles. Right-click anywhere for context tools.
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
