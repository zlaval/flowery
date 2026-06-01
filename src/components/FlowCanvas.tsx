import { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
} from '@xyflow/react';
import type { NodeMouseHandler, EdgeMouseHandler } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useStore } from '../store/useStore';
import CustomNode from './CustomNode';
import CustomEdge from './CustomEdge';

// Register custom nodes and edges
const nodeTypes = {
  customNode: CustomNode,
} as any;

const edgeTypes = {
  customEdge: CustomEdge,
};

export default function FlowCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectElement,
    mode,
  } = useStore();

  const handleNodeClick = useCallback<NodeMouseHandler>(
    (_, node) => {
      selectElement({ type: 'node', id: node.id });
    },
    [selectElement]
  );

  const handleEdgeClick = useCallback<EdgeMouseHandler>(
    (_, edge) => {
      selectElement({ type: 'edge', id: edge.id });
    },
    [selectElement]
  );

  const handlePaneClick = useCallback(() => {
    selectElement(null);
  }, [selectElement]);

  return (
    <div className="flex-1 h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        // Restrict modifications during simulation mode
        nodesDraggable={mode === 'edit'}
        nodesConnectable={mode === 'edit'}
        edgesFocusable={mode === 'edit'}
        fitView
        className="w-full h-full"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="#334155" // slate-700
          className="opacity-40"
        />
        <Controls position="top-left" />
        <MiniMap
          position="bottom-left"
          nodeColor={(node) => {
            switch (node.data?.type) {
              case 'microservice':
                return '#10b981'; // emerald-500
              case 'database':
                return '#3b82f6'; // blue-500
              case 'kafka':
                return '#a855f7'; // purple-500
              case 'api':
                return '#f59e0b'; // amber-500
              default:
                return '#64748b'; // slate-500
            }
          }}
          maskColor="rgba(15, 23, 42, 0.7)"
          style={{
            border: '1px solid #1e293b',
            borderRadius: '8px',
            backgroundColor: '#0f172a',
          }}
        />
      </ReactFlow>
    </div>
  );
}
