import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Info } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { base44 } from "@/api/base44Client";

import CodeEditor from "@/components/recursion/CodeEditor";
import RecursionTree from "@/components/recursion/RecursionTree";
import CallStack from "@/components/recursion/CallStack";
import ControlPanel from "@/components/recursion/ControlPanel";
import ExampleSelector, { EXAMPLES } from "@/components/recursion/ExampleSelector";
import ExecutionLog from "@/components/recursion/ExecutionLog";
import ModeToggle from "@/components/recursion/ModeToggle";
import CustomCodePanel from "@/components/recursion/CustomCodePanel";

// Recursion simulators for each example
const simulators = {
  factorial: (n, addStep, nodeId = 0, parentId = null) => {
    const steps = [];
    const simulate = (n, nodeId, parentId) => {
      const label = `factorial(${n})`;
      steps.push({ type: 'call', nodeId, parentId, label, params: { n }, isBaseCase: n <= 1 });
      
      if (n <= 1) {
        steps.push({ type: 'return', nodeId, value: 1, isBaseCase: true });
        return { result: 1, steps };
      }
      
      const childId = steps.length;
      const childResult = simulate(n - 1, childId, nodeId);
      const result = n * childResult.result;
      steps.push({ type: 'return', nodeId, value: result });
      return { result, steps };
    };
    simulate(n, 0, null);
    return steps;
  },
  
  fibonacci: (n) => {
    const steps = [];
    let nodeCounter = 0;
    
    const simulate = (n, parentId = null) => {
      const currentId = nodeCounter++;
      const label = `fib(${n})`;
      const isBaseCase = n <= 1;
      
      steps.push({ type: 'call', nodeId: currentId, parentId, label, params: { n }, isBaseCase });
      
      if (n <= 0) {
        steps.push({ type: 'return', nodeId: currentId, value: 0, isBaseCase: true });
        return { result: 0, id: currentId };
      }
      if (n === 1) {
        steps.push({ type: 'return', nodeId: currentId, value: 1, isBaseCase: true });
        return { result: 1, id: currentId };
      }
      
      const left = simulate(n - 1, currentId);
      const right = simulate(n - 2, currentId);
      const result = left.result + right.result;
      
      steps.push({ type: 'return', nodeId: currentId, value: result });
      return { result, id: currentId };
    };
    
    simulate(n);
    return steps;
  },
  
  binarySearch: (input) => {
    const { arr, target, low, high } = input;
    const steps = [];
    let nodeCounter = 0;
    
    const simulate = (low, high, parentId = null) => {
      const currentId = nodeCounter++;
      const label = `search(${low}, ${high})`;
      const isBaseCase = low > high;
      
      steps.push({ 
        type: 'call', 
        nodeId: currentId, 
        parentId, 
        label, 
        params: { low, high, mid: low <= high ? Math.floor((low + high) / 2) : null },
        isBaseCase 
      });
      
      if (low > high) {
        steps.push({ type: 'return', nodeId: currentId, value: -1, isBaseCase: true });
        return { result: -1, id: currentId };
      }
      
      const mid = Math.floor((low + high) / 2);
      
      if (arr[mid] === target) {
        steps.push({ type: 'return', nodeId: currentId, value: mid, isBaseCase: true });
        return { result: mid, id: currentId };
      }
      
      if (arr[mid] > target) {
        const child = simulate(low, mid - 1, currentId);
        steps.push({ type: 'return', nodeId: currentId, value: child.result });
        return { result: child.result, id: currentId };
      } else {
        const child = simulate(mid + 1, high, currentId);
        steps.push({ type: 'return', nodeId: currentId, value: child.result });
        return { result: child.result, id: currentId };
      }
    };
    
    simulate(low, high);
    return steps;
  },
  
  sumArray: (input) => {
    const { arr, index } = input;
    const steps = [];
    let nodeCounter = 0;
    
    const simulate = (idx, parentId = null) => {
      const currentId = nodeCounter++;
      const label = `sum(${idx})`;
      const isBaseCase = idx >= arr.length;
      
      steps.push({ 
        type: 'call', 
        nodeId: currentId, 
        parentId, 
        label, 
        params: { index: idx, value: arr[idx] },
        isBaseCase 
      });
      
      if (idx >= arr.length) {
        steps.push({ type: 'return', nodeId: currentId, value: 0, isBaseCase: true });
        return { result: 0, id: currentId };
      }
      
      const child = simulate(idx + 1, currentId);
      const result = arr[idx] + child.result;
      
      steps.push({ type: 'return', nodeId: currentId, value: result });
      return { result, id: currentId };
    };
    
    simulate(index);
    return steps;
  },
  
  power: (input) => {
    const { base, exp } = input;
    const steps = [];
    let nodeCounter = 0;
    
    const simulate = (e, parentId = null) => {
      const currentId = nodeCounter++;
      const label = `power(${base}, ${e})`;
      const isBaseCase = e === 0;
      
      steps.push({ 
        type: 'call', 
        nodeId: currentId, 
        parentId, 
        label, 
        params: { base, exp: e },
        isBaseCase 
      });
      
      if (e === 0) {
        steps.push({ type: 'return', nodeId: currentId, value: 1, isBaseCase: true });
        return { result: 1, id: currentId };
      }
      
      const child = simulate(e - 1, currentId);
      const result = base * child.result;
      
      steps.push({ type: 'return', nodeId: currentId, value: result });
      return { result, id: currentId };
    };
    
    simulate(exp);
    return steps;
  },
};

export default function RecursionVisualizer() {
  const [mode, setMode] = useState('examples'); // 'examples' or 'custom'
  const [selectedExample, setSelectedExample] = useState(EXAMPLES[0]);
  const [code, setCode] = useState(EXAMPLES[0].code);
  const [nodes, setNodes] = useState([]);
  const [stack, setStack] = useState([]);
  const [logs, setLogs] = useState([]);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [executionPhase, setExecutionPhase] = useState(null);
  const [currentLine, setCurrentLine] = useState(null);
  
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  
  // Custom code state
  const [customCodeData, setCustomCodeData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  
  const stepsRef = useRef([]);
  const stepIndexRef = useRef(0);
  const animationRef = useRef(null);
  const isPausedRef = useRef(false);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const handleSelectExample = useCallback((example) => {
    setSelectedExample(example);
    setCode(example.code);
    setCustomCodeData(null);
    setAnalysisError(null);
    handleReset();
  }, []);

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    handleReset();
    setAnalysisError(null);
    if (newMode === 'examples') {
      setCode(EXAMPLES[0].code);
      setSelectedExample(EXAMPLES[0]);
      setCustomCodeData(null);
    }
  }, []);

  const handleReset = useCallback(() => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    setNodes([]);
    setStack([]);
    setLogs([]);
    setCurrentNodeId(null);
    setExecutionPhase(null);
    setCurrentLine(null);
    setIsRunning(false);
    setIsPaused(false);
    setIsComplete(false);
    setCurrentStep(0);
    setTotalSteps(0);
    stepsRef.current = [];
    stepIndexRef.current = 0;
  }, []);

  const executeStep = useCallback((step, allSteps) => {
    if (step.type === 'call') {
      setExecutionPhase('calling');
      setCurrentNodeId(step.nodeId);
      
      // Add node to tree
      setNodes(prev => [...prev, {
        id: step.nodeId,
        parentId: step.parentId,
        label: step.label,
        params: step.params,
        isBaseCase: step.isBaseCase,
        returned: false,
      }]);
      
      // Push to stack
      setStack(prev => [...prev, {
        id: step.nodeId,
        label: step.label,
        params: step.params,
      }]);
      
      // Add log
      setLogs(prev => [...prev, {
        type: step.isBaseCase ? 'base' : 'call',
        message: `Calling ${step.label}${step.isBaseCase ? ' (BASE CASE)' : ''}`,
      }]);
      
      setCurrentLine(step.isBaseCase ? 2 : 6);
      
    } else if (step.type === 'return') {
      setExecutionPhase('returning');
      setCurrentNodeId(step.nodeId);
      
      // Update node with return value
      setNodes(prev => prev.map(n => 
        n.id === step.nodeId 
          ? { ...n, returned: true, returnValue: step.value }
          : n
      ));
      
      // Update stack with return value then pop
      setStack(prev => {
        const updated = prev.map(s => 
          s.id === step.nodeId 
            ? { ...s, returnValue: step.value }
            : s
        );
        return updated.filter(s => s.id !== step.nodeId);
      });
      
      // Add log
      setLogs(prev => [...prev, {
        type: 'return',
        message: `Returning ${step.value} from node ${step.nodeId}`,
      }]);
      
      setCurrentLine(step.isBaseCase ? 3 : 7);
    }
  }, []);

  const runAnimation = useCallback(() => {
    if (stepIndexRef.current >= stepsRef.current.length) {
      setIsComplete(true);
      setIsRunning(false);
      setExecutionPhase(null);
      setCurrentNodeId(null);
      return;
    }

    if (isPausedRef.current) {
      return;
    }

    const step = stepsRef.current[stepIndexRef.current];
    executeStep(step, stepsRef.current);
    stepIndexRef.current++;
    setCurrentStep(stepIndexRef.current);

    const delay = 1000 / speed;
    animationRef.current = setTimeout(runAnimation, delay);
  }, [speed, executeStep]);

  const analyzeCustomCode = useCallback(async ({ language, code }) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      // Use LLM to analyze the code and generate execution steps
      const prompt = `You are a recursion analyzer. Analyze the following ${language} code containing a recursive function and its function call.

CODE:
${code}

Your task:
1. Identify the recursive function name and its parameters
2. Find the function call in the code (e.g., factorial(5), fibonacci(7), etc.)
3. Extract the input values from the function call
4. Identify the base case(s) in the recursive function
5. Simulate the complete execution trace with those input values
6. Generate a trace of all recursive calls and returns in the exact order they would occur

Return a JSON object with this EXACT structure:
{
  "functionName": "name of the recursive function",
  "inputCall": "the function call found in the code (e.g., 'factorial(5)')",
  "steps": [
    {
      "type": "call",
      "nodeId": 0,
      "parentId": null,
      "label": "functionName(actualValues)",
      "params": {"param1": value1, "param2": value2},
      "isBaseCase": false
    },
    {
      "type": "return",
      "nodeId": 0,
      "value": returnValue,
      "isBaseCase": false
    }
  ]
}

Rules:
- Extract the input from the function call in the code (e.g., if code has "factorial(5)", use 5 as input)
- If multiple function calls exist, use the last one or the one that looks like a test/example
- Start with nodeId 0 for the root call
- Each new call gets a new nodeId (increment sequentially: 0, 1, 2, 3...)
- parentId references the calling node (null for root)
- Always emit a "call" step BEFORE making child calls
- Always emit a "return" step when a call completes (AFTER all children return)
- Mark base case calls with isBaseCase: true
- Keep the trace accurate to the actual execution flow
- For the label, show the actual parameter values (e.g., "factorial(5)", "factorial(4)")
- Simulate the COMPLETE execution - don't skip steps

Example trace for factorial(3):
[
  {"type": "call", "nodeId": 0, "parentId": null, "label": "factorial(3)", "params": {"n": 3}, "isBaseCase": false},
  {"type": "call", "nodeId": 1, "parentId": 0, "label": "factorial(2)", "params": {"n": 2}, "isBaseCase": false},
  {"type": "call", "nodeId": 2, "parentId": 1, "label": "factorial(1)", "params": {"n": 1}, "isBaseCase": true},
  {"type": "return", "nodeId": 2, "value": 1, "isBaseCase": true},
  {"type": "return", "nodeId": 1, "value": 2},
  {"type": "return", "nodeId": 0, "value": 6}
]

IMPORTANT: Return ONLY valid JSON, no markdown formatting or explanation.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            functionName: { type: "string" },
            inputCall: { type: "string" },
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  nodeId: { type: "number" },
                  parentId: { type: ["number", "null"] },
                  label: { type: "string" },
                  params: { type: "object" },
                  value: { type: ["number", "string", "boolean", "null"] },
                  isBaseCase: { type: "boolean" }
                },
                required: ["type", "nodeId"]
              }
            }
          },
          required: ["functionName", "steps"]
        }
      });

      if (!response.steps || response.steps.length === 0) {
        throw new Error('Failed to analyze recursion pattern. Please ensure your code has a clear recursive function and a function call (e.g., factorial(5);)');
      }

      setCustomCodeData({
        ...response,
        code,
        language
      });
      
      setCode(code);
      setIsAnalyzing(false);
      
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisError(error.message || 'Failed to analyze code. Please ensure your code includes both a recursive function and a function call with input values.');
      setIsAnalyzing(false);
    }
  }, []);

  const handleStart = useCallback(() => {
    handleReset();
    
    let steps;
    
    if (mode === 'custom' && customCodeData) {
      // Use steps from custom code analysis
      steps = customCodeData.steps;
    } else {
      // Generate steps based on selected example
      const simulator = simulators[selectedExample.id];
      if (!simulator) return;
      steps = simulator(selectedExample.input);
    }
    
    stepsRef.current = steps;
    stepIndexRef.current = 0;
    setTotalSteps(steps.length);
    setIsRunning(true);
    setIsPaused(false);
    
    // Start animation after a brief delay
    setTimeout(runAnimation, 100);
  }, [mode, selectedExample, customCodeData, handleReset, runAnimation]);

  const handlePause = useCallback(() => {
    setIsPaused(true);
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
  }, []);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    runAnimation();
  }, [runAnimation]);

  const handleStep = useCallback(() => {
    if (!isRunning) {
      // Initialize if not started
      let steps;
      
      if (mode === 'custom' && customCodeData) {
        steps = customCodeData.steps;
      } else {
        const simulator = simulators[selectedExample.id];
        if (!simulator) return;
        steps = simulator(selectedExample.input);
      }
      
      stepsRef.current = steps;
      stepIndexRef.current = 0;
      setTotalSteps(steps.length);
      setIsRunning(true);
      setIsPaused(true);
    }
    
    if (stepIndexRef.current >= stepsRef.current.length) {
      setIsComplete(true);
      setIsRunning(false);
      return;
    }
    
    const step = stepsRef.current[stepIndexRef.current];
    executeStep(step, stepsRef.current);
    stepIndexRef.current++;
    setCurrentStep(stepIndexRef.current);
  }, [isRunning, mode, selectedExample, customCodeData, executeStep]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 p-4 md:p-6 max-w-[1800px] mx-auto">
        {/* Header */}
        <motion.header 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Recursion Visualizer
              </h1>
              <p className="text-sm text-slate-400">
                Understand recursion through interactive visualization
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="ml-2 p-1.5 rounded-full bg-slate-800/50 hover:bg-slate-800 transition-colors">
                    <Info className="w-4 h-4 text-slate-400" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Select an example, then click Run or Step to visualize how recursive calls work.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </motion.header>
        
        {/* Mode Toggle */}
        <motion.div 
          className="mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ModeToggle mode={mode} onModeChange={handleModeChange} />
        </motion.div>

        {/* Example Selector or Custom Code Panel */}
        <motion.div 
          className="mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <AnimatePresence mode="wait">
            {mode === 'examples' ? (
              <motion.div
                key="examples"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <ExampleSelector 
                  selectedExample={selectedExample}
                  onSelect={handleSelectExample}
                />
              </motion.div>
            ) : (
              <motion.div
                key="custom"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CustomCodePanel 
                  onAnalyze={analyzeCustomCode}
                  isAnalyzing={isAnalyzing}
                  error={analysisError}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Control Panel */}
        {(mode === 'examples' || customCodeData) && (
          <motion.div 
            className="mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ControlPanel
              isRunning={isRunning}
              isPaused={isPaused}
              speed={speed}
              onStart={handleStart}
              onPause={handlePause}
              onResume={handleResume}
              onStep={handleStep}
              onReset={handleReset}
              onSpeedChange={setSpeed}
              currentStep={currentStep}
              totalSteps={totalSteps}
              isComplete={isComplete}
            />
          </motion.div>
        )}
        
        {/* Main Content Grid */}
        {(mode === 'examples' || customCodeData) && (
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-12 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {/* Left Panel - Code Editor */}
            <div className="lg:col-span-4 h-[500px]">
              <CodeEditor
                code={code}
                onChange={setCode}
                currentLine={currentLine}
                isRunning={isRunning}
              />
            </div>
          
          {/* Center Panel - Recursion Tree */}
          <div className="lg:col-span-5 h-[500px]">
            <RecursionTree
              nodes={nodes}
              currentNodeId={currentNodeId}
              executionPhase={executionPhase}
            />
          </div>
          
          {/* Right Panel - Call Stack & Log */}
          <div className="lg:col-span-3 flex flex-col gap-4 h-[500px]">
            <div className="flex-1 min-h-0">
              <CallStack
                stack={stack}
                currentNodeId={currentNodeId}
                executionPhase={executionPhase}
              />
            </div>
            <div className="h-48">
              <ExecutionLog logs={logs} />
            </div>
          </div>
        </motion.div>
        )}
        
        {/* Footer */}
        <motion.footer 
          className="mt-6 text-center text-sm text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {mode === 'custom' && !customCodeData && !isAnalyzing && (
            <div className="bg-slate-800/30 rounded-lg p-4 mb-4">
              <p className="text-slate-400">
                👆 Paste your recursive code above and click "Analyze & Visualize" to get started
              </p>
            </div>
          )}
          <p>Built to help students understand recursion step by step</p>
        </motion.footer>
      </div>
    </div>
  );
}