import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { X, ArrowRight, Settings, Check } from 'lucide-react';

export default function RoutingModal() {
  const {
    nodes,
    edges,
    routingModal,
    setRoutingModal,
    saveConnectionRouting,
  } = useStore();

  const [sourceRoutes, setSourceRoutes] = useState<Record<string, boolean>>({});
  const [targetRoutes, setTargetRoutes] = useState<Record<string, boolean>>({});

  // Dragging offset position state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Sync state when modal opens
  useEffect(() => {
    if (routingModal) {
      const { sourceId, targetId, edgeId } = routingModal;
      const sourceNode = nodes.find((n) => n.id === sourceId);
      const targetNode = nodes.find((n) => n.id === targetId);

      if (!sourceNode || !targetNode) return;

      // Inbound sources of Node A
      const sourceInbounds = edges.filter((e) => e.target === sourceId && e.source !== sourceId && e.id !== edgeId);
      const initialSourceRoutes: Record<string, boolean> = {};
      if (sourceNode.data.isTrigger) {
        initialSourceRoutes['trigger'] = false;
      }
      sourceInbounds.forEach((e) => {
        initialSourceRoutes[e.id] = false;
      });

      // Outbound targets of Node B
      const targetOutbounds = edges.filter((e) => e.source === targetId && e.target !== targetId && e.id !== edgeId);
      const initialTargetRoutes: Record<string, boolean> = {};
      targetOutbounds.forEach((e) => {
        initialTargetRoutes[e.id] = false;
      });

      setSourceRoutes(initialSourceRoutes);
      setTargetRoutes(initialTargetRoutes);
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
    // Prevent dragging if clicking an interactive element
    const isInteractive = (e.target as HTMLElement).closest('button, input, [role="button"], a');
    if (isInteractive) return;

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  if (!routingModal || !routingModal.isOpen) return null;

  const { sourceId, targetId, edgeId } = routingModal;
  const sourceNode = nodes.find((n) => n.id === sourceId);
  const targetNode = nodes.find((n) => n.id === targetId);

  if (!sourceNode || !targetNode) return null;

  // Inbound sources of Node A (excluding self-loops)
  const sourceInbounds = edges.filter((e) => e.target === sourceId && e.source !== sourceId && e.id !== edgeId);
  // Outbound targets of Node B (excluding self-loops)
  const targetOutbounds = edges.filter((e) => e.source === targetId && e.target !== targetId && e.id !== edgeId);

  const handleToggleSource = (inboundId: string) => {
    setSourceRoutes((prev) => ({
      ...prev,
      [inboundId]: !prev[inboundId],
    }));
  };

  const handleToggleTarget = (outboundId: string) => {
    setTargetRoutes((prev) => ({
      ...prev,
      [outboundId]: !prev[outboundId],
    }));
  };

  const handleSave = () => {
    saveConnectionRouting(sourceId, targetId, edgeId, sourceRoutes, targetRoutes);
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
                Connection Configurator
              </h3>
              <p className="text-[10px] text-slate-500 font-mono m-0 mt-0.5">
                New Edge: {edgeId.substring(0, 12)}
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

        {/* Info Visualizer */}
        <div className="flex items-center justify-center gap-3 bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 text-xs">
          <div className="text-center flex-1">
            <span className="text-[9px] uppercase font-mono text-slate-500 block mb-0.5">Source Node</span>
            <span className="font-semibold text-slate-200">{sourceNode.data.label}</span>
          </div>
          <ArrowRight size={16} className="text-indigo-400 animate-pulse" />
          <div className="text-center flex-1">
            <span className="text-[9px] uppercase font-mono text-slate-500 block mb-0.5">Target Node</span>
            <span className="font-semibold text-slate-200">{targetNode.data.label}</span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
          {/* Source node routing */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              Source Routing: Inbound to New Edge
            </h4>
            <p className="text-[10px] text-slate-500 leading-normal m-0 pl-2.5">
              Select which message sources entering {sourceNode.data.label} are allowed to trigger transmissions onto this new connection:
            </p>
            <div className="space-y-1.5 pl-2.5 mt-1">
              {sourceNode.data.isTrigger && (
                <div
                  onClick={() => handleToggleSource('trigger')}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 ${
                    sourceRoutes['trigger']
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span>Initial Trigger</span>
                  <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-colors ${
                    sourceRoutes['trigger'] ? 'bg-emerald-600 border-emerald-500' : 'border-slate-800'
                  }`}>
                    {sourceRoutes['trigger'] && <Check size={10} className="text-white" />}
                  </div>
                </div>
              )}
              {sourceInbounds.map((edge) => {
                const src = nodes.find((n) => n.id === edge.source);
                const srcName = src ? src.data.label : 'Unknown';
                const proto = edge.data?.connectionType?.toUpperCase() || 'REST';
                const isSelected = !!sourceRoutes[edge.id];
                return (
                  <div
                    key={edge.id}
                    onClick={() => handleToggleSource(edge.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>Inbound from {srcName} ({proto})</span>
                    <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-emerald-600 border-emerald-500' : 'border-slate-800'
                    }`}>
                      {isSelected && <Check size={10} className="text-white" />}
                    </div>
                  </div>
                );
              })}
              {!sourceNode.data.isTrigger && sourceInbounds.length === 0 && (
                <div className="text-[10px] text-slate-500 italic p-2 border border-dashed border-slate-800/40 rounded-lg bg-slate-950/20">
                  No incoming paths to trigger this service.
                </div>
              )}
            </div>
          </div>

          {/* Target node routing */}
          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
              Target Routing: New Edge to Outbound
            </h4>
            <p className="text-[10px] text-slate-500 leading-normal m-0 pl-2.5">
              Select which outbound destinations from {targetNode.data.label} can be reached when messages arrive from this new connection:
            </p>
            <div className="space-y-1.5 pl-2.5 mt-1">
              {targetOutbounds.map((edge) => {
                const tgt = nodes.find((n) => n.id === edge.target);
                const tgtName = tgt ? tgt.data.label : 'Unknown';
                const proto = edge.data?.connectionType?.toUpperCase() || 'REST';
                const isSelected = !!targetRoutes[edge.id];
                return (
                  <div
                    key={edge.id}
                    onClick={() => handleToggleTarget(edge.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-blue-950/20 border-blue-500/30 text-blue-300'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>Outbound to {tgtName} ({proto})</span>
                    <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-blue-600 border-blue-500' : 'border-slate-800'
                    }`}>
                      {isSelected && <Check size={10} className="text-white" />}
                    </div>
                  </div>
                );
              })}
              {targetOutbounds.length === 0 && (
                <div className="text-[10px] text-slate-500 italic p-2 border border-dashed border-slate-800/40 rounded-lg bg-slate-950/20">
                  No outgoing paths from this target.
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
            Cancel (Block Paths)
          </button>
          <button
            onClick={handleSave}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer"
          >
            Apply Routing
          </button>
        </div>
      </div>
    </div>
  );
}
