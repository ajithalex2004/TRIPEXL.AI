import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface User {
  id: number;
  user_name: string;
  user_type: string;
  user_operation_type: string;
  user_group: string;
  is_active: boolean;
}

interface PermissionsMapProps {
  users: User[];
}

export function PermissionsMap({ users }: PermissionsMapProps) {
  // Convert users to nodes
  const initialNodes: Node[] = users.map((user) => ({
    id: user.id.toString(),
    type: 'userNode',
    data: {
      label: user.user_name,
      type: user.user_type,
      operationType: user.user_operation_type,
      group: user.user_group,
      isActive: user.is_active,
    },
    position: { x: Math.random() * 800, y: Math.random() * 600 },
  }));

  // Create edges based on user relationships (group, type, etc.)
  const initialEdges: Edge[] = users.reduce((edges: Edge[], user) => {
    // Connect users within the same group
    const sameGroupUsers = users.filter(
      (u) => u.user_group === user.user_group && u.id !== user.id
    );
    
    const groupEdges = sameGroupUsers.map((u) => ({
      id: `e-group-${user.id}-${u.id}`,
      source: user.id.toString(),
      target: u.id.toString(),
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#2563eb' },
      label: 'Same Group',
    }));

    // Connect users with same operation type
    const sameOpTypeUsers = users.filter(
      (u) => u.user_operation_type === user.user_operation_type && u.id !== user.id
    );
    
    const opTypeEdges = sameOpTypeUsers.map((u) => ({
      id: `e-optype-${user.id}-${u.id}`,
      source: user.id.toString(),
      target: u.id.toString(),
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#16a34a' },
      label: 'Same Operation Type',
    }));

    return [...edges, ...groupEdges, ...opTypeEdges];
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Custom node component
  const UserNode = ({ data }: { data: any }) => (
    <Card className="p-3 min-w-[200px] bg-white shadow-lg">
      <div className="text-sm font-semibold">{data.label}</div>
      <div className="flex flex-wrap gap-1 mt-2">
        <Badge variant="outline" className="text-xs">
          {data.type}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {data.operationType}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {data.group}
        </Badge>
        <Badge
          variant={data.isActive ? "default" : "destructive"}
          className="text-xs"
        >
          {data.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>
    </Card>
  );

  const nodeTypes = {
    userNode: UserNode,
  };

  return (
    <div className="w-full h-[800px] border rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-left" className="bg-white p-2 rounded shadow">
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-blue-600" /> Same Group
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-green-600" /> Same Operation Type
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
