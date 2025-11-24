import type { Node, Edge } from '@xyflow/react';

// 1. Define the custom data structure for your nodes
export type CustomNodeData = {
  label: string;
};

// 2. Define the types for your flow elements
// N = Node Data, E = Edge Data
export type RFNode = Node<CustomNodeData>;
export type RFEdge = Edge<any>; // Using 'any' for edge data for simplicity, but you can define a type here too