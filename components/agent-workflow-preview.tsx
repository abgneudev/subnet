'use client';

import React from 'react';
import { Play, Plus } from 'lucide-react';

interface Node {
  id: string;
  type: 'start' | 'agent';
  label: string;
  description?: string;
  x: number;
  y: number;
  status: 'completed' | 'active' | 'pending';
  annotation?: string;
}

interface Connection {
  from: string;
  to: string;
}

export function AgentWorkflowPreview() {
  const nodes: Node[] = [
    { 
      id: 'start', 
      type: 'start', 
      label: 'Start', 
      x: 100, 
      y: 250,
      status: 'completed'
    },
    { 
      id: 'process', 
      type: 'agent', 
      label: 'Process request',
      description: 'Agent',
      x: 350, 
      y: 250,
      status: 'active',
      annotation: 'Agent processes user input'
    },
    { 
      id: 'respond', 
      type: 'agent', 
      label: 'Generate response',
      description: 'Agent',
      x: 650, 
      y: 250,
      status: 'pending',
      annotation: 'Agent generates and returns response'
    }
  ];

  const connections: Connection[] = [
    { from: 'start', to: 'process' },
    { from: 'process', to: 'respond' }
  ];

  const getNodeColor = (node: Node) => {
    if (node.type === 'start') return 'bg-green-100 border-green-300';
    if (node.status === 'completed') return 'bg-blue-50 border-blue-300';
    if (node.status === 'active') return 'bg-blue-100 border-blue-400';
    return 'bg-gray-50 border-gray-300';
  };

  const getNodeIcon = (node: Node) => {
    if (node.type === 'start') return <Play className="w-4 h-4" />;
    return <span className="text-lg">🤖</span>;
  };

  return (
    <div className="bg-gray-900 rounded-lg relative overflow-hidden h-full">
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium">
          Agent workflow preview
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <button className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-lg border border-gray-700">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <svg className="absolute inset-0 w-full h-full">
        {connections.map((conn, idx) => {
          const fromNode = nodes.find(n => n.id === conn.from);
          const toNode = nodes.find(n => n.id === conn.to);
          if (!fromNode || !toNode) return null;
          return (
            <line
              key={idx}
              x1={fromNode.x + 100}
              y1={fromNode.y + 25}
              x2={toNode.x}
              y2={toNode.y + 25}
              stroke="#4B5563"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          );
        })}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#4B5563"
            />
          </marker>
        </defs>
      </svg>

      <div className="relative h-full">
        {nodes.map((node) => (
          <div key={node.id} className="absolute" style={{ left: node.x, top: node.y }}>
            {node.annotation && (
              <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-48">
                <div className="bg-yellow-500 text-gray-900 px-3 py-2 rounded-lg text-xs">
                  {node.annotation}
                </div>
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-yellow-500 mx-auto" />
              </div>
            )}
            <div className={`${getNodeColor(node)} border-2 rounded-lg px-4 py-2 min-w-[150px] cursor-pointer hover:shadow-lg transition-all`}>
              <div className="flex items-center gap-2">
                {getNodeIcon(node)}
                <div>
                  <div className="font-semibold text-sm">{node.label}</div>
                  {node.description && (
                    <div className="text-xs text-gray-500">{node.description}</div>
                  )}
                </div>
              </div>
              {node.status === 'active' && (
                <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <button className="absolute bottom-4 right-4 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg border border-gray-700 flex items-center gap-2 text-sm">
        <Plus className="w-4 h-4" />
        New node
      </button>
    </div>
  );
}
