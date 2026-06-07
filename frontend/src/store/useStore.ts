import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import type {
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Node,
  Edge,
} from '@xyflow/react';

export type NodeType = 'start' | 'microservice' | 'database' | 'kafka' | 'function';
export type ConnectionType =
  | 'rest'
  | 'grpc'
  | 'graphql'
  | 'soap'
  | 'websocket'
  | 'tcp'
  | 'udp'
  | 'kafka'
  | 'rabbitmq';

export interface MessagePacket {
  id: string;
  locationId: string; // Node ID or Edge ID where message is located
  locationType: 'node' | 'edge';
  payload: string; // JSON string payload carried by this specific packet
  sourceEdgeId: string | null; // Edge ID that delivered this packet, or 'trigger' if null
}

export interface CustomNodeData extends Record<string, unknown> {
  label: string;
  type: NodeType;
  isTrigger: boolean;
  hasMessage: boolean;
  description?: string;
  host?: string;
  port?: string;
  dbName?: string;
  url?: string;
  responseTemplate?: string; // Optional response template JSON string
  activeHandles?: string[];
  // routingTable: Record<inboundEdgeId | 'trigger', Record<outboundEdgeId, boolean>>
  routingTable?: Record<string, Record<string, boolean>>;
}

export interface CustomEdgeData extends Record<string, unknown> {
  connectionType: ConnectionType;
  payload: string; // JSON string
  hasMessage: boolean;
  description?: string;
  routingCondition?: string; // Optional IF condition on edge
}

export type AppNode = Node<CustomNodeData>;
export type AppEdge = Edge<CustomEdgeData>;

interface AppState {
  // Graph elements
  nodes: AppNode[];
  edges: AppEdge[];
  
  // Handlers for React Flow
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange<AppEdge>;
  onConnect: OnConnect;
  
  // Application Modes
  mode: 'edit' | 'simulation' | 'saved';
  status: 'stopped' | 'running' | 'paused';
  
  // Selection/Inspection
  selectedElement: { type: 'node' | 'edge'; id: string } | null;
  
  // Simulation Engine Details
  triggerNodeId: string | null;
  simulationPhase: 'node' | 'edge';
  simulationSpeed: number; // multiplier (e.g. 1, 1.5, 2, 0.5)
  currentStep: number;
  
  // V3 Simulation States
  activeMessages: MessagePacket[]; // List of concurrent active message packets
  simulationFailedEdges: string[]; // List of edge IDs that failed condition evaluation
  capabilities: string[];

  // Graph manipulation actions
  addNode: (type: NodeType) => void;
  duplicateNode: (id: string) => void;
  updateNodeData: (id: string, data: Partial<CustomNodeData>) => void;
  updateEdgeData: (id: string, data: Partial<CustomEdgeData>) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  toggleNodeHandle: (nodeId: string, handleId: string) => void;
  clearCanvas: () => void;
  loadConfiguration: (config: {
    version?: string;
    triggerNodeId: string | null;
    nodes: AppNode[];
    edges: AppEdge[];
  }) => void;
  
  // Selection actions
  selectElement: (element: { type: 'node' | 'edge'; id: string } | null) => void;
  
  // Simulation actions
  setMode: (mode: 'edit' | 'simulation' | 'saved') => void;
  setTriggerNode: (nodeId: string) => void;
  toggleRoute: (nodeId: string, inboundId: string, outboundId: string, enabled: boolean) => void; // Toggle routing table paths
  startSimulation: () => void;
  pauseSimulation: () => void;
  stopSimulation: () => void;
  stepSimulation: () => void;
  setSpeed: (speed: number) => void;

  // Routing Modal States
  routingModal: {
    isOpen: boolean;
    edgeId: string;
    sourceId: string;
    targetId: string;
    step: 'source' | 'target';
  } | null;
  setRoutingModal: (modal: { isOpen: boolean; edgeId: string; sourceId: string; targetId: string; step: 'source' | 'target' } | null) => void;

  // Rename Modal States
  renameModal: {
    isOpen: boolean;
    nodeId: string;
    currentLabel: string;
  } | null;
  setRenameModal: (modal: { isOpen: boolean; nodeId: string; currentLabel: string } | null) => void;
  fetchCapabilities: () => Promise<void>;
}

// Timer reference for the simulation loop
let simulationTimer: number | null = null;

// Default start node for a clean canvas on startup and clear
const defaultStartNode: AppNode = {
  id: 'node-start',
  type: 'customNode',
  position: { x: 100, y: 150 },
  data: {
    label: 'Start Trigger',
    type: 'start',
    isTrigger: true,
    hasMessage: false,
    description: 'Generates the initial simulation trigger payload.',
    responseTemplate: JSON.stringify(
      {
        action: "trigger"
      },
      null,
      2
    ),
    routingTable: {}
  }
};

// Initial state with a beautiful pre-configured multi-hop looping architecture
export const initialNodes: AppNode[] = [
  {
    id: 'node-start',
    type: 'customNode',
    position: { x: 40, y: 150 },
    data: {
      label: 'Start Trigger',
      type: 'start',
      isTrigger: true,
      hasMessage: false,
      description: 'Generates the initial simulation trigger payload.',
      responseTemplate: JSON.stringify(
        {
          action: "initialize_payment_flow",
          timestamp: 1780336200
        },
        null,
        2
      ),
      routingTable: {
        'trigger': {
          'edge-start-a': true
        }
      }
    }
  },
  {
    id: 'node-service-a',
    type: 'customNode',
    position: { x: 260, y: 150 },
    data: {
      label: 'Service A',
      type: 'microservice',
      isTrigger: false,
      hasMessage: false,
      description: 'Orchestrates checkouts. Saves state in DB and distributes to queues.',
      host: '10.0.1.5',
      port: '8080',
      responseTemplate: JSON.stringify(
        {
          order_id: "ord_2026_x89",
          customer_id: "cust_9901",
          amount: 249.99,
          status: "ACTIVE",
          requires_shipping: true
        },
        null,
        2
      ),
      routingTable: {
        'edge-start-a': {
          'edge-a-kafka-d': true,
          'edge-a-db': true,
          'edge-a-kafka-k': false,
        },
        'edge-b-a': {
          'edge-a-db': true,
          'edge-a-kafka-k': true,
          'edge-a-kafka-d': false,
        }
      },
    },
  },
  {
    id: 'node-order-db',
    type: 'customNode',
    position: { x: 260, y: 350 },
    data: {
      label: 'Order Database',
      type: 'database',
      isTrigger: false,
      hasMessage: false,
      description: 'PostgreSQL storing checkout orders and transaction logs.',
      dbName: 'orders_db',
      port: '5432',
      routingTable: {},
    },
  },
  {
    id: 'node-kafka-d',
    type: 'customNode',
    position: { x: 500, y: 40 },
    data: {
      label: 'Payment Queue D',
      type: 'kafka',
      isTrigger: false,
      hasMessage: false,
      description: 'Kafka topic carrying PENDING transaction events.',
      host: 'kafka-broker-d',
      port: '9092',
      routingTable: {
        'edge-a-kafka-d': {
          'edge-kafka-d-b': true
        }
      },
    },
  },
  {
    id: 'node-service-b',
    type: 'customNode',
    position: { x: 740, y: 150 },
    data: {
      label: 'Service B',
      type: 'microservice',
      isTrigger: false,
      hasMessage: false,
      description: 'Processes gateways payments and confirms transactions.',
      host: '10.0.1.12',
      port: '8082',
      responseTemplate: JSON.stringify(
        {
          transaction_id: "tx_880192a",
          status: "CONFIRMED",
          gateway: "stripe"
        },
        null,
        2
      ),
      routingTable: {
        'edge-kafka-d-b': {
          'edge-b-a': true,
        }
      },
    },
  },
  {
    id: 'node-kafka-k',
    type: 'customNode',
    position: { x: 500, y: 260 },
    data: {
      label: 'Audit Queue K',
      type: 'kafka',
      isTrigger: false,
      hasMessage: false,
      description: 'Kafka topic collecting completed checkout logs.',
      host: 'kafka-broker-k',
      port: '9092',
      routingTable: {},
    },
  },
];

export const initialEdges: AppEdge[] = [
  {
    id: 'edge-start-a',
    source: 'node-start',
    target: 'node-service-a',
    type: 'customEdge',
    data: {
      connectionType: 'rest',
      payload: JSON.stringify(
        {
          action: "initialize_order"
        },
        null,
        2
      ),
      hasMessage: false,
      description: 'Start simulation trigger call.',
    },
  },
  {
    id: 'edge-a-db',
    source: 'node-service-a',
    target: 'node-order-db',
    type: 'customEdge',
    data: {
      connectionType: 'rest',
      payload: JSON.stringify(
        {
          event: "SQL_INSERT",
          table: "orders",
          data: {
            id: "ord_2026_x89",
            customer_id: "cust_9901",
            amount: 249.99,
            status: "pending"
          }
        },
        null,
        2
      ),
      hasMessage: false,
      description: 'Persist checkout details in Order DB.',
    },
  },
  {
    id: 'edge-a-kafka-d',
    source: 'node-service-a',
    target: 'node-kafka-d',
    type: 'customEdge',
    data: {
      connectionType: 'kafka',
      payload: JSON.stringify(
        {
          topic: "checkout-pending",
          value: {
            order_id: "ord_2026_x89",
            amount: 249.99
          }
        },
        null,
        2
      ),
      hasMessage: false,
      description: 'Publish checkout details to Queue D.',
    },
  },
  {
    id: 'edge-kafka-d-b',
    source: 'node-kafka-d',
    target: 'node-service-b',
    type: 'customEdge',
    data: {
      connectionType: 'kafka',
      payload: JSON.stringify(
        {
          topic: "checkout-pending",
          value: {
            order_id: "ord_2026_x89",
            amount: 249.99
          }
        },
        null,
        2
      ),
      hasMessage: false,
      description: 'Route pending checkout to Service B.',
    },
  },
  {
    id: 'edge-b-a',
    source: 'node-service-b',
    target: 'node-service-a',
    type: 'customEdge',
    data: {
      connectionType: 'grpc',
      payload: JSON.stringify(
        {
          method: "PaymentConfirmedNotification",
          order_id: "ord_2026_x89",
          tx_id: "tx_880192a"
        },
        null,
        2
      ),
      hasMessage: false,
      description: 'Confirm payment to Service A.',
    },
  },
  {
    id: 'edge-a-kafka-k',
    source: 'node-service-a',
    target: 'node-kafka-k',
    type: 'customEdge',
    data: {
      connectionType: 'kafka',
      payload: JSON.stringify(
        {
          topic: "audit-events",
          value: {
            order_id: "ord_2026_x89",
            status: "SUCCESS"
          }
        },
        null,
        2
      ),
      hasMessage: false,
      description: 'Publish completed transaction audit to Queue K.',
      routingCondition: 'payload.status === "CONFIRMED"',
    },
  },
];

export const useStore = create<AppState>((set, get) => {
  // Clear any existing simulation interval
  const stopInterval = () => {
    if (simulationTimer) {
      window.clearInterval(simulationTimer);
      simulationTimer = null;
    }
  };

  // Start simulation interval based on current speed
  const startInterval = () => {
    stopInterval();
    const speed = get().simulationSpeed;
    const intervalTime = Math.max(200, 1500 / speed); // min 200ms interval
    
    simulationTimer = window.setInterval(() => {
      get().stepSimulation();
    }, intervalTime);
  };

  return {
    // Initial data
    nodes: [defaultStartNode],
    edges: [],
    mode: 'edit',
    status: 'stopped',
    selectedElement: null,
    
    triggerNodeId: 'node-start',
    simulationPhase: 'node',
    simulationSpeed: 1,
    currentStep: 0,
    activeMessages: [],
    simulationFailedEdges: [],
    routingModal: null,
    renameModal: null,
    capabilities: [],

    // Flow handlers
    onNodesChange: (changes) => {
      set({
        nodes: applyNodeChanges(changes, get().nodes) as AppNode[],
      });
    },

    onEdgesChange: (changes) => {
      set({
        edges: applyEdgeChanges(changes, get().edges) as AppEdge[],
      });
    },

    onConnect: (connection) => {
      // Prevent duplicate directed connections between the same source and target nodes
      const duplicate = get().edges.some(
        (edge) => edge.source === connection.source && edge.target === connection.target
      );
      if (duplicate) return;


      const edgeId = `edge-${Date.now()}`;
      const newEdge: AppEdge = {
        id: edgeId,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: 'customEdge',
        data: {
          connectionType: 'rest',
          payload: JSON.stringify({ message: "New Message Payload" }, null, 2),
          hasMessage: false,
          description: `Connects ${connection.source} to ${connection.target}`,
          routingCondition: '',
        },
      };

      // V3 Refinement: Dynamically update source node routingTable

      const sourceNode = get().nodes.find((n) => n.id === connection.source);
      const isSourceStart = sourceNode?.data.type === 'start';

      const updatedNodes = get().nodes.map((node) => {
        if (node.id === connection.source) {
          const routingTable = { ...node.data.routingTable };
          
          // Append new Edge ID to all existing inbound connection keys in the table
          const keys = Object.keys(routingTable);
          if (keys.length === 0) {
            const isStart = node.data.type === 'start';
            routingTable['trigger'] = { [edgeId]: isStart };
          } else {
            keys.forEach((key) => {
              const isStart = node.data.type === 'start';
              routingTable[key] = {
                ...routingTable[key],
                [edgeId]: isStart, // true only if source node is Start itself
              };
            });
          }

          return {
            ...node,
            data: { ...node.data, routingTable },
          };
        } else if (node.id === connection.target) {
          // Initialize routing table mapping row for the target node receiving edgeId
          const routingTable = { ...node.data.routingTable };
          
          const outgoingEdges = get().edges.filter((e) => e.source === node.id && e.target !== node.id);
          const targetRoutes: Record<string, boolean> = {};
          outgoingEdges.forEach((e) => {
            targetRoutes[e.id] = false; // Always false by default for target node outbounds
          });

          routingTable[edgeId] = {
            ...routingTable[edgeId],
            ...targetRoutes,
          };

          return {
            ...node,
            data: { ...node.data, routingTable },
          };
        }
        return node;
      }) as AppNode[];

      const sourceInbounds = get().edges.filter((e) => e.target === connection.source && e.source !== connection.source);
      const targetOutbounds = get().edges.filter((e) => e.source === connection.target && e.target !== connection.target);

      // Source is configurable if it is not start, and has at least one inbound connection
      const isSourceConfigurable = 
        !isSourceStart && 
        sourceInbounds.length > 0;

      // Target is configurable if the new connection does not come from start, and target has outbound connections
      const isTargetConfigurable = 
        !isSourceStart && 
        targetOutbounds.length > 0;

      const shouldShowPopup = isSourceConfigurable || isTargetConfigurable;
      const initialStep = isSourceConfigurable ? 'source' : 'target';

      set({
        edges: [...get().edges, newEdge],
        nodes: updatedNodes,
        routingModal: shouldShowPopup
          ? {
              isOpen: true,
              edgeId,
              sourceId: connection.source,
              targetId: connection.target,
              step: initialStep,
            }
          : null,
      });
    },

    // Graph Manipulation
    addNode: (type) => {
      const id = `node-${type}-${Date.now()}`;
      const viewportCenter = { x: 300 + Math.random() * 80, y: 200 + Math.random() * 80 };
      
      const labels: Record<NodeType, string> = {
        start: 'Start Node',
        microservice: 'New Service',
        database: 'New Database',
        kafka: 'Kafka Queue',
        function: 'Function',
      };

      const defaultData: Record<NodeType, Partial<CustomNodeData>> = {
        start: { responseTemplate: '{\n  "action": "trigger"\n}', routingTable: {} },
        microservice: { description: 'Custom Microservice API endpoint.', responseTemplate: '', routingTable: {} },
        database: { description: 'Relational Database Instance.', responseTemplate: '', routingTable: {} },
        kafka: { description: 'Kafka Stream / Topic.', responseTemplate: '', routingTable: {} },
        function: { description: 'Serverless Function.', responseTemplate: '', routingTable: {} },
      };

      const isFirstNode = get().nodes.length === 0;

      const newNode: AppNode = {
        id,
        type: 'customNode',
        position: viewportCenter,
        data: {
          label: labels[type],
          type,
          isTrigger: isFirstNode, // set as trigger if first node
          hasMessage: false,
          ...defaultData[type],
        },
      };

      set({
        nodes: [...get().nodes, newNode],
        ...(isFirstNode ? { triggerNodeId: id } : {}),
      });
    },

    duplicateNode: (id) => {
      const node = get().nodes.find((n) => n.id === id);
      if (!node) return;

      const newId = `node-${node.data.type}-${Date.now()}`;
      const offset = 40;
      
      // Duplicated nodes start fresh with empty routing tables (connections not cloned)
      const newNode: AppNode = {
        ...node,
        id: newId,
        position: { x: node.position.x + offset, y: node.position.y + offset },
        selected: false,
        data: {
          ...node.data,
          isTrigger: false,
          hasMessage: false,
          routingTable: {},
        },
      };

      set({
        nodes: [...get().nodes, newNode],
      });
    },

    updateNodeData: (id, data) => {
      set({
        nodes: get().nodes.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              data: { ...node.data, ...data },
            };
          }
          return node;
        }) as AppNode[],
      });
    },

    updateEdgeData: (id, data) => {
      set({
        edges: get().edges.map((edge) => {
          if (edge.id === id) {
            return {
              ...edge,
              data: { ...edge.data, ...data },
            };
          }
          return edge;
        }) as AppEdge[],
      });
    },

    deleteNode: (id) => {
      // Also delete connected edges
      const filteredNodes = get().nodes.filter((node) => node.id !== id);
      const filteredEdges = get().edges.filter(
        (edge) => edge.source !== id && edge.target !== id
      );
      
      const isTriggerDeleted = get().triggerNodeId === id;
      const nextTriggerId = isTriggerDeleted 
        ? (filteredNodes.length > 0 ? filteredNodes[0].id : null)
        : get().triggerNodeId;

      if (nextTriggerId && isTriggerDeleted) {
        filteredNodes[0].data = {
          ...filteredNodes[0].data,
          isTrigger: true,
        };
      }

      set({
        nodes: filteredNodes,
        edges: filteredEdges,
        triggerNodeId: nextTriggerId,
        selectedElement: get().selectedElement?.id === id ? null : get().selectedElement,
      });
    },

    deleteEdge: (id) => {
      // V3 Refinement: Clean deleted edge ID from inbound rows and outbound mappings of all nodes
      const updatedNodes = get().nodes.map((node) => {
        const routingTable = { ...node.data.routingTable };
        let modified = false;

        // Delete inbound row mapping
        if (id in routingTable) {
          delete routingTable[id];
          modified = true;
        }

        // Delete from checkbox selections inside other inbound mappings
        Object.keys(routingTable).forEach((key) => {
          if (routingTable[key] && id in routingTable[key]) {
            routingTable[key] = { ...routingTable[key] };
            delete routingTable[key][id];
            modified = true;
          }
        });

        if (modified) {
          return {
            ...node,
            data: { ...node.data, routingTable },
          };
        }
        return node;
      }) as AppNode[];

      set({
        edges: get().edges.filter((edge) => edge.id !== id),
        nodes: updatedNodes,
        selectedElement: get().selectedElement?.id === id ? null : get().selectedElement,
      });
    },

    toggleNodeHandle: (nodeId, handleId) => {
      const node = get().nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const currentHandles = node.data.activeHandles || (
        node.data.type === 'start' ? ['output'] : ['input', 'output']
      );
      const isRemoving = currentHandles.includes(handleId);
      const updatedHandles = isRemoving
        ? currentHandles.filter((h) => h !== handleId)
        : [...currentHandles, handleId];

      let edgesToKeep = get().edges;
      let nodesList = get().nodes.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              activeHandles: updatedHandles,
            },
          };
        }
        return n;
      }) as AppNode[];

      if (isRemoving) {
        // Find edge IDs to delete
        const edgesToDelete = get().edges.filter(
          (edge) =>
            (edge.source === nodeId && edge.sourceHandle === handleId) ||
            (edge.target === nodeId && edge.targetHandle === handleId) ||
            (edge.source === nodeId && handleId === 'output' && !edge.sourceHandle) ||
            (edge.target === nodeId && handleId === 'input' && !edge.targetHandle)
        );

        const edgeIdsToDelete = edgesToDelete.map((e) => e.id);
        edgesToKeep = get().edges.filter((e) => !edgeIdsToDelete.includes(e.id));

        // Clean each deleted edge ID from inbound rows and outbound mappings of all nodes
        nodesList = nodesList.map((n) => {
          const routingTable = { ...n.data.routingTable };
          let modified = false;

          edgeIdsToDelete.forEach((id) => {
            // Delete inbound row mapping
            if (id in routingTable) {
              delete routingTable[id];
              modified = true;
            }

            // Delete from checkbox selections inside other inbound mappings
            Object.keys(routingTable).forEach((key) => {
              if (routingTable[key] && id in routingTable[key]) {
                routingTable[key] = { ...routingTable[key] };
                delete routingTable[key][id];
                modified = true;
              }
            });
          });

          if (modified) {
            return {
              ...n,
              data: { ...n.data, routingTable },
            };
          }
          return n;
        }) as AppNode[];
      }

      set({
        nodes: nodesList,
        edges: edgesToKeep,
      });
    },

    clearCanvas: () => {
      stopInterval();
      set({
        nodes: [defaultStartNode],
        edges: [],
        selectedElement: null,
        triggerNodeId: 'node-start',
        status: 'stopped',
        mode: 'edit',
        simulationPhase: 'node',
        currentStep: 0,
        activeMessages: [],
        simulationFailedEdges: [],
      });
    },

    loadConfiguration: (config) => {
      stopInterval();
      if (!config || !Array.isArray(config.nodes) || !Array.isArray(config.edges)) {
        throw new Error("Invalid configuration structure.");
      }

      const sanitizedNodes = config.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          hasMessage: false
        }
      })) as AppNode[];

      const sanitizedEdges = config.edges.map(edge => ({
        ...edge,
        data: {
          ...edge.data,
          hasMessage: false
        }
      })) as AppEdge[];

      set({
        nodes: sanitizedNodes,
        edges: sanitizedEdges,
        triggerNodeId: config.triggerNodeId || (sanitizedNodes.find(n => n.data.type === 'start')?.id || null),
        selectedElement: null,
        status: 'stopped',
        mode: 'edit',
        simulationPhase: 'node',
        currentStep: 0,
        activeMessages: [],
        simulationFailedEdges: [],
      });
    },

    fetchCapabilities: async () => {
      try {
        const response = await fetch('http://localhost:8080/api/capabilities');
        if (response.ok) {
          const data = await response.json();
          set({ capabilities: data });
        }
      } catch (err) {
        console.error('Failed to fetch capabilities:', err);
      }
    },

    // Selection
    selectElement: (element) => {
      set({ selectedElement: element });
    },

    // Simulation logic
    setMode: (mode) => {
      if (mode === 'edit' || mode === 'saved') {
        stopInterval();
        // Clear message markers on elements
        const resetNodes = get().nodes.map((node) => ({
          ...node,
          data: { ...node.data, hasMessage: false },
        })) as AppNode[];
        const resetEdges = get().edges.map((edge) => ({
          ...edge,
          data: { ...edge.data, hasMessage: false },
        })) as AppEdge[];
        
        set({
          mode,
          status: 'stopped',
          simulationPhase: 'node',
          currentStep: 0,
          nodes: resetNodes,
          edges: resetEdges,
          activeMessages: [],
          simulationFailedEdges: [],
        });
      } else {
        // Set up initial state for simulation
        const triggerId = get().triggerNodeId;
        const triggerNode = get().nodes.find(n => n.id === triggerId);
        
        const initialPayload = triggerNode?.data.responseTemplate?.trim()
          ? triggerNode.data.responseTemplate
          : JSON.stringify({ message: "Simulation started" }, null, 2);

        const resetNodes = get().nodes.map((node) => ({
          ...node,
          data: { 
            ...node.data, 
            hasMessage: node.id === triggerId 
          },
        })) as AppNode[];
        
        const resetEdges = get().edges.map((edge) => ({
          ...edge,
          data: { ...edge.data, hasMessage: false },
        })) as AppEdge[];

        const activeMessagesList: MessagePacket[] = [];
        if (triggerId) {
          activeMessagesList.push({
            id: `msg-start-${Date.now()}`,
            locationId: triggerId,
            locationType: 'node',
            payload: initialPayload,
            sourceEdgeId: null, // trigger source is null
          });
        }

        set({
          mode,
          status: 'paused',
          simulationPhase: 'node',
          currentStep: 0,
          nodes: resetNodes,
          edges: resetEdges,
          activeMessages: activeMessagesList,
          simulationFailedEdges: [],
        });
      }
    },

    setTriggerNode: (nodeId) => {
      set({
        triggerNodeId: nodeId,
        nodes: get().nodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            isTrigger: node.id === nodeId,
          },
        })) as AppNode[],
      });
    },

    toggleRoute: (nodeId, inboundId, outboundId, enabled) => {
      set({
        nodes: get().nodes.map((node) => {
          if (node.id === nodeId) {
            const routingTable = { ...node.data.routingTable };
            if (!routingTable[inboundId]) {
              routingTable[inboundId] = {};
            }
            routingTable[inboundId] = {
              ...routingTable[inboundId],
              [outboundId]: enabled,
            };
            return {
              ...node,
              data: { ...node.data, routingTable },
            };
          }
          return node;
        }) as AppNode[],
      });
    },

    setRoutingModal: (modal) => {
      set({ routingModal: modal });
    },

    setRenameModal: (modal) => {
      set({ renameModal: modal });
    },

    startSimulation: () => {
      const { triggerNodeId, nodes } = get();
      
      // If we are starting from scratch and have no active nodes/edges, reset to trigger point
      if (get().activeMessages.length === 0) {
        if (!triggerNodeId) return;
        const triggerNode = nodes.find(n => n.id === triggerNodeId);
        const initialPayload = triggerNode?.data.responseTemplate?.trim()
          ? triggerNode.data.responseTemplate
          : JSON.stringify({ message: "Simulation started" }, null, 2);

        const initialPacketList: MessagePacket[] = [{
          id: `msg-start-${Date.now()}`,
          locationId: triggerNodeId,
          locationType: 'node',
          payload: initialPayload,
          sourceEdgeId: null,
        }];

        set({
          simulationPhase: 'node',
          currentStep: 0,
          activeMessages: initialPacketList,
          simulationFailedEdges: [],
          nodes: nodes.map((node) => ({
            ...node,
            data: { ...node.data, hasMessage: node.id === triggerNodeId },
          })) as AppNode[],
          edges: get().edges.map((edge) => ({
            ...edge,
            data: { ...edge.data, hasMessage: false },
          })) as AppEdge[],
        });
      }

      set({ status: 'running' });
      startInterval();
    },

    pauseSimulation: () => {
      stopInterval();
      set({ status: 'paused' });
    },

    stopSimulation: () => {
      stopInterval();
      set({
        status: 'stopped',
        mode: 'edit',
        simulationPhase: 'node',
        currentStep: 0,
        activeMessages: [],
        simulationFailedEdges: [],
        nodes: get().nodes.map((node) => ({
          ...node,
          data: { ...node.data, hasMessage: false },
        })) as AppNode[],
        edges: get().edges.map((edge) => ({
          ...edge,
          data: { ...edge.data, hasMessage: false },
        })) as AppEdge[],
      });
    },

    stepSimulation: () => {
      const {
        status,
        activeMessages,
        simulationPhase,
        edges,
        nodes,
      } = get();

      // Can step in paused or running status, but not when stopped
      if (status === 'stopped') return;

      let nextActiveMessages: MessagePacket[] = [];
      let nextPhase: 'node' | 'edge' = simulationPhase;
      const newFailedEdges: string[] = [];

      if (simulationPhase === 'node') {
        const activeNodePackets = activeMessages.filter(m => m.locationType === 'node');

        if (activeNodePackets.length === 0) {
          // Reset to trigger point if empty
          const trigger = get().triggerNodeId;
          if (trigger) {
            const triggerNode = nodes.find(n => n.id === trigger);
            nextActiveMessages = [{
              id: `msg-start-${Date.now()}`,
              locationId: trigger,
              locationType: 'node',
              payload: triggerNode?.data.responseTemplate?.trim()
                ? triggerNode.data.responseTemplate
                : JSON.stringify({ message: "Simulation started" }, null, 2),
              sourceEdgeId: null,
            }];
            nextPhase = 'node';
          } else {
            get().stopSimulation();
            return;
          }
        } else {
          // Loop through active packets on nodes and propagate concurrently
          activeNodePackets.forEach((packet) => {
            const sourceNodeId = packet.locationId;
            const sourceNode = nodes.find(n => n.id === sourceNodeId);
            
            // Outgoing edges
            const outgoingEdges = edges.filter(e => e.source === sourceNodeId);

            outgoingEdges.forEach((edge) => {
              // Resolve inbound key: source connection ID or 'trigger'
              const inboundKey = packet.sourceEdgeId || 'trigger';

              // Opt-in check: check specific nested routingTable cell, default to false
              const isPathAllowed = sourceNode?.data.routingTable?.[inboundKey]?.[edge.id] === true;
              if (!isPathAllowed) {
                // Ignore completely - opt out
                return;
              }

              // Determine payload (mutate if responseTemplate exists)
              let activePayload = packet.payload || edge.data?.payload || '{}';
              if (sourceNode?.data.responseTemplate?.trim()) {
                const template = sourceNode.data.responseTemplate.trim();
                try {
                  const incomingObj = JSON.parse(activePayload);
                  const templateObj = JSON.parse(template);
                  if (
                    typeof incomingObj === 'object' && incomingObj !== null &&
                    typeof templateObj === 'object' && templateObj !== null
                  ) {
                    activePayload = JSON.stringify({ ...incomingObj, ...templateObj }, null, 2);
                  } else {
                    activePayload = template;
                  }
                } catch {
                  activePayload = template;
                }
              }

              // Evaluate edge routing condition (if exists)
              const condition = edge.data?.routingCondition;
              let conditionPassed = true;

              if (condition && condition.trim()) {
                try {
                  let parsedPayload = {};
                  try {
                    parsedPayload = JSON.parse(activePayload);
                  } catch {}

                  // Safe execution context wrapper
                  const evalFn = new Function('payload', `
                    try {
                      with (payload || {}) {
                        return (${condition});
                      }
                    } catch (e) {
                      return false;
                    }
                  `);
                  conditionPassed = !!evalFn(parsedPayload);
                } catch (err) {
                  console.error(`Condition evaluation syntax error on edge ${edge.id}:`, err);
                  conditionPassed = false;
                }
              }

              if (conditionPassed) {
                nextActiveMessages.push({
                  id: `msg-${edge.id}-${Date.now()}-${Math.random()}`,
                  locationId: edge.id,
                  locationType: 'edge',
                  payload: activePayload,
                  sourceEdgeId: edge.id,
                });
              } else {
                newFailedEdges.push(edge.id);
              }
            });
          });

          // Transition phase
          if (nextActiveMessages.length > 0) {
            nextPhase = 'edge';
          } else {
            // All paths are blocked
            get().stopSimulation();
            return;
          }
        }
      } else {
        // simulationPhase === 'edge': We are at edges, propagating to target nodes
        const activeEdgePackets = activeMessages.filter(m => m.locationType === 'edge');

        if (activeEdgePackets.length > 0) {
          // Group target node payloads
          const groupedTargetPayloads: Record<string, string[]> = {};
          activeEdgePackets.forEach((packet) => {
            const edge = edges.find(e => e.id === packet.locationId);
            if (edge) {
              if (!groupedTargetPayloads[edge.target]) {
                groupedTargetPayloads[edge.target] = [];
              }
              groupedTargetPayloads[edge.target].push(packet.payload);
            }
          });

          nextActiveMessages = Object.keys(groupedTargetPayloads).map((targetId) => {
            const payloads = groupedTargetPayloads[targetId];
            let mergedPayload = '{}';
            try {
              const parsedObj = payloads.map((p) => {
                try {
                  return JSON.parse(p);
                } catch {
                  return {};
                }
              });
              const combined = Object.assign({}, ...parsedObj);
              mergedPayload = JSON.stringify(combined, null, 2);
            } catch {
              const incoming = edges.filter(e => e.target === targetId);
              if (incoming.length > 0) {
                const matchingPacket = activeEdgePackets.find(p => p.locationId === incoming[0].id);
                mergedPayload = matchingPacket?.payload || '{}';
              }
            }

            // Find which connection carried the packet to this node
            const incoming = activeEdgePackets.filter(e => {
              const edgeDetail = edges.find(ed => ed.id === e.locationId);
              return edgeDetail?.target === targetId;
            });
            const sourceEdgeId = incoming.length > 0 ? incoming[0].locationId : null;

            return {
              id: `msg-${targetId}-${Date.now()}-${Math.random()}`,
              locationId: targetId,
              locationType: 'node',
              payload: mergedPayload,
              sourceEdgeId: sourceEdgeId,
            };
          });

          nextPhase = 'node';
        } else {
          get().stopSimulation();
          return;
        }
      }

      // Update nodes & edges hasMessage property based on activeMessages locations
      const nextActiveNodeIds = nextActiveMessages
        .filter(m => m.locationType === 'node')
        .map(m => m.locationId);
      
      const nextActiveEdgeIds = nextActiveMessages
        .filter(m => m.locationType === 'edge')
        .map(m => m.locationId);

      const updatedNodes = nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          hasMessage: nextActiveNodeIds.includes(node.id),
        },
      })) as AppNode[];

      const updatedEdges = edges.map((edge) => ({
        ...edge,
        data: {
          ...edge.data,
          hasMessage: nextActiveEdgeIds.includes(edge.id),
        },
      })) as AppEdge[];

      set({
        nodes: updatedNodes,
        edges: updatedEdges,
        activeMessages: nextActiveMessages,
        simulationPhase: nextPhase,
        currentStep: get().currentStep + 1,
        simulationFailedEdges: newFailedEdges,
      });
    },

    setSpeed: (speed) => {
      set({ simulationSpeed: speed });
      // If currently running, restart the interval with the new speed
      if (get().status === 'running') {
        startInterval();
      }
    },
  };
});
