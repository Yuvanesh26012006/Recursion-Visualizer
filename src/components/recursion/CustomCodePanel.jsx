import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Code, Play, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const LANGUAGES = [
  { id: 'java', name: 'Java', icon: '☕' },
  { id: 'python', name: 'Python', icon: '🐍' },
  { id: 'cpp', name: 'C++', icon: '⚡' },
  { id: 'c', name: 'C', icon: '🔧' },
  { id: 'javascript', name: 'JavaScript', icon: '📜' },
];

export default function CustomCodePanel({ 
  onAnalyze, 
  isAnalyzing,
  error 
}) {
  const [language, setLanguage] = useState('java');
  const [code, setCode] = useState('');
  const [inputParams, setInputParams] = useState('');
  const [showHelp, setShowHelp] = useState(true);

  const handleAnalyze = () => {
    if (!code.trim()) {
      return;
    }
    onAnalyze({ language, code });
  };

  const exampleTemplates = {
    java: `public int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

// Call the function with input
factorial(5);`,
    python: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Call the function with input
fibonacci(5)`,
    cpp: `int power(int base, int exp) {
    if (exp == 0) {
        return 1;
    }
    return base * power(base, exp - 1);
}

// Call the function with input
power(2, 4);`,
    c: `int sum(int arr[], int n, int i) {
    if (i >= n) {
        return 0;
    }
    return arr[i] + sum(arr, n, i + 1);
}

// Call the function with input
int arr[] = {1, 2, 3, 4, 5};
sum(arr, 5, 0);`,
    javascript: `function factorial(n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

// Call the function with input
factorial(5);`,
  };

  const loadTemplate = () => {
    setCode(exampleTemplates[language]);
  };

  return (
    <Card className="bg-slate-900/95 backdrop-blur-xl border-slate-700/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-slate-200">Custom Code Input</span>
        </div>
        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
          Paste Your Code
        </Badge>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Language Selection */}
        <div className="space-y-2">
          <Label className="text-slate-300">Programming Language</Label>
          <div className="flex gap-2">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.id} value={lang.id}>
                    <span className="flex items-center gap-2">
                      <span>{lang.icon}</span>
                      <span>{lang.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={loadTemplate}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Load Template
            </Button>
          </div>
        </div>

        {/* Help Text */}
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-indigo-300 mb-1">
                  <strong>How to use:</strong>
                </p>
                <ul className="text-xs text-indigo-300/80 space-y-1 list-disc list-inside">
                  <li>Paste your recursive function below</li>
                  <li>Add a function call with your input values at the end (e.g., <code>factorial(5);</code>)</li>
                  <li>Click "Analyze & Visualize" to see the recursion tree</li>
                </ul>
                <p className="text-xs text-indigo-300/80 mt-2">
                  <strong>Example:</strong> <code>factorial(5);</code> or <code>fibonacci(6);</code>
                </p>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-indigo-400/60 hover:text-indigo-400"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}

        {/* Code Input */}
        <div className="space-y-2">
          <Label className="text-slate-300">
            Recursive Function Code
            <span className="text-slate-500 text-xs ml-2">(Include function call at the end)</span>
          </Label>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`Paste your ${LANGUAGES.find(l => l.id === language)?.name} recursive function here...\n\n// Example:\nfunction factorial(n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\n\nfactorial(5);  // Call with input`}
            className="bg-slate-800 border-slate-700 text-slate-200 font-mono text-sm min-h-[350px] resize-y"
          />
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-400 font-medium">Analysis Error</p>
              <p className="text-xs text-red-300/80 mt-1">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Analyze Button */}
        <Button
          onClick={handleAnalyze}
          disabled={!code.trim() || isAnalyzing}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Code...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Analyze & Visualize
            </>
          )}
        </Button>

        {/* Info */}
        <div className="text-xs text-slate-500 bg-slate-800/30 rounded p-2">
          <strong>💡 Tip:</strong> Include a function call at the end of your code (e.g., <code className="text-indigo-400">factorial(5);</code>) 
          so the visualizer knows what input to use. Your code is analyzed using AI - NOT executed - for safety.
        </div>
      </div>
    </Card>
  );
}