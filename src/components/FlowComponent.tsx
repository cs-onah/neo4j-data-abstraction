import { useState, useCallback } from 'react';
import { 
  ReactFlow,
  Controls, 
  Background,
  BackgroundVariant,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Connection, // Type for the new connection object
  type NodeChange, // Type for node changes
  type EdgeChange, // Type for edge changes
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

// Import the custom types
import type { RFNode, RFEdge } from '../models/ReactFlowModels';


// 1. Define the initial Nodes using the RFNode type
const initialNodes: RFNode[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'A: Start Process' },
    position: { x: 50, y: 50 },
  },
  {
    id: '2',
    data: { label: 'B: Middle Step' },
    position: { x: 50, y: 150 },
  },
  {
    id: '3',
    type: 'output',
    data: { label: 'C: End Result' },
    position: { x: 50, y: 250 },
  },
];

// 2. Define the initial Edges using the RFEdge type
const initialEdges: RFEdge[] = [
  { id: 'e1-2', source: '1', target: '2', label: 'Flows to', animated: true },
  { id: 'e2-3', source: '2', target: '3', type: 'step' },
];

function FlowComponent() {
  // 3. Initialize state with the defined types
  const [nodes, setNodes] = useState<RFNode[]>(initialNodes);
  const [edges, setEdges] = useState<RFEdge[]>(initialEdges);

  // 4. Define handlers using useCallback for performance and explicit types
  
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds) as RFNode[]);
    },
    [setNodes]
  );
  
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds) as RFEdge[]);
    },
    [setEdges]
  );

  // When a user connects two nodes by drawing an edge
  const onConnect = useCallback(
    (connection: Connection) => {
      // The `addEdge` function automatically creates the new edge object
      setEdges((eds) => addEdge(connection, eds) as RFEdge[]);
    },
    [setEdges]
  );

  return (
    // Set explicit size for the ReactFlow wrapper
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background variant={BackgroundVariant.Cross} gap={12} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default FlowComponent;