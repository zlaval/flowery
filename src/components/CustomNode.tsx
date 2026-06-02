import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Server, Database, MessageSquare, Flame, Play, Code2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { NodeType, CustomNodeData } from '../store/useStore';

const typeConfigs: Record<
  NodeType,
  {
    colorClass: string;
    borderClass: string;
    bgClass: string;
    glowClass: string;
    icon: React.ComponentType<any>;
    typeName: string;
  }
> = {
  start: {
    colorClass: 'text-indigo-400',
    borderClass: 'border-indigo-500/30',
    bgClass: 'bg-indigo-950/20',
    glowClass: 'shadow-indigo-500/20 ring-indigo-500/40',
    icon: Play,
    typeName: 'Start Node',
  },
  microservice: {
    colorClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    bgClass: 'bg-emerald-950/20',
    glowClass: 'shadow-emerald-500/20 ring-emerald-500/40',
    icon: Server,
    typeName: 'Microservice',
  },
  database: {
    colorClass: 'text-blue-400',
    borderClass: 'border-blue-500/30',
    bgClass: 'bg-blue-950/20',
    glowClass: 'shadow-blue-500/20 ring-blue-500/40',
    icon: Database,
    typeName: 'Database',
  },
  kafka: {
    colorClass: 'text-purple-400',
    borderClass: 'border-purple-500/30',
    bgClass: 'bg-purple-950/20',
    glowClass: 'shadow-purple-500/20 ring-purple-500/40',
    icon: MessageSquare,
    typeName: 'Message Queue',
  },

  function: {
    colorClass: 'text-pink-400',
    borderClass: 'border-pink-500/30',
    bgClass: 'bg-pink-950/20',
    glowClass: 'shadow-pink-500/20 ring-pink-500/40',
    icon: Code2,
    typeName: 'Function',
  },
};

const CustomNode = ({ id, data, selected }: NodeProps<any>) => {
  const nodeData = data as CustomNodeData;
  const config = typeConfigs[nodeData.type] || typeConfigs.microservice;
  const Icon = config.icon;

  // Retrieve active simulation payload if this node holds the message
  const activePayload = useStore((state) => 
    state.activeMessages.find(m => m.locationId === id && m.locationType === 'node')?.payload
  );

  const mode = useStore((state) => state.mode);
  const setMode = useStore((state) => state.setMode);
  const startSimulation = useStore((state) => state.startSimulation);
  const setTriggerNode = useStore((state) => state.setTriggerNode);

  // Active handles config
  const activeHandles = nodeData.activeHandles || (
    nodeData.type === 'start' ? ['output'] : ['input', 'output']
  );

  // Left side spacing
  const showInputLeft = activeHandles.includes('input');
  const showOutputLeft = activeHandles.includes('output-left');
  const bothLeft = showInputLeft && showOutputLeft;

  // Right side spacing
  const showInputRight = activeHandles.includes('input-right');
  const showOutputRight = activeHandles.includes('output');
  const bothRight = showInputRight && showOutputRight;

  // Top side spacing
  const showInputTop = activeHandles.includes('input-top');
  const showOutputTop = activeHandles.includes('output-top');
  const bothTop = showInputTop && showOutputTop;

  // Bottom side spacing
  const showInputBottom = activeHandles.includes('input-bottom');
  const showOutputBottom = activeHandles.includes('output-bottom');
  const bothBottom = showInputBottom && showOutputBottom;

  const handleStartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === 'edit') {
      setTriggerNode(id);
      setMode('simulation');
      startSimulation();
    }
  };

  return (
    <div
      className={`relative w-64 rounded-xl border bg-slate-900/90 p-4 text-slate-100 shadow-2xl backdrop-blur-md transition-all duration-300 ${
        selected ? 'border-indigo-500 ring-2 ring-indigo-500/30' : nodeData.hasMessage ? 'border-indigo-400 ring-4 ring-indigo-500/50 scale-102' : config.borderClass
      } ${nodeData.hasMessage ? config.glowClass : ''}`}
    >
      {/* Handles */}
      {nodeData.type === 'start' ? (
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          style={{ top: '50%' }}
          className="!h-3 !w-3 !bg-orange-600 hover:!bg-orange-500 hover:scale-125 border border-slate-950 shadow rounded-full transition-all cursor-crosshair z-20"
        />
      ) : (
        <>
          {/* Left Side */}
          {showInputLeft && (
            <Handle
              type="target"
              position={Position.Left}
              id="input"
              style={{ top: bothLeft ? '35%' : '50%' }}
              className="!h-3 !w-3 !bg-blue-500 hover:!bg-blue-400 hover:scale-125 border border-slate-950 shadow rounded-full transition-all cursor-crosshair z-20"
            />
          )}
          {showOutputLeft && (
            <Handle
              type="source"
              position={Position.Left}
              id="output-left"
              style={{ top: bothLeft ? '65%' : '50%' }}
              className="!h-3 !w-3 !bg-orange-600 hover:!bg-orange-500 hover:scale-125 border border-slate-950 shadow rounded-full transition-all cursor-crosshair z-20"
            />
          )}

          {/* Right Side */}
          {showInputRight && (
            <Handle
              type="target"
              position={Position.Right}
              id="input-right"
              style={{ top: bothRight ? '35%' : '50%' }}
              className="!h-3 !w-3 !bg-blue-500 hover:!bg-blue-400 hover:scale-125 border border-slate-950 shadow rounded-full transition-all cursor-crosshair z-20"
            />
          )}
          {showOutputRight && (
            <Handle
              type="source"
              position={Position.Right}
              id="output"
              style={{ top: bothRight ? '65%' : '50%' }}
              className="!h-3 !w-3 !bg-orange-600 hover:!bg-orange-500 hover:scale-125 border border-slate-950 shadow rounded-full transition-all cursor-crosshair z-20"
            />
          )}

          {/* Top Side */}
          {showInputTop && (
            <Handle
              type="target"
              position={Position.Top}
              id="input-top"
              style={{ left: bothTop ? '35%' : '50%' }}
              className="!h-3 !w-3 !bg-blue-500 hover:!bg-blue-400 hover:scale-125 border border-slate-950 shadow rounded-full transition-all cursor-crosshair z-20"
            />
          )}
          {showOutputTop && (
            <Handle
              type="source"
              position={Position.Top}
              id="output-top"
              style={{ left: bothTop ? '65%' : '50%' }}
              className="!h-3 !w-3 !bg-orange-600 hover:!bg-orange-500 hover:scale-125 border border-slate-950 shadow rounded-full transition-all cursor-crosshair z-20"
            />
          )}

          {/* Bottom Side */}
          {showInputBottom && (
            <Handle
              type="target"
              position={Position.Bottom}
              id="input-bottom"
              style={{ left: bothBottom ? '35%' : '50%' }}
              className="!h-3 !w-3 !bg-blue-500 hover:!bg-blue-400 hover:scale-125 border border-slate-950 shadow rounded-full transition-all cursor-crosshair z-20"
            />
          )}
          {showOutputBottom && (
            <Handle
              type="source"
              position={Position.Bottom}
              id="output-bottom"
              style={{ left: bothBottom ? '65%' : '50%' }}
              className="!h-3 !w-3 !bg-orange-600 hover:!bg-orange-500 hover:scale-125 border border-slate-950 shadow rounded-full transition-all cursor-crosshair z-20"
            />
          )}
        </>
      )}
      
      {/* Node Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          {nodeData.type === 'start' && mode === 'edit' ? (
            <button
              onClick={handleStartClick}
              title="Run Simulation"
              className={`rounded-lg p-1.5 transition-all duration-200 cursor-pointer ${config.bgClass} ${config.colorClass} hover:bg-indigo-600 hover:text-white hover:scale-110 active:scale-95`}
            >
              <Icon size={18} />
            </button>
          ) : (
            <div className={`rounded-lg p-1.5 ${config.bgClass} ${config.colorClass}`}>
              <Icon size={18} />
            </div>
          )}
          <div>
            <h4 className="font-semibold text-sm text-slate-200 tracking-wide truncate max-w-[110px]">
              {nodeData.label}
            </h4>
            <span className="text-[10px] text-slate-400 uppercase font-mono">
              {config.typeName}
            </span>
          </div>
        </div>

        {/* Trigger Point & Active Message Badges */}
        <div className="flex gap-1 items-center">
          {nodeData.responseTemplate?.trim() && nodeData.type !== 'start' && (
            <span className="rounded px-1 py-0.5 text-[8px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-500/20" title="Mutates incoming payloads">
              TX
            </span>
          )}
          {nodeData.isTrigger && (
            <span className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-500/30 animate-pulse">
              <Flame size={10} className="fill-indigo-400" />
              Start
            </span>
          )}
          {nodeData.hasMessage && (
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
            </span>
          )}
        </div>
      </div>



      {/* Telemetry live snippet if node is holding message */}
      {nodeData.hasMessage && activePayload && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-col gap-1 text-[9px] font-mono text-slate-400">
          <span className="text-slate-500 uppercase tracking-wider text-[8px] font-bold">Live Payload Snippet</span>
          <div className="bg-slate-950 p-1.5 rounded border border-slate-800 text-indigo-300 truncate max-w-full">
            {activePayload.replace(/\s+/g, ' ')}
          </div>
        </div>
      )}


    </div>
  );
};

export default memo(CustomNode);
