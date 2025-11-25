import React, { useState, useCallback } from 'react';
// The environment seems to struggle with resolving 'reactflow'.
// For environments where external dependencies are tricky, we rely on the host to provide them,
// but for a robust single-file solution, we must ensure imports are clean.
// I will keep the imports standard but address the custom edge logic which sometimes causes issues.
// Note: The environment must provide the 'reactflow' package for this to work.
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeProps,
  type Node,
  Handle,
  Position,
  getBezierPath, // Import getBezierPath explicitly
} from 'reactflow';
// We often cannot include CSS imports in single-file React components in these environments.
// We must assume the host environment (Canvas) handles ReactFlow's default styling or rely only on Tailwind.
// Removing the explicit CSS import: import 'reactflow/dist/style.css'; 
import { Building, User, Truck, Save, X } from 'lucide-react';
import '@xyflow/react/dist/style.css';

// --- 1. CONFIGURATION AND TYPES ---

// Define custom node types
type CustomNodeType = 'company' | 'employee' | 'supplier';

interface CustomNodeProps {
  data: { label: string; name: string };
  selected: boolean;
}

interface DraggableEntity {
  type: CustomNodeType;
  label: string;
  icon: React.ElementType;
  color: string;
}

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

// Node Icon Map
const NodeIcons: Record<CustomNodeType, React.ElementType> = {
  company: Building,
  employee: User,
  supplier: Truck,
};

// Define the available entities for the sidebar
const draggableEntities: DraggableEntity[] = [
  { type: 'company', label: 'Company', icon: Building, color: 'bg-emerald-500' },
  { type: 'employee', label: 'Employee', icon: User, color: 'bg-blue-500' },
  { type: 'supplier', label: 'Supplier', icon: Truck, color: 'bg-orange-500' },
];

// --- 2. CUSTOM COMPONENTS ---

// Custom Node Component
const EntityNode: React.FC<CustomNodeProps> = ({ data, selected }) => {
  // Use data.label to determine the icon
  const Icon = NodeIcons[data.label.toLowerCase() as CustomNodeType];

  const bgColor = selected ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-white ring-1 ring-gray-300';
  const iconColor = selected ? 'text-indigo-600' : 'text-gray-600';

  const typeColorMap = {
    company: 'border-emerald-500',
    employee: 'border-blue-500',
    supplier: 'border-orange-500',
  };
  const borderColor = typeColorMap[data.label.toLowerCase() as CustomNodeType] || 'border-gray-500';

  return (
    <div className={`p-4 shadow-lg rounded-xl transition-all duration-200 min-w-48 border-b-4 ${borderColor} ${bgColor}`}>
      {/* Source Handle (for outgoing connections) */}
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-indigo-500/80 border-2 border-white" />

      <div className="flex items-center space-x-3">
        {Icon && <Icon className={`w-6 h-6 ${iconColor}`} />}
        <input
          type="text"
          value={data.name}
          // The data object is mutated directly, which is common in simple React Flow examples
          // but for larger apps, you'd use a dedicated onChange handler to update state immutably.
          onChange={(e) => (data.name = e.target.value)}
          className="font-bold text-lg text-gray-800 w-full bg-transparent border-none focus:ring-0 focus:outline-none p-0 m-0"
          placeholder={`${data.label} Name...`}
        />
      </div>
      <p className="text-sm text-gray-500 mt-1">{data.label} Entity</p>

      {/* Target Handle (for incoming connections) */}
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-indigo-500/80 border-2 border-white" />
    </div>
  );
};

// Custom Edge Component
const FlowEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  selected, // React Flow passes 'selected' automatically
}) => {
  // Use the explicitly imported getBezierPath function
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Requirement 3: Connectors should have different colors representing different states
  const strokeColor = selected ? 'stroke-indigo-600' : 'stroke-gray-500';
  const strokeWidth = selected ? 3 : 2;

  return (
    <g>
      {/* Path for the visible line */}
      <path
        id={id}
        className={`react-flow__edge-path transition-all duration-200 ${strokeColor}`}
        d={edgePath}
        strokeWidth={strokeWidth}
        // Ensure the marker is defined in the ReactFlow component's SVG defs
        markerEnd="url(#arrowhead)"
        fill="none" // Important for paths
      />
      {/* Invisible path for easier touch/mouse interaction (wider click area) */}
      <path
        className="react-flow__edge-path"
        d={edgePath}
        style={{ strokeOpacity: 0, strokeWidth: 15 }}
      />
    </g>
  );
};

// --- 3. MAIN APPLICATION COMPONENT ---

const nodeTypes = {
  company: EntityNode,
  employee: EntityNode,
  supplier: EntityNode,
};

const edgeTypes = {
  customEdge: FlowEdge,
};

const FlowWrapper: React.FC = () => {
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);
  const { project } = useReactFlow(); // Remove screenToFlowPosition as it's often not needed after project() is available.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Handle node and edge changes
  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  // Handle new connection (Requirement 2: Linking entities)
  const onConnect = useCallback(
    (connection: Connection | Edge) => {
      // Use 'customEdge' type here to apply custom styling
      setEdges((eds) => addEdge({ ...connection, type: 'customEdge', animated: true }, eds));
    },
    [setEdges]
  );

  // Allow drop on canvas
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop event (Requirement 1: Drag and Drop)
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      // Calculate position relative to the flow view
      const reactFlowBounds = (event.target as HTMLElement).closest('.reactflow-wrapper')?.getBoundingClientRect();

      const type = event.dataTransfer.getData('application/reactflow/type') as CustomNodeType;
      const label = event.dataTransfer.getData('application/reactflow/label');

      if (!type || !label || !reactFlowBounds) {
        return;
      }

      // Calculate drop position relative to the canvas
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: crypto.randomUUID(),
        type,
        position,
        data: { label, name: `${label} 1` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, project]
  );

  // Sidebar Drag Start
  const onDragStart = (event: React.DragEvent, type: CustomNodeType, label: string) => {
    event.dataTransfer.setData('application/reactflow/type', type);
    event.dataTransfer.setData('application/reactflow/label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Handle Save (Requirement 4: Save button logic)
  const handleSave = useCallback(async () => {
    if (nodes.length === 0) {
      setModalMessage("Cannot save. The canvas is empty. Drag some entities onto the board first!");
      setIsModalOpen(true);
      return;
    }

    // 1. Serialize the state to a JSON string
    const flowState = { nodes, edges };
    const flowJSON = JSON.stringify(flowState, null, 2); // Use 2-space indentation for readability

    try {
      // 2. Copy the JSON string to the clipboard
      await navigator.clipboard.writeText(flowJSON);

      // 3. Update the message
      setModalMessage(`Success! Copied ${nodes.length} entities and ${edges.length} connections to clipboard as JSON.`);

    } catch (err) {
      // Handle potential security errors (e.g., non-secure context)
      console.error('Failed to copy to clipboard:', err);
      setModalMessage("Error: Failed to copy to clipboard. Ensure the page is served over HTTPS or use the console to view the state.");
    }
    setIsModalOpen(true);
  }, [nodes, edges]);

  // Modal Component
  const Modal = () => (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 transition-opacity ${isModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="bg-white p-6 rounded-lg shadow-2xl max-w-sm w-full transform transition-all duration-300 scale-100">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-800">System Notification</h3>
          <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className={`text-md ${nodes.length > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{modalMessage}</p>
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 font-inter">
      {/* Header/Controls */}
      <div className="flex items-center justify-between p-4 bg-white shadow-md border-b border-gray-100 flex-shrink-0">
        <h1 className="text-2xl font-extrabold text-gray-800">
          Business <span className="text-indigo-600">Modeler</span>
        </h1>
        <button
          onClick={handleSave}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 active:scale-95"
        >
          <Save className="w-5 h-5 mr-2" />
          Save Diagram
        </button>
      </div>

      <div className="flex flex-grow overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 p-4 bg-gray-50 border-r border-gray-200 flex-shrink-0 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Entities</h2>
          {draggableEntities.map((entity) => (
            <div
              key={entity.type}
              className={`p-3 mb-3 cursor-grab rounded-lg shadow-md bg-white border-l-4 ${entity.color.replace('bg-', 'border-')} hover:shadow-lg transition-shadow duration-200 active:ring-4 active:ring-opacity-50 active:ring-indigo-300`}
              onDragStart={(event) => onDragStart(event, entity.type, entity.label)}
              draggable
            >
              <div className="flex items-center space-x-3">
                <entity.icon className={`w-5 h-5 ${entity.color.replace('bg-', 'text-')}`} />
                <span className="font-medium text-gray-800">{entity.label}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Drag onto canvas to create entity</p>
            </div>
          ))}
        </aside>

        {/* React Flow Canvas */}
        {/* Added reactflow-wrapper class for drop position calculation */}
        <div className="flex-grow h-full reactflow-wrapper">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
          >
            <Controls />
            <MiniMap nodeColor={(n) => {
              switch (n.type) {
                case 'company': return '#10B981';
                case 'employee': return '#3B82F6';
                case 'supplier': return '#F97316';
                default: return '#1E293B';
              }
            }} />
            <Background color="#ccc" gap={16} />
            {/* Edge Marker Definition (for arrows) */}
            <svg>
              <defs>
                {/* Defined a marker with the ID 'arrowhead' to match the usage in FlowEdge */}
                <marker
                  id="arrowhead"
                  viewBox="0 0 10 10"
                  refX="10"
                  refY="5"
                  markerWidth="8"
                  markerHeight="8"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#6B7280" />
                </marker>
              </defs>
            </svg>
          </ReactFlow>
        </div>
      </div>
      <Modal />
    </div>
  );
};

// Main App component to include ReactFlowProvider
const NewBusinessModelCanvas: React.FC = () => (
  <ReactFlowProvider>
    <div style={{ width: '100%', height: '100vh' }}>
      <FlowWrapper />
    </div>
  </ReactFlowProvider>
);

export default NewBusinessModelCanvas;