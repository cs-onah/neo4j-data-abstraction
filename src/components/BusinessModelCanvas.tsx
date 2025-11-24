import React, { useState, useCallback, useRef, useEffect, type MouseEvent, type DragEvent, type FC } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Focus, Building2, Users, Truck } from 'lucide-react';

// --- Types and Interfaces ---

// Define the specific types of entities allowed
type EntityType = 'Company' | 'Employee' | 'Supplier';

// Interface for the data structure of a single diagram node
interface Node {
    id: string;
    type: EntityType;
    name: string;
    x: number;
    y: number;
}

// Interface for the configuration of each entity type
interface EntityConfig {
    icon: LucideIcon;
    color: string;
    initialName: string;
    description: string;
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

// --- Helper Functions ---

/**
 * Generates a unique ID.
 * @returns {string} A unique ID.
 */
const generateUniqueId = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `node-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};


// --- Components ---

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

interface DiagramNodeProps {
    node: Node;
    onNameChange: (id: string, newName: string) => void;
    onDragStart: (e: MouseEvent<HTMLDivElement>, id: string) => void;
}

/**
 * Draggable and editable node on the canvas.
 */
const DiagramNode: FC<DiagramNodeProps> = ({ node, onNameChange, onDragStart }) => {
    const { id, type, name, x, y } = node;
    const { icon: Icon, color, description } = ENTITY_CONFIG[type];
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDoubleClick = (): void => {
        // Focus the input field on double click for editing
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>): void => {
        // Trim and update name on blur
        const newName = e.target.value.trim();
        if (newName !== name && newName.length > 0) {
            onNameChange(id, newName);
        }
    };

    return (
        <div
            style={{ transform: `translate(${x}px, ${y}px)` }}
            className="absolute p-4 rounded-xl shadow-2xl cursor-grab z-10 w-60 transform transition-shadow hover:shadow-xl group"
            onMouseDown={(e) => onDragStart(e, id)}
        >
            <div className={`flex items-center ${color} text-white p-3 rounded-t-lg`}>
                <Icon className="w-6 h-6 mr-3" />
                <span className="text-lg font-bold">{type}</span>
            </div>
            <div className="bg-white p-3 border border-t-0 rounded-b-lg">
                <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={(e) => onNameChange(id, e.target.value)}
                    onBlur={handleBlur}
                    onDoubleClick={handleDoubleClick}
                    className="w-full text-center text-gray-800 font-medium text-lg border-b-2 border-transparent focus:border-indigo-500 focus:outline-none transition-colors"
                    title="Double-click or click to edit name"
                />
                <p className="text-xs text-gray-500 mt-1 text-center italic">{description}</p>
            </div>
        </div>
    );
};


/**
 * Main application component.
 */
const BusinessModelCanvas: FC = () => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    // --- Node Creation (Drop from Sidebar) ---

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((e: DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        const nodeType = e.dataTransfer.getData('application/reactflow') as EntityType | '';

        // Check if the nodeType is a valid key in ENTITY_CONFIG
        if (canvasRef.current && nodeType && ENTITY_CONFIG[nodeType as EntityType]) {
            const canvasRect = canvasRef.current.getBoundingClientRect();
            // Calculate position relative to the canvas origin (top-left)
            const x = e.clientX - canvasRect.left - 30; // 30px offset for center approximation
            const y = e.clientY - canvasRect.top - 30;

            const newNode: Node = {
                id: generateUniqueId(),
                type: nodeType as EntityType, // Assert type after checking config
                name: ENTITY_CONFIG[nodeType as EntityType].initialName,
                x: Math.max(0, x), // Ensure position is non-negative
                y: Math.max(0, y),
            };

            setNodes((prevNodes) => [...prevNodes, newNode]);
        }
    }, []);


    // --- Node Movement (Dragging existing node) ---

    // State to store the offset from the node's top-left corner to the mouse click point
    const [dragOffset, setDragOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });

    const handleNodeDragStart = useCallback((e: MouseEvent<HTMLDivElement>, nodeId: string): void => {
        const target = e.currentTarget as HTMLDivElement;
        const rect = target.getBoundingClientRect();

        // Calculate offset (how far the click is from the top-left of the node)
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        setDragOffset({ x: offsetX, y: offsetY });
        setDraggedNodeId(nodeId);
        setIsDragging(true);
        // Prevent default text selection behavior during drag
        e.preventDefault();
    }, []);

    const handleMouseMove = useCallback((e: globalThis.MouseEvent): void => {
        if (!isDragging || !draggedNodeId || !canvasRef.current) return;

        const canvasRect = canvasRef.current.getBoundingClientRect();

        // Calculate the new position of the node's top-left corner
        const newX = e.clientX - canvasRect.left - dragOffset.x;
        const newY = e.clientY - canvasRect.top - dragOffset.y;

        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                node.id === draggedNodeId
                    ? { ...node, x: newX, y: newY }
                    : node
            )
        );
    }, [isDragging, draggedNodeId, dragOffset]);

    const handleMouseUp = useCallback((): void => {
        setIsDragging(false);
        setDraggedNodeId(null);
    }, []);

    // Attach/detach global mouse move/up listeners for smooth dragging outside the node boundary
    useEffect(() => {
        if (isDragging) {
            // Add 'globalThis.' to satisfy the TypeScript environment for global window events
            globalThis.window.addEventListener('mousemove', handleMouseMove);
            globalThis.window.addEventListener('mouseup', handleMouseUp);
        } else {
            globalThis.window.removeEventListener('mousemove', handleMouseMove);
            globalThis.window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            globalThis.window.removeEventListener('mousemove', handleMouseMove);
            globalThis.window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);


    // --- Node Editing ---

    const handleNameChange = useCallback((id: string, newName: string): void => {
        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                node.id === id ? { ...node, name: newName } : node
            )
        );
    }, []);


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

                {/* Using Object.keys and asserting the type for map function */}
                {(Object.keys(ENTITY_CONFIG) as EntityType[]).map((type) => (
                    <DraggableSidebarItem key={type} type={type} />
                ))}

                <div className="mt-8 pt-4 border-t">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Instructions</h3>
                    <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
                        <li>Drag items from here to the canvas.</li>
                        <li>Drag dropped nodes to move them.</li>
                        <li>Double-click a node name to edit it.</li>
                    </ul>
                </div>
            </aside>

            {/* Canvas */}
            <main className="flex-grow relative overflow-hidden">
                <div
                    ref={canvasRef}
                    className="w-full h-full bg-slate-100/50 relative border-l border-dashed border-gray-300"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    {nodes.map((node) => (
                        <DiagramNode
                            key={node.id}
                            node={node}
                            onNameChange={handleNameChange}
                            onDragStart={handleNodeDragStart}
                        />
                    ))}

                    {/* Placeholder and helper text */}
                    {nodes.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-gray-400">
                            <Focus className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-xl font-semibold">
                                Drag an entity here to start modeling.
                            </p>
                        </div>
                    )}

                    {/* Drag indicator when a node is being moved */}
                    {isDragging && (
                        <div className="absolute inset-0 bg-indigo-500/10 pointer-events-none border-4 border-dashed border-indigo-400 z-50 rounded-lg animate-pulse"></div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default BusinessModelCanvas;