import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, ArrowDown } from "lucide-react";

export default function RecursionTree({ nodes, currentNodeId, executionPhase }) {
  // Build tree structure from flat nodes
  const treeData = useMemo(() => {
    if (!nodes || nodes.length === 0) return null;
    
    const nodeMap = {};
    nodes.forEach(node => {
      nodeMap[node.id] = { ...node, children: [] };
    });
    
    let root = null;
    nodes.forEach(node => {
      if (node.parentId === null) {
        root = nodeMap[node.id];
      } else if (nodeMap[node.parentId]) {
        nodeMap[node.parentId].children.push(nodeMap[node.id]);
      }
    });
    
    return root;
  }, [nodes]);

  const getNodeStyle = (node) => {
    const isActive = node.id === currentNodeId;
    const isBaseCase = node.isBaseCase;
    const isReturned = node.returned;
    
    if (isActive && executionPhase === 'calling') {
      return 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 scale-110 ring-4 ring-amber-500/30';
    }
    if (isActive && executionPhase === 'returning') {
      return 'bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/30 scale-105 ring-4 ring-violet-500/30';
    }
    if (isBaseCase && isReturned) {
      return 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20';
    }
    if (isReturned) {
      return 'bg-gradient-to-br from-slate-600 to-slate-700 text-slate-300 opacity-70';
    }
    if (isBaseCase) {
      return 'bg-gradient-to-br from-emerald-500/80 to-teal-500/80 text-white';
    }
    return 'bg-gradient-to-br from-indigo-500 to-blue-500 text-white';
  };

  const renderNode = (node, depth = 0) => {
    if (!node) return null;
    
    return (
      <motion.div 
        key={node.id}
        className="flex flex-col items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: depth * 0.1, duration: 0.4 }}
      >
        {/* Node */}
        <motion.div
          className={`relative px-4 py-3 rounded-xl font-mono text-sm transition-all duration-300 ${getNodeStyle(node)}`}
          whileHover={{ scale: 1.05 }}
          layout
        >
          <div className="font-semibold">{node.label}</div>
          {node.returned && (
            <motion.div 
              className="text-xs mt-1 opacity-90 flex items-center justify-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <ArrowDown className="w-3 h-3" />
              returns: {node.returnValue}
            </motion.div>
          )}
          
          {/* Depth indicator */}
          <div className="absolute -right-2 -top-2 w-5 h-5 rounded-full bg-slate-800 text-xs flex items-center justify-center text-slate-400 border border-slate-600">
            {depth}
          </div>
        </motion.div>
        
        {/* Children */}
        {node.children && node.children.length > 0 && (
          <>
            {/* Connector line down */}
            <motion.div 
              className="w-0.5 h-6 bg-gradient-to-b from-slate-500 to-slate-600"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: depth * 0.1 + 0.2 }}
            />
            
            {/* Horizontal connector */}
            {node.children.length > 1 && (
              <motion.div 
                className="h-0.5 bg-slate-600"
                style={{ 
                  width: `${Math.max(node.children.length * 120, 100)}px`,
                  maxWidth: '100%'
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: depth * 0.1 + 0.3 }}
              />
            )}
            
            {/* Children container */}
            <div className="flex gap-4 mt-2">
              {node.children.map((child, i) => (
                <div key={child.id} className="flex flex-col items-center">
                  {node.children.length > 1 && (
                    <motion.div 
                      className="w-0.5 h-4 bg-slate-600"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: depth * 0.1 + 0.4 }}
                    />
                  )}
                  {renderNode(child, depth + 1)}
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    );
  };

  return (
    <Card className="bg-slate-900/95 backdrop-blur-xl border-slate-700/50 overflow-hidden h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
        <GitBranch className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-medium text-slate-200">Recursion Tree</span>
        <div className="ml-auto flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gradient-to-br from-amber-500 to-orange-500" />
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gradient-to-br from-emerald-500 to-teal-500" />
            <span>Base Case</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gradient-to-br from-slate-600 to-slate-700" />
            <span>Returned</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        <AnimatePresence>
          {treeData ? (
            <div className="flex justify-center min-w-max">
              {renderNode(treeData)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <GitBranch className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Run the visualization to see the recursion tree</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}