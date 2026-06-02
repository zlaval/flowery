import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { X, Settings, Check } from 'lucide-react';

export default function RoutingModal() {
  const {
    nodes,
    edges,
    routingModal,
    setRoutingModal,
    updateNodeData,
  } = useStore();

  const [localRoutingTable, setLocalRoutingTable] = useState<Record<string, Record<string, boolean>>>({});
  const [selectedInboundId, setSelectedInboundId] = useState<string>('');

  // Dragging offset position state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const isInboundFromStart = (inboundEdgeId: string) => {
    const edge = edges.find((e) => e.id === inboundEdgeId);
    if (!edge) return false;
    const srcNode = nodes.find((n) => n.id === edge.source);
    return srcNode?.data.type === 'start';
  };

  // Sync state when modal opens or step transitions
  useEffect(() => {
    if (routingModal) {
      const { sourceId, targetId, edgeId, step } = routingModal;
      if (step === 'source') {
        const sourceNode = nodes.find((n) => n.id === sourceId);
        if (sourceNode) {
          setLocalRoutingTable(sourceNode.data.routingTable || {});
          const sourceInbounds = edges.filter((e) => e.target === sourceId);
          // Default to first non-start inbound, or first inbound
          const defaultInbound = sourceInbounds.find((e) => !isInboundFromStart(e.id))?.id || sourceInbounds[0]?.id || '';
          setSelectedInboundId(defaultInbound);
        }
      } else {
        const targetNode = nodes.find((n) => n.id === targetId);
        if (targetNode) {
          setLocalRoutingTable(targetNode.data.routingTable || {});
        }
        setSelectedInboundId(edgeId);
      }
    }
  }, [routingModal, nodes, edges]);

  // Handle drag movement of the modal
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // Reset relative coordinates when modal is opened
  useEffect(() => {
    if (routingModal) {
      setPosition({ x: 0, y: 0 });
    }
  }, [routingModal]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent dragging if clicking an interactive element like select, button, input etc.
    const isInteractive = (e.target as HTMLElement).closest('button, input, [role="button"], select, a');
    if (isInteractive) return;

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  if (!routingModal || !routingModal.isOpen) return null;

  const { sourceId, targetId, step } = routingModal;
  const sourceNode = nodes.find((n) => n.id === sourceId);
  const targetNode = nodes.find((n) => n.id === targetId);

  if (!sourceNode || !targetNode) return null;

  const activeNode = step === 'source' ? sourceNode : targetNode;
  const activeNodeId = step === 'source' ? sourceId : targetId;

  // Inbound connections to the active node
  const activeInbounds = edges.filter((e) => e.target === activeNodeId);
  // Outbound connections from the active node (excluding self loops)
  const activeOutbounds = edges.filter((e) => e.source === activeNodeId && e.target !== activeNodeId);

  const handleToggleOutbound = (outboundId: string) => {
    setLocalRoutingTable((prev) => {
      const row = prev[selectedInboundId] || {};
      return {
        ...prev,
        [selectedInboundId]: {
          ...row,
          [outboundId]: !row[outboundId],
        },
      };
    });
  };

  const handleSave = () => {
    updateNodeData(activeNodeId, { routingTable: localRoutingTable });

    if (step === 'source') {
      const targetOutbounds = edges.filter((e) => e.source === targetId && e.target !== targetId);
      const isTargetConfigurable = targetOutbounds.length > 0;

      if (isTargetConfigurable) {
        setRoutingModal({
          ...routingModal,
          step: 'target',
        });
      } else {
        setRoutingModal(null);
      }
    } else {
      setRoutingModal(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 p-4 animate-fade-in select-none">
      <div
        style={{
          position: 'relative',
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl flex flex-col gap-4 text-slate-100 font-sans animate-scale-in"
      >
        {/* Header */}
        <div
          onMouseDown={handleMouseDown}
          className="flex items-center justify-between border-b border-slate-800 pb-3 cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center gap-2">
            <div className="rounded-lg p-1.5 bg-indigo-950 text-indigo-400">
              <Settings size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 tracking-wide uppercase m-0">
                {step === 'source' ? 'Routing Config - Input Side' : 'Routing Config - Output Side'}
              </h3>
              <p className="text-[10px] text-slate-500 font-mono m-0 mt-0.5">
                Node: {activeNode.data.label}
              </p>
            </div>
          </div>
          <button
            onClick={() => setRoutingModal(null)}
            className="text-slate-400 hover:text-white bg-slate-950/40 p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
          {/* Dropdown for Inbound Source Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Inbound Connection (Input Source)
            </label>
            <div className="relative">
              <select
                value={selectedInboundId}
                onChange={(e) => setSelectedInboundId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
              >
                {activeInbounds.map((inbound) => {
                  const src = nodes.find((n) => n.id === inbound.source);
                  const srcName = src ? src.data.label : 'Unknown';
                  const proto = inbound.data?.connectionType?.toUpperCase() || 'REST';
                  return (
                    <option key={inbound.id} value={inbound.id} className="bg-slate-950">
                      {srcName} ({proto})
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                <svg className="fill-current h-3 w-3" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Outbound Checkboxes Checklist */}
          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
              Outbound Checkbox Checklist
            </h4>
            <p className="text-[10px] text-slate-500 leading-normal m-0 pl-2.5">
              Select which outbound destinations from {activeNode.data.label} are active when messages arrive from this input:
            </p>
            <div className="space-y-1.5 pl-2.5 mt-1">
              {activeOutbounds.map((edge) => {
                const tgt = nodes.find((n) => n.id === edge.target);
                const tgtName = tgt ? tgt.data.label : 'Unknown';
                const proto = edge.data?.connectionType?.toUpperCase() || 'REST';
                const isSelected = !!localRoutingTable[selectedInboundId]?.[edge.id];
                
                return (
                  <div
                    key={edge.id}
                    onClick={() => handleToggleOutbound(edge.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-indigo-950/20 border-indigo-500/30 text-indigo-300'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>Outbound to {tgtName} ({proto})</span>
                    <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-indigo-600 border-indigo-500' : 'border-slate-800'
                    }`}>
                      {isSelected && <Check size={10} className="text-white" />}
                    </div>
                  </div>
                );
              })}
              {activeOutbounds.length === 0 && (
                <div className="text-[10px] text-slate-500 italic p-2 border border-dashed border-slate-800/40 rounded-lg bg-slate-950/20">
                  No outgoing paths from this node.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
          <button
            onClick={() => setRoutingModal(null)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {step === 'source' && edges.filter((e) => e.source === targetId && e.target !== targetId).length > 0
              ? 'Next (Target Node)'
              : 'Apply Routing'}
          </button>
        </div>
      </div>
    </div>
  );
}
