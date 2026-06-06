import { useStore } from '../store/useStore';
import { Play, Pause, SkipForward, Square, Gauge, Info, Flame } from 'lucide-react';

export default function ControlPanel() {
  const {
    mode,
    status,
    simulationSpeed,
    currentStep,
    triggerNodeId,
    nodes,
    startSimulation,
    pauseSimulation,
    stopSimulation,
    stepSimulation,
    setSpeed,
  } = useStore();

  if (mode !== 'simulation') return null;

  const triggerNode = nodes.find((n) => n.id === triggerNodeId);
  const triggerLabel = triggerNode ? triggerNode.data.label : 'None';

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-6 z-10 transition-all duration-300 animate-slide-up">
      {/* Simulation Info Summary */}
      <div className="flex flex-col border-r border-slate-800 pr-5 select-none font-mono">
        <span className="text-[9px] text-slate-500 uppercase tracking-wider block">
          Trigger Node
        </span>
        <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1 mt-0.5 truncate max-w-[120px]" title={triggerLabel}>
          <Flame size={12} className="fill-indigo-500/20 text-indigo-400" />
          {triggerLabel}
        </span>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex items-center gap-2">
        {status !== 'running' ? (
          <button
            onClick={startSimulation}
            disabled={!triggerNodeId}
            title="Start / Play Simulation"
            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer shadow-lg hover:scale-105 active:scale-95 ${
              !triggerNodeId
                ? 'border-slate-800 bg-slate-950 text-slate-600 cursor-not-allowed'
                : 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/30 hover:border-emerald-400'
            }`}
          >
            <Play size={18} className="fill-emerald-400/10" />
          </button>
        ) : (
          <button
            onClick={pauseSimulation}
            title="Pause Simulation"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-400 hover:bg-amber-900/30 hover:border-amber-400 transition-all duration-200 cursor-pointer shadow-lg hover:scale-105 active:scale-95"
          >
            <Pause size={18} className="fill-amber-400/10" />
          </button>
        )}

        <button
          onClick={stepSimulation}
          disabled={status === 'stopped' || status === 'running'}
          title="Step to Next Node/Edge (only when paused)"
          className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 shadow-lg cursor-pointer ${
            status === 'stopped' || status === 'running'
              ? 'border-slate-800 bg-slate-950/20 text-slate-600 cursor-not-allowed'
              : 'border-cyan-500/30 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-900/30 hover:border-cyan-400 hover:scale-105 active:scale-95'
          }`}
        >
          <SkipForward size={18} />
        </button>

        <button
          onClick={stopSimulation}
          title="Reset to Edit Mode"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-900/30 hover:border-red-400 transition-all duration-200 cursor-pointer shadow-lg hover:scale-105 active:scale-95"
        >
          <Square size={16} className="fill-red-400/10" />
        </button>
      </div>

      {/* Speed Slider Governance */}
      <div className="flex items-center gap-3 border-l border-slate-800 pl-5">
        <div className="flex items-center gap-1.5 text-slate-400 select-none">
          <Gauge size={16} className="text-slate-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Speed:</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0.25"
            max="3"
            step="0.25"
            value={simulationSpeed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
          />
          <span className="text-xs font-mono font-bold text-slate-200 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 w-12 text-center">
            {simulationSpeed.toFixed(2)}x
          </span>
        </div>
      </div>

      {/* Progress tick Counter */}
      <div className="flex flex-col border-l border-slate-800 pl-5 font-mono select-none">
        <span className="text-[9px] text-slate-500 uppercase tracking-wider block">
          Simulation Step
        </span>
        <span className="text-xs font-semibold text-slate-300 mt-0.5 text-center">
          #{currentStep}
        </span>
      </div>

      {/* Help tooltip if not configured */}
      {!triggerNodeId && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-red-950/80 border border-red-500/20 rounded-lg text-[10px] text-red-300 font-mono shadow-2xl backdrop-blur">
          <Info size={12} />
          Choose a Trigger Node in Design Mode to start.
        </div>
      )}
    </div>
  );
}
