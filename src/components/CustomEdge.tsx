import { memo } from 'react';
import { getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { useStore } from '../store/useStore';
import type { ConnectionType, CustomEdgeData } from '../store/useStore';
import { AlertTriangle } from 'lucide-react';

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
  graphql: {
    stroke: '#ec4899', // pink-500
    label: 'GraphQL',
  },
  soap: {
    stroke: '#14b8a6', // teal-500
    label: 'SOAP',
  },
  websocket: {
    stroke: '#3b82f6', // blue-500
    label: 'WebSocket',
  },
  tcp: {
    stroke: '#64748b', // slate-500
    label: 'TCP',
  },
  udp: {
    stroke: '#0284c7', // sky-500
    label: 'UDP',
  },
  kafka: {
    stroke: '#a855f7', // purple-500
    label: 'Kafka Topic',
  },
  rabbitmq: {
    stroke: '#f97316', // orange-500
    label: 'RabbitMQ',
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
  const failedEdges = useStore((state) => state.simulationFailedEdges);
  
  const isFailed = failedEdges.includes(id);

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
        stroke={isFailed ? '#ef4444' : selected ? '#6366f1' : strokeColor}
        strokeWidth={selected ? 3 : 2}
        strokeOpacity={selected ? 0.9 : 0.4}
        className="transition-all duration-200"
        markerEnd={markerEnd}
        style={style}
      />

      {/* Blocked/Failed visual overlay */}
      {isFailed && (
        <path
          d={edgePath}
          fill="none"
          stroke="#ef4444"
          strokeWidth={3}
          className="flow-edge-failed"
          style={{
            filter: 'drop-shadow(0 0 6px #ef4444)',
          }}
        />
      )}

      {/* Active message simulation path overlay */}
      {hasMessage && !isFailed && (
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

      {/* Connection Protocol Badge & Conditions */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan flex flex-col items-center gap-1.5"
        >
          {/* Protocol Badge */}
          <button
            onClick={handleSelect}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-950/95 border transition-all duration-200 shadow-lg cursor-pointer ${
              isFailed
                ? 'border-red-500/80 text-red-400 ring-2 ring-red-500/10'
                : selected
                ? 'border-indigo-500 text-indigo-400 ring-2 ring-indigo-500/20'
                : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            {config.label}
          </button>

          {/* Routing Condition Tag */}
          {edgeData?.routingCondition?.trim() && (
            <span
              className={`px-1.5 py-0.5 rounded border text-[8px] font-mono font-semibold shadow-md whitespace-nowrap ${
                isFailed
                  ? 'bg-red-950/90 border-red-500/30 text-red-300'
                  : 'bg-slate-950/90 border-slate-800 text-indigo-300'
              }`}
            >
              IF: {edgeData.routingCondition}
            </span>
          )}

          {/* Blocked Path Warning Badge */}
          {isFailed && (
            <span className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[8px] font-bold bg-red-950 text-red-300 border border-red-500/30 animate-bounce">
              <AlertTriangle size={8} className="fill-red-400 text-red-950" />
              Blocked
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(CustomEdge);
