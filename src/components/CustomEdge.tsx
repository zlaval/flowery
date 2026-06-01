import { memo } from 'react';
import { getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { useStore } from '../store/useStore';
import type { ConnectionType, CustomEdgeData } from '../store/useStore';

const connectionStyles: Record<
  ConnectionType,
  {
    stroke: string;
    label: string;
  }
> = {
  rest: {
    stroke: '#10b981', // emerald-500
    label: 'REST (HTTP)',
  },
  grpc: {
    stroke: '#06b6d4', // cyan-500
    label: 'gRPC',
  },
  queue: {
    stroke: '#a855f7', // purple-500
    label: 'Queue (Kafka)',
  },
};

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps) => {
  const edgeData = data as CustomEdgeData | undefined;
  const connectionType = edgeData?.connectionType || 'rest';
  const hasMessage = edgeData?.hasMessage || false;

  const selectElement = useStore((state) => state.selectElement);
  const speed = useStore((state) => state.simulationSpeed);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const config = connectionStyles[connectionType] || connectionStyles.rest;
  const strokeColor = config.stroke;

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectElement({ type: 'edge', id });
  };

  return (
    <>
      {/* Invisible thick path for easier clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
        className="cursor-pointer hover:stroke-slate-800/20 transition-colors"
        onClick={handleSelect}
      />

      {/* Base static connection line */}
      <path
        d={edgePath}
        fill="none"
        stroke={selected ? '#6366f1' : strokeColor}
        strokeWidth={selected ? 3 : 2}
        strokeOpacity={selected ? 0.9 : 0.4}
        className="transition-all duration-200"
        markerEnd={markerEnd}
        style={style}
      />

      {/* Active message simulation path overlay */}
      {hasMessage && (
        <>
          {/* Animated dashed line */}
          <path
            d={edgePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth={3}
            className="flow-edge-animated"
            style={{
              '--animation-duration': `${1.5 / speed}s`,
              filter: `drop-shadow(0 0 5px ${strokeColor})`,
            } as React.CSSProperties}
          />

          {/* Animating message bubble packet traveling from source to target */}
          <circle
            r={5}
            fill={strokeColor}
            style={{ filter: `drop-shadow(0 0 4px ${strokeColor})` }}
          >
            <animateMotion
              dur={`${1.2 / speed}s`}
              repeatCount="indefinite"
              path={edgePath}
            />
          </circle>
        </>
      )}

      {/* Connection Protocol Badge */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            onClick={handleSelect}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-950/95 border transition-all duration-200 shadow-lg cursor-pointer ${
              selected
                ? 'border-indigo-500 text-indigo-400 ring-2 ring-indigo-500/20'
                : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            {config.label}
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(CustomEdge);
