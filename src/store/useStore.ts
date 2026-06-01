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

export type NodeType = 'microservice' | 'database' | 'kafka' | 'api';
export type ConnectionType = 'rest' | 'queue' | 'grpc';

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
}

export interface CustomEdgeData extends Record<string, unknown> {
  connectionType: ConnectionType;
  payload: string; // JSON string
  hasMessage: boolean;
  description?: string;
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
  mode: 'edit' | 'simulation';
  status: 'stopped' | 'running' | 'paused';
  
  // Selection/Inspection
  selectedElement: { type: 'node' | 'edge'; id: string } | null;
  
  // Simulation Engine Details
  triggerNodeId: string | null;
  simulationActiveNodes: string[];
  simulationActiveEdges: string[];
  simulationPhase: 'node' | 'edge';
  simulationSpeed: number; // multiplier (e.g. 1, 1.5, 2, 0.5)
  currentStep: number;
  
  // Graph manipulation actions
  addNode: (type: NodeType) => void;
  updateNodeData: (id: string, data: Partial<CustomNodeData>) => void;
  updateEdgeData: (id: string, data: Partial<CustomEdgeData>) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  clearCanvas: () => void;
  
  // Selection actions
  selectElement: (element: { type: 'node' | 'edge'; id: string } | null) => void;
  
  // Simulation actions
  setMode: (mode: 'edit' | 'simulation') => void;
  setTriggerNode: (nodeId: string) => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  stopSimulation: () => void;
  stepSimulation: () => void;
  setSpeed: (speed: number) => void;
}

// Timer reference for the simulation loop
let simulationTimer: number | null = null;

// Initial state with a beautiful pre-configured microservices architecture
const initialNodes: AppNode[] = [
  {
    id: 'node-order-service',
    type: 'customNode',
    position: { x: 180, y: 150 },
    data: {
      label: 'Order Service',
      type: 'microservice',
      isTrigger: true,
      hasMessage: false,
      description: 'Main entry point for customer orders. Validates requests and orchestrates checkout.',
      host: '10.0.1.5',
      port: '8080',
    },
  },
  {
    id: 'node-order-db',
    type: 'customNode',
    position: { x: 80, y: 350 },
    data: {
      label: 'Order DB',
      type: 'database',
      isTrigger: false,
      hasMessage: false,
      description: 'PostgreSQL instance storing orders, payment metadata, and customer purchase history.',
      dbName: 'orders_db',
      port: '5432',
    },
  },
  {
    id: 'node-payment-service',
    type: 'customNode',
    position: { x: 480, y: 150 },
    data: {
      label: 'Payment Service',
      type: 'microservice',
      isTrigger: false,
      hasMessage: false,
      description: 'Processes credit cards, handles refunds, and coordinates with external gateways.',
      host: '10.0.1.12',
      port: '8082',
    },
  },
  {
    id: 'node-kafka-queue',
    type: 'customNode',
    position: { x: 780, y: 150 },
    data: {
      label: 'Payment Events Queue',
      type: 'kafka',
      isTrigger: false,
      hasMessage: false,
      description: 'Apache Kafka topic distributing checkout success events to inventory and notification systems.',
      host: 'kafka-broker-1',
      port: '9092',
    },
  },
  {
    id: 'node-stripe-api',
    type: 'customNode',
    position: { x: 880, y: 350 },
    data: {
      label: 'Stripe Gateway',
      type: 'api',
      isTrigger: false,
      hasMessage: false,
      description: 'External API client communicating with Stripe for secure payment processing.',
      url: 'https://api.stripe.com/v3',
    },
  },
  {
    id: 'node-inventory-service',
    type: 'customNode',
    position: { x: 400, y: 350 },
    data: {
      label: 'Inventory Service',
      type: 'microservice',
      isTrigger: false,
      hasMessage: false,
      description: 'Tracks product stock levels, reserves inventory items, and alerts for restocking.',
      host: '10.0.2.14',
      port: '8085',
    },
  },
];

const initialEdges: AppEdge[] = [
  {
    id: 'edge-order-db',
    source: 'node-order-service',
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
      description: 'Persist new order details in Database.',
    },
  },
  {
    id: 'edge-order-payment',
    source: 'node-order-service',
    target: 'node-payment-service',
    type: 'customEdge',
    data: {
      connectionType: 'grpc',
      payload: JSON.stringify(
        {
          method: "ProcessPaymentRequest",
          order_id: "ord_2026_x89",
          user_id: "cust_9901",
          amount: 249.99,
          payment_method: "tok_visa"
        },
        null,
        2
      ),
      hasMessage: false,
      description: 'gRPC call to trigger payment processing.',
    },
  },
  {
    id: 'edge-order-inventory',
    source: 'node-order-service',
    target: 'node-inventory-service',
    type: 'grpc',
    data: {
      connectionType: 'grpc',
      payload: JSON.stringify(
        {
          method: "ReserveStockRequest",
          items: [
            { sku: "sku-dev-board", qty: 1 },
            { sku: "sku-cable-usb", qty: 2 }
          ]
        },
        null,
        2
      ),
      hasMessage: false,
      description: 'Reserve inventory items before confirming checkout.',
    },
  },
  {
    id: 'edge-payment-kafka',
    source: 'node-payment-service',
    target: 'node-kafka-queue',
    type: 'customEdge',
    data: {
      connectionType: 'queue',
      payload: JSON.stringify(
        {
          topic: "payment-completed-events",
          key: "ord_2026_x89",
          partition: 0,
          value: {
            transaction_id: "tx_880192a",
            order_id: "ord_2026_x89",
            status: "SUCCESS",
            timestamp: 1780336214
          }
        },
        null,
        2
      ),
      hasMessage: false,
      description: 'Publish payment completion event to Kafka.',
    },
  },
  {
    id: 'edge-kafka-stripe',
    source: 'node-kafka-queue',
    target: 'node-stripe-api',
    type: 'customEdge',
    data: {
      connectionType: 'rest',
      payload: JSON.stringify(
        {
          url: "/v1/charges",
          method: "POST",
          headers: { Authorization: "Bearer sk_test_..." },
          body: {
            amount: 24999,
            currency: "usd",
            source: "tok_visa",
            description: "Charge for order ord_2026_x89"
          }
        },
        null,
        2
      ),
      hasMessage: false,
      description: 'Relay charge event to external Stripe API gateway.',
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
    nodes: initialNodes,
    edges: initialEdges,
    mode: 'edit',
    status: 'stopped',
    selectedElement: null,
    
    triggerNodeId: 'node-order-service',
    simulationActiveNodes: [],
    simulationActiveEdges: [],
    simulationPhase: 'node',
    simulationSpeed: 1,
    currentStep: 0,

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
        },
      };

      set({
        edges: [...get().edges, newEdge],
      });
    },

    // Graph Manipulation
    addNode: (type) => {
      const id = `node-${type}-${Date.now()}`;
      const viewportCenter = { x: 300 + Math.random() * 80, y: 200 + Math.random() * 80 };
      
      const labels: Record<NodeType, string> = {
        microservice: 'New Service',
        database: 'New Database',
        kafka: 'Kafka Queue',
        api: 'External API',
      };

      const defaultData: Record<NodeType, Partial<CustomNodeData>> = {
        microservice: { host: '127.0.0.1', port: '8080', description: 'Custom Microservice API endpoint.' },
        database: { dbName: 'postgres', port: '5432', description: 'Relational Database Instance.' },
        kafka: { host: 'localhost', port: '9092', description: 'Kafka Stream / Topic.' },
        api: { url: 'https://api.example.com/v1', description: 'External third-party API provider.' },
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
      set({
        edges: get().edges.filter((edge) => edge.id !== id),
        selectedElement: get().selectedElement?.id === id ? null : get().selectedElement,
      });
    },

    clearCanvas: () => {
      stopInterval();
      set({
        nodes: [],
        edges: [],
        selectedElement: null,
        triggerNodeId: null,
        status: 'stopped',
        mode: 'edit',
        simulationActiveNodes: [],
        simulationActiveEdges: [],
        simulationPhase: 'node',
        currentStep: 0,
      });
    },

    // Selection
    selectElement: (element) => {
      set({ selectedElement: element });
    },

    // Simulation logic
    setMode: (mode) => {
      if (mode === 'edit') {
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
          simulationActiveNodes: [],
          simulationActiveEdges: [],
          simulationPhase: 'node',
          currentStep: 0,
          nodes: resetNodes,
          edges: resetEdges,
        });
      } else {
        // Set up initial state for simulation
        const triggerId = get().triggerNodeId;
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

        set({
          mode,
          status: 'paused',
          simulationActiveNodes: triggerId ? [triggerId] : [],
          simulationActiveEdges: [],
          simulationPhase: 'node',
          currentStep: 0,
          nodes: resetNodes,
          edges: resetEdges,
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

    startSimulation: () => {
      const { triggerNodeId, nodes } = get();
      
      // If we are starting from scratch and have no active nodes/edges, reset to trigger point
      if (get().simulationActiveNodes.length === 0 && get().simulationActiveEdges.length === 0) {
        if (!triggerNodeId) return;
        set({
          simulationActiveNodes: [triggerNodeId],
          simulationActiveEdges: [],
          simulationPhase: 'node',
          currentStep: 0,
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
        simulationActiveNodes: [],
        simulationActiveEdges: [],
        simulationPhase: 'node',
        currentStep: 0,
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
        simulationActiveNodes,
        simulationActiveEdges,
        simulationPhase,
        edges,
        nodes,
      } = get();

      // Can step in paused or running status, but not when stopped
      if (status === 'stopped') return;

      let nextActiveNodes: string[] = [];
      let nextActiveEdges: string[] = [];
      let nextPhase: 'node' | 'edge' = simulationPhase;

      if (simulationPhase === 'node') {
        if (simulationActiveNodes.length === 0) {
          // Reset to trigger point if everything goes dead
          const trigger = get().triggerNodeId;
          if (trigger) {
            nextActiveNodes = [trigger];
            nextPhase = 'node';
          } else {
            stopInterval();
            set({ status: 'paused' });
            return;
          }
        } else {
          // Find outgoing edges from active nodes
          const outgoingEdges = edges.filter((e) =>
            simulationActiveNodes.includes(e.source)
          );

          if (outgoingEdges.length > 0) {
            nextActiveEdges = outgoingEdges.map((e) => e.id);
            nextActiveNodes = [];
            nextPhase = 'edge';
          } else {
            // Flow has reached sink nodes, stop simulation automatically
            stopInterval();
            set({ status: 'paused' });
            // Alert user that simulation finished by emptying active list
            set({
              simulationActiveNodes: [],
              simulationActiveEdges: [],
              nodes: nodes.map(n => ({ ...n, data: { ...n.data, hasMessage: false } })) as AppNode[],
              edges: edges.map(e => ({ ...e, data: { ...e.data, hasMessage: false } })) as AppEdge[],
            });
            return;
          }
        }
      } else {
        // Move from active edges to their target nodes
        const activeEdgesList = edges.filter((e) =>
          simulationActiveEdges.includes(e.id)
        );
        const targetNodes = activeEdgesList.map((e) => e.target);
        
        if (targetNodes.length > 0) {
          nextActiveNodes = Array.from(new Set(targetNodes));
          nextActiveEdges = [];
          nextPhase = 'node';
        } else {
          // Fallback
          stopInterval();
          set({ status: 'paused' });
          return;
        }
      }

      // Update nodes & edges hasMessage property
      const updatedNodes = nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          hasMessage: nextActiveNodes.includes(node.id),
        },
      })) as AppNode[];

      const updatedEdges = edges.map((edge) => ({
        ...edge,
        data: {
          ...edge.data,
          hasMessage: nextActiveEdges.includes(edge.id),
        },
      })) as AppEdge[];

      set({
        nodes: updatedNodes,
        edges: updatedEdges,
        simulationActiveNodes: nextActiveNodes,
        simulationActiveEdges: nextActiveEdges,
        simulationPhase: nextPhase,
        currentStep: get().currentStep + 1,
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
