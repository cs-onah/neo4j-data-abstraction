import React, { useState, useCallback, useRef, type MouseEvent, type DragEvent, type FC } from 'react';
import { Focus, Building2, Users, Truck, type LucideIcon, Trash2 } from 'lucide-react';
// Corrected imports for reactflow using CDN paths for single-file environment
import ReactFlow, {
    ReactFlowProvider,
    useNodesState,
    useEdgesState,
    addEdge,
    useReactFlow,
    type Node,
    type Edge,
    type Connection,
    Handle,
    Position,
    type NodeProps,
    type OnConnect,
} from 'reactflow';

// Since we can't rely on global library setup, we must define the minimal styles needed for reactflow handles
// NOTE: In a true production environment, you would import 'reactflow/dist/style.css'
const reactFlowStyles = `
/* Basic styles to make React Flow handles and nodes function correctly */
.react-flow__handle {
    position: absolute;
    width: 10px;
    height: 10px;
    background: #555;
    border-radius: 50%;
    cursor: crosshair;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 8px;
    color: white;
}
.react-flow__handle-left {
    left: -5px;
}
.react-flow__handle-right {
    right: -5px;
}
.react-flow__handle-top {
    top: -5px;
}
.react-flow__handle-bottom {
    bottom: -5px;
}
.react-flow__handle-target {
    background: #0080ff;
}
.react-flow__handle-source {
    background: #ff4d4d;
}
`;


// We must manually define a unique ID generator for nodes/edges
const generateUniqueId = (prefix: string = 'rf'): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};


// --- Configuration & Types ---

type EntityType = 'Company' | 'Employee' | 'Supplier';

interface EntityConfig {
    icon: LucideIcon;
    color: string;
    initialName: string;
    description: string;
}

// Data specific to our custom node (passed via data prop in RF Node)
interface CustomNodeData {
    type: EntityType;
    name: string;
    onNameChange: (id: string, newName: string) => void;
    onNodeDelete: (id: string) => void;
}

// Map configuration to entity types
const ENTITY_CONFIG: Record<EntityType, EntityConfig> = {
    Company: {
        icon: Building2,
        color: 'bg-indigo-500',
        initialName: 'New Company',
        description: 'The core business entity.',
    },
    Employee: {
        icon: Users,
        color: 'bg-green-500',
        initialName: 'New Employee',
        description: 'A resource entity.',
    },
    Supplier: {
        icon: Truck,
        color: 'bg-orange-500',
        initialName: 'New Supplier',
        description: 'An external partner entity.',
    },
};


// --- Custom Node Component ---

/**
 * Draggable and editable node component used by React Flow.
 */
const CustomNode: FC<NodeProps<CustomNodeData>> = ({ id, data }) => {
    const { type, name, onNameChange, onNodeDelete } = data;
    const { icon: Icon, color, description } = ENTITY_CONFIG[type];
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDoubleClick = (): void => {
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>): void => {
        const newName = e.target.value.trim();
        if (newName !== name && newName.length > 0) {
            onNameChange(id, newName);
        }
    };
    
    // Handler for the delete button click
    const handleDeleteClick = (e: MouseEvent<HTMLButtonElement>): void => {
        e.stopPropagation(); 
        
        // NOTE: In a production app, this should be replaced by a custom modal UI 
        if (window.confirm(`Are you sure you want to delete the entity: ${name}?`)) {
            onNodeDelete(id);
        }
    };

    return (
        <div className="p-4 rounded-xl shadow-2xl z-10 w-60 transform hover:shadow-xl transition-shadow border-2 border-transparent hover:border-indigo-400">
            {/* Target Handle (Input) on the Left */}
            <Handle 
                type="target" 
                position={Position.Left} 
                id="a" 
                className="!bg-indigo-600 !w-4 !h-4 !border-2 !border-white !-ml-2 !shadow-lg react-flow__handle-target"
            />

            <div className={`flex items-center justify-between ${color} text-white p-3 rounded-t-lg`}>
                <div className="flex items-center">
                    <Icon className="w-6 h-6 mr-3" />
                    <span className="text-lg font-bold">{type}</span>
                </div>
                {/* Delete button */}
                <button 
                    onClick={handleDeleteClick}
                    onMouseDown={(e) => e.stopPropagation()} // Prevent node drag start
                    className="p-1 rounded-full bg-white/20 hover:bg-white/40 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                    title="Delete Entity"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
            <div className="bg-white p-3 border border-t-0 rounded-b-lg">
                <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={(e) => onNameChange(id, e.target.value)}
                    onBlur={handleBlur}
                    onDoubleClick={handleDoubleClick}
                    // Prevent node drag starting on input field interaction
                    onMouseDown={(e) => e.stopPropagation()} 
                    className="w-full text-center text-gray-800 font-medium text-lg border-b-2 border-transparent focus:border-indigo-500 focus:outline-none transition-colors nodrag"
                    title="Double-click or click to edit name"
                />
                <p className="text-xs text-gray-500 mt-1 text-center italic">{description}</p>
            </div>
            
            {/* Source Handle (Output) on the Right */}
             <Handle 
                type="source" 
                position={Position.Right} 
                id="b" 
                className="!bg-green-500 !w-4 !h-4 !border-2 !border-white !-mr-2 !shadow-lg react-flow__handle-source"
            />
        </div>
    );
};

// Map of custom node types for React Flow
const nodeTypes = {
    Company: CustomNode,
    Employee: CustomNode,
    Supplier: CustomNode,
};


// --- Sidebar Component ---

interface DraggableSidebarItemProps {
    type: EntityType;
}

/**
 * Draggable item for the sidebar.
 */
const DraggableSidebarItem: FC<DraggableSidebarItemProps> = ({ type }) => {
    const { icon: Icon, color } = ENTITY_CONFIG[type];

    const handleDragStart = (e: DragEvent<HTMLDivElement>): void => {
        // Transfer the node type data
        e.dataTransfer.setData('application/reactflow', type);
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div
            className={`flex items-center p-3 mb-4 rounded-xl cursor-grab transition-all hover:shadow-lg ${color} text-white shadow-md`}
            draggable
            onDragStart={handleDragStart}
        >
            <Icon className="w-5 h-5 mr-3" />
            <span className="font-semibold">{type}</span>
        </div>
    );
};

// --- React Flow Core Component (Canvas) ---

const FlowCanvas: FC = () => {
    // Initialize nodes and edges with hooks
    const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeData>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    
    // Get the instance for utility functions like project
    const { screenToFlowPosition } = useReactFlow();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    // --- Connection Handling (When user drags handle to handle) ---
    const onConnect: OnConnect = useCallback((params: Edge | Connection) => {
        setEdges((eds) => addEdge({ 
            ...params, 
            id: generateUniqueId('edge'),
            animated: true,
            style: { stroke: '#4F46E5', strokeWidth: 2 }, // Apply custom styling to the edge
        }, eds));
    }, [setEdges]);

    // --- Custom Action Handlers passed to CustomNode ---

    // 1. Handle Name Change
    const handleNameChange = useCallback((id: string, newName: string) => {
        setNodes((nds) => 
            nds.map((node) => 
                node.id === id 
                    ? { ...node, data: { ...node.data, name: newName } } 
                    : node
            )
        );
    }, [setNodes]);

    // 2. Handle Node Deletion
    const handleNodeDelete = useCallback((id: string) => {
        // Remove connections first
        setEdges((eds) => eds.filter(edge => edge.source !== id && edge.target !== id));
        
        // Remove node
        setNodes((nds) => nds.filter(node => node.id !== id));
    }, [setNodes, setEdges]);


    // --- Drag and Drop from Sidebar ---

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((e: DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        const nodeType = e.dataTransfer.getData('application/reactflow') as EntityType | '';

        if (reactFlowWrapper.current && nodeType && ENTITY_CONFIG[nodeType]) {
            const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
            const config = ENTITY_CONFIG[nodeType];
            
            const newNode: Node<CustomNodeData> = {
                id: generateUniqueId('node'),
                type: nodeType, // Must match the key in nodeTypes map
                position: { 
                    x: position.x - 120, // Center the node horizontally
                    y: position.y - 55,  // Center the node vertically
                },
                data: {
                    type: nodeType,
                    name: config.initialName,
                    onNameChange: handleNameChange, // Pass the handler
                    onNodeDelete: handleNodeDelete, // Pass the handler
                },
            };

            setNodes((nds) => nds.concat(newNode));
        }
    }, [screenToFlowPosition, setNodes, handleNameChange, handleNodeDelete]);


    return (
        <div ref={reactFlowWrapper} className="w-full h-full relative">
            <style>{reactFlowStyles}</style> {/* Inject minimal React Flow styles */}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                // Use built-in change handlers for dragging/movement
                onNodesChange={(changes) => onNodesChange(changes)}
                onEdgesChange={(changes) => onEdgesChange(changes)}
                
                // Use built-in connection handler
                onConnect={onConnect}
                
                // Custom node types registration
                nodeTypes={nodeTypes}

                // Drag and Drop handlers
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                
                // Ensure nodes are draggable by default
                proOptions={{ hideAttribution: true }}
                fitView
            >
                {/* Placeholder for no nodes */}
                {nodes.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-gray-400 z-20">
                        <Focus className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-xl font-semibold">
                            Drag an entity here to start modeling.
                        </p>
                    </div>
                )}
            </ReactFlow>
        </div>
    );
};


/**
 * Main application component wrapper.
 */
const BusinessModelCanvas: FC = () => {
    return (
        <div className="flex h-screen bg-gray-50 font-inter">
            {/* Sidebar */}
            <aside className="w-64 bg-white p-6 shadow-xl flex-shrink-0">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-6 border-b pb-2">
                    Entities
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                    Drag and drop these entities onto the canvas to model your business.
                </p>

                {(Object.keys(ENTITY_CONFIG) as EntityType[]).map((type) => (
                    <DraggableSidebarItem key={type} type={type} />
                ))}

                <div className="mt-8 pt-4 border-t">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Instructions</h3>
                    <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
                        <li>Drag items from here to the canvas.</li>
                        <li className="font-bold text-indigo-600">Drag nodes to move (Pan/Zoom available).</li>
                        <li className="font-bold text-green-600">Drag the connection handles to link nodes.</li>
                        <li>Double-click a node name to edit it.</li>
                        <li className="font-bold text-red-600">Click the trash icon to delete.</li>
                    </ul>
                </div>
            </aside>

            {/* Canvas wrapped in ReactFlowProvider */}
            <main className="flex-grow relative overflow-hidden">
                <ReactFlowProvider>
                    <FlowCanvas />
                </ReactFlowProvider>
            </main>
        </div>
    );
}

export default BusinessModelCanvas;