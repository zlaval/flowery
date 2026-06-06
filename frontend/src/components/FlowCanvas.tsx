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
  edgeId?: string;
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
    deleteEdge,
    setTriggerNode,
    setRenameModal,
    toggleNodeHandle,
  } = useStore();

  const [menu, setMenu] = useState<MenuState>({ visible: false, x: 0, y: 0 });

  const handleNodeClick = useCallback<NodeMouseHandler>(
    (_, node) => {
      selectElement({ type: 'node', id: node.id });
    },
    [selectElement]
  );

  const handleNodeDoubleClick = useCallback<NodeMouseHandler>(
    (_, node) => {
      if (mode === 'edit') {
        setRenameModal({
          isOpen: true,
          nodeId: node.id,
          currentLabel: (node.data as any).label || '',
        });
      }
    },
    [mode, setRenameModal]
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

  const onEdgeContextMenu = useCallback(
    (event: any, edge: any) => {
      event.preventDefault();
      setMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        edgeId: edge.id,
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
        onNodeDoubleClick={handleNodeDoubleClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
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
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 min-w-[175px] bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl p-2.5 backdrop-blur-md select-none font-sans"
        >
          {menu.nodeId ? (
            // Node Context Options
            <div className="space-y-0.5">
              <button
                onClick={() => {
                  setTriggerNode(menu.nodeId!);
                  setMenu({ visible: false, x: 0, y: 0 });
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-indigo-600 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Flame size={13} className="text-indigo-400" />
                Set as Trigger
              </button>
              {mode === 'edit' && (
                <>
                  <button
                    onClick={() => {
                      duplicateNode(menu.nodeId!);
                      setMenu({ visible: false, x: 0, y: 0 });
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-indigo-600 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Copy size={13} className="text-emerald-400" />
                    Duplicate Node
                  </button>
                  <button
                    onClick={() => {
                      deleteNode(menu.nodeId!);
                      setMenu({ visible: false, x: 0, y: 0 });
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-red-400 hover:text-white hover:bg-red-600 rounded-lg flex items-center gap-2 cursor-pointer transition-colors animate-pulse"
                  >
                    <Trash2 size={13} />
                    Delete Node
                  </button>

                  {(() => {
                    const contextNode = nodes.find((n) => n.id === menu.nodeId);
                    if (!contextNode || contextNode.data.type === 'start') return null;

                    const activeHandles = contextNode.data.activeHandles || ['input', 'output'];

                    return (
                      <div className="border-t border-slate-800 mt-2 pt-2 px-1">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-0.5">
                          Active Handles
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 p-0.5 text-[11px]">
                          {/* Left */}
                          <label className="flex items-center gap-1.5 text-slate-400 hover:text-white cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={activeHandles.includes('input')}
                              onChange={() => toggleNodeHandle(contextNode.id, 'input')}
                              className="accent-indigo-500 rounded border-slate-800"
                            />
                            <span>In (L)</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-slate-400 hover:text-white cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={activeHandles.includes('output-left')}
                              onChange={() => toggleNodeHandle(contextNode.id, 'output-left')}
                              className="accent-indigo-500 rounded border-slate-800"
                            />
                            <span>Out (L)</span>
                          </label>

                          {/* Right */}
                          <label className="flex items-center gap-1.5 text-slate-400 hover:text-white cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={activeHandles.includes('input-right')}
                              onChange={() => toggleNodeHandle(contextNode.id, 'input-right')}
                              className="accent-indigo-500 rounded border-slate-800"
                            />
                            <span>In (R)</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-slate-400 hover:text-white cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={activeHandles.includes('output')}
                              onChange={() => toggleNodeHandle(contextNode.id, 'output')}
                              className="accent-indigo-500 rounded border-slate-800"
                            />
                            <span>Out (R)</span>
                          </label>

                          {/* Top */}
                          <label className="flex items-center gap-1.5 text-slate-400 hover:text-white cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={activeHandles.includes('input-top')}
                              onChange={() => toggleNodeHandle(contextNode.id, 'input-top')}
                              className="accent-indigo-500 rounded border-slate-800"
                            />
                            <span>In (T)</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-slate-400 hover:text-white cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={activeHandles.includes('output-top')}
                              onChange={() => toggleNodeHandle(contextNode.id, 'output-top')}
                              className="accent-indigo-500 rounded border-slate-800"
                            />
                            <span>Out (T)</span>
                          </label>

                          {/* Bottom */}
                          <label className="flex items-center gap-1.5 text-slate-400 hover:text-white cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={activeHandles.includes('input-bottom')}
                              onChange={() => toggleNodeHandle(contextNode.id, 'input-bottom')}
                              className="accent-indigo-500 rounded border-slate-800"
                            />
                            <span>In (B)</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-slate-400 hover:text-white cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={activeHandles.includes('output-bottom')}
                              onChange={() => toggleNodeHandle(contextNode.id, 'output-bottom')}
                              className="accent-indigo-500 rounded border-slate-800"
                            />
                            <span>Out (B)</span>
                          </label>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          ) : menu.edgeId ? (
            // Edge Context Options
            <div className="space-y-0.5">
              {mode === 'edit' ? (
                <button
                  onClick={() => deleteEdge(menu.edgeId!)}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-red-400 hover:text-white hover:bg-red-600 rounded-lg flex items-center gap-2 cursor-pointer transition-colors animate-pulse"
                >
                  <Trash2 size={13} />
                  Delete Connection
                </button>
              ) : (
                <div className="px-3 py-1.5 text-slate-500 text-[10px] font-mono">
                  Simulation Active (Locked)
                </div>
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
