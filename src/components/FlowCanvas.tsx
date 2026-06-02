import { useCallback, useState, useEffect } from 'react';
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
import { Server, Database, MessageSquare, Copy, Trash2, Flame, Code2 } from 'lucide-react';

// Register custom nodes and edges
const nodeTypes = {
  customNode: CustomNode,
} as any;

const edgeTypes = {
  customEdge: CustomEdge,
};

interface MenuState {
  visible: boolean;
  x: number;
  y: number;
  nodeId?: string;
}

export default function FlowCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectElement,
    mode,
    addNode,
    duplicateNode,
    deleteNode,
    setTriggerNode,
    setRenameModal,
  } = useStore();

  const [menu, setMenu] = useState<MenuState>({ visible: false, x: 0, y: 0 });

  const handleNodeClick = useCallback<NodeMouseHandler>(
    (_, node) => {
      selectElement({ type: 'node', id: node.id });
      if (mode === 'edit') {
        setRenameModal({
          isOpen: true,
          nodeId: node.id,
          currentLabel: (node.data as any).label || '',
        });
      }
    },
    [selectElement, mode, setRenameModal]
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

  const onNodeContextMenu = useCallback(
    (event: any, node: any) => {
      event.preventDefault();
      setMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
      });
    },
    [setMenu]
  );

  const onPaneContextMenu = useCallback(
    (event: any) => {
      event.preventDefault();
      setMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
      });
    },
    [setMenu]
  );

  // Close context menu on any standard click outside
  useEffect(() => {
    const handleCloseMenu = () => {
      if (menu.visible) {
        setMenu({ visible: false, x: 0, y: 0 });
      }
    };
    window.addEventListener('click', handleCloseMenu);
    return () => {
      window.removeEventListener('click', handleCloseMenu);
    };
  }, [menu.visible]);

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
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
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
              case 'function':
                return '#ec4899'; // pink-500
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

      {/* Floating Custom Right-Click Context Menu */}
      {menu.visible && (
        <div
          style={{ top: menu.y, left: menu.x }}
          className="fixed z-50 min-w-[170px] bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl p-1.5 backdrop-blur-md select-none font-sans"
        >
          {menu.nodeId ? (
            // Node Context Options
            <div className="space-y-0.5">
              <button
                onClick={() => setTriggerNode(menu.nodeId!)}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-indigo-600 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Flame size={13} className="text-indigo-400" />
                Set as Trigger
              </button>
              {mode === 'edit' && (
                <>
                  <button
                    onClick={() => duplicateNode(menu.nodeId!)}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-indigo-600 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Copy size={13} className="text-emerald-400" />
                    Duplicate Node
                  </button>
                  <button
                    onClick={() => deleteNode(menu.nodeId!)}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-red-400 hover:text-white hover:bg-red-600 rounded-lg flex items-center gap-2 cursor-pointer transition-colors animate-pulse"
                  >
                    <Trash2 size={13} />
                    Delete Node
                  </button>
                </>
              )}
            </div>
          ) : (
            // Pane Canvas Context Options
            <div className="space-y-0.5">
              {mode === 'edit' ? (
                <>
                  <button
                    onClick={() => addNode('microservice')}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-indigo-600 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Server size={13} className="text-emerald-400" />
                    Add Microservice
                  </button>
                  <button
                    onClick={() => addNode('database')}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-indigo-600 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Database size={13} className="text-blue-400" />
                    Add Database
                  </button>
                  <button
                    onClick={() => addNode('kafka')}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-indigo-600 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <MessageSquare size={13} className="text-purple-400" />
                    Add Queue
                  </button>
                  <button
                    onClick={() => addNode('function')}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-indigo-600 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Code2 size={13} className="text-pink-400" />
                    Add Function
                  </button>
                </>
              ) : (
                <div className="px-3 py-1.5 text-slate-500 text-[10px] font-mono">
                  Simulation Active (Locked)
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
