'use client';

import type React from 'react';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AVAILABLE_TOOLS, type Tool } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Info, Check, Plus, Send, Search, ArrowUpDown, Filter, CheckCircle2, ChevronDown, ChevronUp, ChevronRight, ExternalLink, HelpCircle, Play, MessageSquare, Settings, FileText, BarChart3, Database, Shield, XCircle, AlertCircle, Loader2, Terminal, Eye, Code2, Clock, Zap, X } from 'lucide-react';
import { PromptFeedbackPanel } from '@/components/prompt-feedback-panel';
import { analyzePrompt, type FeedbackSuggestion } from '@/lib/prompt-feedback';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentWorkflowPreview } from '@/components/agent-workflow-preview';

// Mock execution data for debugging
const MOCK_EXECUTIONS = [
  { id: '47', status: 'success', duration: '2.8s', timestamp: '2 min ago', nodes: ['Start', 'Process request', 'Generate response'] },
  { id: '46', status: 'failed', duration: '1.2s', timestamp: '5 min ago', nodes: ['Start', 'Process request'] },
  { id: '45', status: 'success', duration: '3.1s', timestamp: '12 min ago', nodes: ['Start', 'Process request', 'Generate response'] },
  { id: '44', status: 'success', duration: '2.5s', timestamp: '18 min ago', nodes: ['Start', 'Process request', 'Generate response'] },
];

const MOCK_LOGS = [
  { timestamp: '12:34:56', level: 'info', message: 'Workflow execution started', node: 'Start' },
  { timestamp: '12:34:57', level: 'info', message: 'Processing user input...', node: 'Process request' },
  { timestamp: '12:34:57', level: 'debug', message: 'API Call to gpt-4o initiated', node: 'Process request' },
  { timestamp: '12:34:58', level: 'warning', message: 'Rate limit warning (80% capacity)', node: 'Process request' },
  { timestamp: '12:34:59', level: 'success', message: 'Node completed successfully (1.2s)', node: 'Process request' },
  { timestamp: '12:35:00', level: 'info', message: 'Generating final response...', node: 'Generate response' },
  { timestamp: '12:35:02', level: 'success', message: 'Response generated successfully', node: 'Generate response' },
];

const MOCK_NODE_DATA = {
  'Process request': {
    input: {
      query: "How do I create a product brief?",
      context: { user_id: "123", timestamp: "2025-10-23T12:34:56Z" }
    },
    output: {
      processed: true,
      tokens: 245,
      intent: "product_documentation",
      confidence: 0.87
    },
    performance: {
      duration: '1.2s',
      tokensIn: 245,
      tokensOut: 189,
      cost: '$0.0023',
      retries: 0
    },
    llmDetails: {
      model: 'gpt-4o',
      temperature: 0.70,
      maxTokens: 2048
    }
  },
  'Generate response': {
    input: {
      processed_data: { intent: "product_documentation", confidence: 0.87 },
      template: "product_brief"
    },
    output: {
      response: "Here's a structured product brief template...",
      format: "markdown",
      length: 1240
    },
    performance: {
      duration: '2.1s',
      tokensIn: 189,
      tokensOut: 456,
      cost: '$0.0041',
      retries: 0
    },
    llmDetails: {
      model: 'gpt-4o',
      temperature: 0.70,
      maxTokens: 2048
    }
  }
};

export default function CreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('chat');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [activeTriggers, setActiveTriggers] = useState<string[]>(['chat']);
  const [chatMessage, setChatMessage] = useState('');
  const [toolSearchQuery, setToolSearchQuery] = useState('');
  const [toolSortBy, setToolSortBy] = useState<'name' | 'author' | 'category'>('name');
  const [toolFilterCategory, setToolFilterCategory] = useState<string>('all');
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [temperature, setTemperature] = useState(0.7);
  const [maxIterations, setMaxIterations] = useState(10);

  // Debugging state
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [executionPanelOpen, setExecutionPanelOpen] = useState(true);
  const [debugActiveView, setDebugActiveView] = useState<'history' | 'console'>('history');
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<'all' | 'errors' | 'warnings'>('all');
  const [isRunning, setIsRunning] = useState(false);

  // Analyze prompt for feedback
  const feedback = useMemo(() => {
    if (!prompt) return { score: { correctness: 100, clarity: 100, engagement: 100, delivery: 100 }, suggestions: [] };
    return analyzePrompt(prompt);
  }, [prompt]);

  // Filter and sort tools
  const filteredAndSortedTools = useMemo(() => {
    let tools = AVAILABLE_TOOLS.filter((tool) => {
      const matchesSearch = tool.label.toLowerCase().includes(toolSearchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(toolSearchQuery.toLowerCase()) ||
        tool.author.toLowerCase().includes(toolSearchQuery.toLowerCase());
      const matchesCategory = toolFilterCategory === 'all' || tool.category === toolFilterCategory;
      return matchesSearch && matchesCategory;
    });

    tools.sort((a, b) => {
      if (toolSortBy === 'name') return a.label.localeCompare(b.label);
      if (toolSortBy === 'author') return a.author.localeCompare(b.author);
      if (toolSortBy === 'category') return a.category.localeCompare(b.category);
      return 0;
    });

    return tools;
  }, [toolSearchQuery, toolSortBy, toolFilterCategory]);

  const handleAcceptSuggestion = (suggestion: FeedbackSuggestion) => {
    if (suggestion.originalText && suggestion.suggestedText) {
      setPrompt(prompt.replace(suggestion.originalText, suggestion.suggestedText));
    }
  };

  useEffect(() => {
    const forkId = searchParams.get('fork');
    if (forkId) {
      async function fetchAgent() {
        try {
          const response = await fetch(`/api/agents/${forkId}`);
          if (response.ok) {
            const agent = await response.json();
            setTitle(`${agent.title} (Fork)`);
            setDescription(agent.description);
            setPrompt(agent.prompt);
            setSelectedTools(agent.tools);
          }
        } catch (error) {
          console.error('Error fetching agent for fork:', error);
        }
      }
      fetchAgent();
    }
  }, [searchParams]);

  const handleToolToggle = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool],
    );
  };

  const handleTriggerToggle = (trigger: string) => {
    setActiveTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const agent = {
      title,
      description,
      prompt,
      tools: selectedTools,
    };

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agent),
      });

      if (!response.ok) {
        throw new Error('Failed to create agent');
      }

      router.push('/');
    } catch (error) {
      console.error('Error creating agent:', error);
      alert('Failed to create agent. Please try again.');
    }
  };

  // Helper functions for debugging
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-amber-600';
      case 'success': return 'text-green-600';
      case 'debug': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const filteredLogs = MOCK_LOGS.filter(log => {
    if (logFilter === 'errors') return log.level === 'error';
    if (logFilter === 'warnings') return log.level === 'warning' || log.level === 'error';
    return true;
  });

  return (
    <div className="bg-muted/30 min-h-screen">
      <Header showTabs={false} activeTab="configuration" />
      <main className="container mx-auto px-6 py-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="inline-flex h-10 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground">
              <TabsTrigger 
                value="chat" 
                className="inline-flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                <MessageSquare className="h-4 w-4" />
                Chats
              </TabsTrigger>
              <TabsTrigger 
                value="configuration"
                className="inline-flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                <Settings className="h-4 w-4" />
                Configuration
              </TabsTrigger>
              <TabsTrigger 
                value="guardrails"
                className="inline-flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                <Shield className="h-4 w-4" />
                Guardrails
              </TabsTrigger>
              <TabsTrigger 
                value="datasets"
                className="inline-flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                <Database className="h-4 w-4" />
                Datasets
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button
            onClick={handleSubmit}
            disabled={!title || !description || !prompt}
            className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
          >
            {searchParams.get('fork') ? 'Deploy Fork' : 'Deploy Agent'}
          </Button>
        </div>

        <div className="flex gap-6" style={{ minHeight: 'calc(100vh - 240px)' }}>
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col">
              {/* Top Section - Workflow + Inspector + Chat */}
              <div className="flex gap-6" style={{ height: 'calc(100vh - 240px)' }}>
                {/* Left Side - Workflow Visualization */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold">Agent Workflow</h2>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
                        <span className="text-xs text-muted-foreground">{isRunning ? 'Running' : 'Idle'}</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="default" 
                      className="cursor-pointer"
                      onClick={() => setIsRunning(!isRunning)}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Run
                    </Button>
                  </div>
                  
                  {/* Workflow Canvas */}
                  <div className="flex-1 rounded-lg border bg-background overflow-hidden relative">
                    <div className="absolute inset-0 p-6">
                      {/* Simplified Workflow Visualization */}
                      <div className="flex items-center gap-4 justify-center h-full">
                        {/* Start Node */}
                        <div 
                          onClick={() => setSelectedNode('Start')}
                          className={`flex flex-col items-center gap-2 cursor-pointer transition-all ${
                            selectedNode === 'Start' ? 'ring-2 ring-primary ring-offset-2' : ''
                          }`}
                        >
                          <div className="relative">
                            <div className="w-24 h-24 rounded-2xl bg-background border-2 border-green-500 shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow">
                              <Play className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="absolute -top-1 -right-1">
                              <CheckCircle2 className="h-5 w-5 text-green-500 bg-background rounded-full" />
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                              50ms
                            </div>
                          </div>
                          <span className="text-sm font-medium">Start</span>
                        </div>

                        {/* Arrow */}
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-0.5 bg-green-500"></div>
                          <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-8 border-l-green-500"></div>
                        </div>

                        {/* Process Request Node */}
                        <div 
                          onClick={() => setSelectedNode('Process request')}
                          className={`flex flex-col items-center gap-2 cursor-pointer transition-all ${
                            selectedNode === 'Process request' ? 'ring-2 ring-primary ring-offset-2' : ''
                          }`}
                        >
                          <div className="relative">
                            <div className="w-24 h-24 rounded-2xl bg-background border-2 border-blue-500 shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow">
                              <Zap className="h-8 w-8 text-blue-600" />
                            </div>
                            {isRunning ? (
                              <div className="absolute -top-1 -right-1">
                                <Loader2 className="h-5 w-5 text-blue-500 bg-background rounded-full animate-spin" />
                              </div>
                            ) : (
                              <div className="absolute -top-1 -right-1">
                                <CheckCircle2 className="h-5 w-5 text-green-500 bg-background rounded-full" />
                              </div>
                            )}
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                              1.2s
                            </div>
                          </div>
                          <span className="text-sm font-medium">Process request</span>
                          <span className="text-[10px] text-muted-foreground">Agent</span>
                        </div>

                        {/* Arrow */}
                        <div className="flex items-center gap-2">
                          <div className={`w-12 h-0.5 ${isRunning ? 'bg-muted' : 'bg-blue-500'}`}></div>
                          <div className={`w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-8 ${
                            isRunning ? 'border-l-muted' : 'border-l-blue-500'
                          }`}></div>
                        </div>

                        {/* Generate Response Node */}
                        <div 
                          onClick={() => setSelectedNode('Generate response')}
                          className={`flex flex-col items-center gap-2 cursor-pointer transition-all ${
                            selectedNode === 'Generate response' ? 'ring-2 ring-primary ring-offset-2' : ''
                          }`}
                        >
                          <div className="relative">
                            <div className={`w-24 h-24 rounded-2xl bg-background border-2 ${
                              isRunning ? 'border-muted' : 'border-green-500'
                            } shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow`}>
                              <MessageSquare className={`h-8 w-8 ${isRunning ? 'text-muted-foreground' : 'text-green-600'}`} />
                            </div>
                            {!isRunning && (
                              <div className="absolute -top-1 -right-1">
                                <CheckCircle2 className="h-5 w-5 text-green-500 bg-background rounded-full" />
                              </div>
                            )}
                            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              isRunning ? 'bg-muted text-muted-foreground' : 'bg-green-100 text-green-700'
                            }`}>
                              {isRunning ? '-' : '2.1s'}
                            </div>
                          </div>
                          <span className="text-sm font-medium">Generate response</span>
                          <span className="text-[10px] text-muted-foreground">Agent</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Node Inspector Panel - Slides in when node is selected */}
                {selectedNode && (
                  <div className="w-96 flex flex-col border rounded-lg bg-background shadow-lg animate-in slide-in-from-right duration-200">
                    <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">Node Inspector</h3>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedNode(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex-1 overflow-auto p-4 space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Zap className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">{selectedNode}</h4>
                            <p className="text-xs text-muted-foreground">Agent Node</p>
                          </div>
                        </div>
                      </div>

                      {MOCK_NODE_DATA[selectedNode as keyof typeof MOCK_NODE_DATA] && (
                        <>
                          {/* Input Section */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-1 bg-blue-500 rounded-full"></div>
                              <span className="text-xs font-semibold">Input</span>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-3 border">
                              <pre className="text-xs font-mono overflow-x-auto">
                                {JSON.stringify(MOCK_NODE_DATA[selectedNode as keyof typeof MOCK_NODE_DATA].input, null, 2)}
                              </pre>
                            </div>
                          </div>

                          {/* Output Section */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-1 bg-green-500 rounded-full"></div>
                              <span className="text-xs font-semibold">Output</span>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-3 border">
                              <pre className="text-xs font-mono overflow-x-auto">
                                {JSON.stringify(MOCK_NODE_DATA[selectedNode as keyof typeof MOCK_NODE_DATA].output, null, 2)}
                              </pre>
                            </div>
                          </div>

                          {/* Performance Metrics */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs font-semibold">Performance</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-muted/50 rounded-lg p-2 border">
                                <div className="text-[10px] text-muted-foreground mb-1">Duration</div>
                                <div className="text-sm font-semibold">
                                  {MOCK_NODE_DATA[selectedNode as keyof typeof MOCK_NODE_DATA].performance.duration}
                                </div>
                              </div>
                              <div className="bg-muted/50 rounded-lg p-2 border">
                                <div className="text-[10px] text-muted-foreground mb-1">Cost</div>
                                <div className="text-sm font-semibold">
                                  {MOCK_NODE_DATA[selectedNode as keyof typeof MOCK_NODE_DATA].performance.cost}
                                </div>
                              </div>
                              <div className="bg-muted/50 rounded-lg p-2 border">
                                <div className="text-[10px] text-muted-foreground mb-1">Tokens In</div>
                                <div className="text-sm font-semibold">
                                  {MOCK_NODE_DATA[selectedNode as keyof typeof MOCK_NODE_DATA].performance.tokensIn}
                                </div>
                              </div>
                              <div className="bg-muted/50 rounded-lg p-2 border">
                                <div className="text-[10px] text-muted-foreground mb-1">Tokens Out</div>
                                <div className="text-sm font-semibold">
                                  {MOCK_NODE_DATA[selectedNode as keyof typeof MOCK_NODE_DATA].performance.tokensOut}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* LLM Details */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs font-semibold">LLM Details</span>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-3 border space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Model</span>
                                <span className="font-medium">{MOCK_NODE_DATA[selectedNode as keyof typeof MOCK_NODE_DATA].llmDetails.model}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Temperature</span>
                                <span className="font-medium">{MOCK_NODE_DATA[selectedNode as keyof typeof MOCK_NODE_DATA].llmDetails.temperature}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Max Tokens</span>
                                <span className="font-medium">{MOCK_NODE_DATA[selectedNode as keyof typeof MOCK_NODE_DATA].llmDetails.maxTokens}</span>
                              </div>
                            </div>
                          </div>

                          {/* Logs for this node */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs font-semibold">Logs</span>
                            </div>
                            <div className="space-y-1">
                              {MOCK_LOGS.filter(log => log.node === selectedNode).map((log, idx) => (
                                <div key={idx} className="text-xs bg-muted/50 rounded p-2 border">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-muted-foreground font-mono text-[10px]">{log.timestamp}</span>
                                    <span className={`font-medium text-[10px] ${getLevelColor(log.level)}`}>
                                      {log.level.toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="text-foreground">{log.message}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Right Side - Chat Section */}
                <div className={`flex flex-col border-l pl-6 ${selectedNode ? 'w-[320px]' : 'w-[400px]'} transition-all`}>
                  {/* Chat Header */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Test Your Agent</h2>
                      <Button variant="ghost" size="icon">
                        <span className="sr-only">Minimize</span>
                        ✕
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">Model:</span>
                      <Badge variant="secondary" className="text-xs">{selectedModel}</Badge>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">🤖</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">Assistant</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Hello! I'm your agent assistant. I'm configured with the following capabilities:
                        </p>
                        {selectedTools.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {selectedTools.slice(0, 3).map((tool) => {
                              const toolInfo = AVAILABLE_TOOLS.find(t => t.value === tool);
                              return (
                                <Badge key={tool} variant="outline" className="text-[10px]">
                                  {toolInfo?.logo} {toolInfo?.label}
                                </Badge>
                              );
                            })}
                            {selectedTools.length > 3 && (
                              <Badge variant="outline" className="text-[10px]">
                                +{selectedTools.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {!prompt && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                        <p className="text-sm text-amber-800">
                          ⚠️ Add instructions in the Configuration tab to define your agent's behavior.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Input Section */}
                  <div className="border-t pt-4">
                    <div className="flex gap-2">
                      <Input
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && chatMessage.trim()) {
                            // Handle send message
                            setChatMessage('');
                          }
                        }}
                        placeholder="Test your agent here..."
                        className="flex-1 bg-background"
                        disabled={!prompt}
                      />
                      <Button
                        size="icon"
                        onClick={() => {
                          if (chatMessage.trim()) {
                            // Handle send message
                            setChatMessage('');
                          }
                        }}
                        disabled={!chatMessage.trim() || !prompt}
                        className="cursor-pointer"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Temperature: {temperature.toFixed(2)} • Max iterations: {maxIterations}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Execution Panel - Below workflow */}
              <div className={`bg-background border-t rounded-lg transition-all mt-4 ${executionPanelOpen ? 'h-64' : 'h-12'}`}>
                <div className="h-full flex flex-col">
                  {/* Panel Header */}
                  <div className="px-4 py-2 border-b flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExecutionPanelOpen(!executionPanelOpen)}
                        className="flex items-center gap-2 h-8 px-2"
                      >
                        {executionPanelOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">Debug Panel</span>
                      </Button>
                      
                      {executionPanelOpen && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant={debugActiveView === 'history' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setDebugActiveView('history')}
                            className="h-7 px-3 text-xs"
                          >
                            <Clock className="h-3 w-3 mr-1.5" />
                            Execution History
                          </Button>
                          <Button
                            variant={debugActiveView === 'console' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setDebugActiveView('console')}
                            className="h-7 px-3 text-xs"
                          >
                            <Terminal className="h-3 w-3 mr-1.5" />
                            Console
                          </Button>
                        </div>
                      )}
                    </div>

                    {executionPanelOpen && debugActiveView === 'console' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Filter:</span>
                        <Button
                          variant={logFilter === 'all' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setLogFilter('all')}
                          className="h-6 px-2 text-xs"
                        >
                          All
                        </Button>
                        <Button
                          variant={logFilter === 'warnings' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setLogFilter('warnings')}
                          className="h-6 px-2 text-xs"
                        >
                          Warnings
                        </Button>
                        <Button
                          variant={logFilter === 'errors' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setLogFilter('errors')}
                          className="h-6 px-2 text-xs"
                        >
                          Errors
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Panel Content */}
                  {executionPanelOpen && (
                    <div className="flex-1 overflow-auto p-4">
                      {debugActiveView === 'history' ? (
                        <div className="space-y-2">
                          {MOCK_EXECUTIONS.map((exec) => (
                            <div
                              key={exec.id}
                              onClick={() => setSelectedExecution(exec.id === selectedExecution ? null : exec.id)}
                              className={`border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                                selectedExecution === exec.id ? 'ring-2 ring-primary bg-primary/5' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {getStatusIcon(exec.status)}
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">Execution #{exec.id}</span>
                                      <Badge 
                                        variant={exec.status === 'success' ? 'default' : exec.status === 'failed' ? 'destructive' : 'secondary'}
                                        className="text-[10px]"
                                      >
                                        {exec.status}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                      {exec.timestamp} • {exec.duration}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${selectedExecution === exec.id ? 'rotate-90' : ''}`} />
                                </div>
                              </div>
                              
                              {selectedExecution === exec.id && (
                                <div className="mt-3 pt-3 border-t space-y-2">
                                  <div className="text-xs font-medium">Execution Timeline:</div>
                                  <div className="space-y-1">
                                    {exec.nodes.map((node, idx) => (
                                      <div key={idx} className="flex items-center gap-2 text-xs">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        <span className="text-muted-foreground">{node}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="font-mono text-xs space-y-1">
                          {filteredLogs.map((log, idx) => (
                            <div key={idx} className="flex items-start gap-3 py-1 hover:bg-muted/50 px-2 rounded">
                              <span className="text-muted-foreground flex-shrink-0">{log.timestamp}</span>
                              <span className={`font-semibold flex-shrink-0 ${getLevelColor(log.level)}`}>
                                {log.level.toUpperCase().padEnd(7)}
                              </span>
                              <span className="flex-1">{log.message}</span>
                              <span className="text-muted-foreground text-[10px] flex-shrink-0">({log.node})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'configuration' && (
            <>
              {/* Left Panel - Configuration */}
              <div className="flex-1 overflow-auto">
            <h1 className="text-foreground mb-6 text-2xl font-semibold">
              Agent configuration
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Triggers Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Triggers</Label>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={activeTriggers.includes('chat') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleTriggerToggle('chat')}
                    className="cursor-pointer"
                  >
                    {activeTriggers.includes('chat') && <Check className="mr-2 h-4 w-4" />}
                    Chat
                  </Button>
                  <Button
                    type="button"
                    variant={activeTriggers.includes('email') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleTriggerToggle('email')}
                    className="cursor-pointer"
                  >
                    {activeTriggers.includes('email') ? <Plus className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                    Email
                  </Button>
                </div>
              </div>

              {/* Instructions Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="prompt" className="text-sm font-medium">Instructions</Label>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  {/* Prompt Strength Score - Inline */}
                  {prompt && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Prompt strength:</span>
                      <div className="flex items-center gap-1.5">
                        <div className="relative flex-shrink-0">
                          <svg className="transform -rotate-90 w-6 h-6">
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              className="text-gray-200"
                            />
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 10 * (feedback.score.correctness + feedback.score.clarity + feedback.score.engagement + feedback.score.delivery) / 400} ${2 * Math.PI * 10}`}
                              className="text-indigo-600 transition-all duration-500"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[8px] font-bold text-gray-900">
                              {Math.round((feedback.score.correctness + feedback.score.clarity + feedback.score.engagement + feedback.score.delivery) / 4)}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-700">
                          {Math.round((feedback.score.correctness + feedback.score.clarity + feedback.score.engagement + feedback.score.delivery) / 4) >= 85
                            ? 'Excellent'
                            : Math.round((feedback.score.correctness + feedback.score.clarity + feedback.score.engagement + feedback.score.delivery) / 4) >= 70
                              ? 'Good'
                              : Math.round((feedback.score.correctness + feedback.score.clarity + feedback.score.engagement + feedback.score.delivery) / 4) >= 50
                                ? 'Fair'
                                : 'Needs work'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-background rounded-lg border p-4">
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="You are a product management agent that is tasked with creating a product brief. The user will prompt you, and you also have access to gather product feedback from the database..."
                    rows={12}
                    className="border-0 p-0 font-mono text-sm resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    required
                  />
                </div>

                {/* Feedback Panel */}
                {prompt && feedback.suggestions.length > 0 && (
                  <PromptFeedbackPanel
                    score={feedback.score}
                    suggestions={feedback.suggestions}
                    onAcceptSuggestion={handleAcceptSuggestion}
                  />
                )}
              </div>

              {/* Available Tools Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Available Tools</Label>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {selectedTools.length} selected
                  </Badge>
                </div>

                <div className="bg-background rounded-lg border">
                  {/* Search and Filter Bar */}
                  <div className="p-3 border-b space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={toolSearchQuery}
                        onChange={(e) => setToolSearchQuery(e.target.value)}
                        placeholder="Search tools..."
                        className="pl-9 h-9"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ArrowUpDown className="h-3 w-3" />
                        <span>Sort:</span>
                      </div>
                      <Button
                        type="button"
                        variant={toolSortBy === 'name' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setToolSortBy('name')}
                      >
                        Name
                      </Button>
                      <Button
                        type="button"
                        variant={toolSortBy === 'author' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setToolSortBy('author')}
                      >
                        Author
                      </Button>
                      <Button
                        type="button"
                        variant={toolSortBy === 'category' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setToolSortBy('category')}
                      >
                        Category
                      </Button>
                      
                      <div className="flex-1" />
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Filter className="h-3 w-3" />
                      </div>
                      <select
                        value={toolFilterCategory}
                        onChange={(e) => setToolFilterCategory(e.target.value)}
                        className="h-6 px-2 text-xs border rounded bg-background"
                      >
                        <option value="all">All categories</option>
                        <option value="search">Search</option>
                        <option value="data">Data</option>
                        <option value="communication">Communication</option>
                        <option value="analysis">Analysis</option>
                        <option value="utility">Utility</option>
                      </select>
                    </div>
                  </div>

                  {/* Tools List */}
                  <div className="max-h-[400px] overflow-y-auto">
                    {filteredAndSortedTools.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground text-sm">
                        No tools found matching your criteria
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredAndSortedTools.map((tool) => (
                          <div
                            key={tool.value}
                            className="p-3 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                id={tool.value}
                                checked={selectedTools.includes(tool.value)}
                                onCheckedChange={() => handleToolToggle(tool.value)}
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xl flex-shrink-0">{tool.logo}</span>
                                  <label
                                    htmlFor={tool.value}
                                    className="cursor-pointer text-sm font-semibold hover:underline"
                                  >
                                    {tool.label}
                                  </label>
                                  {tool.verified && (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                                  )}
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                    {tool.category}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
                                  {tool.description}
                                </p>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <span>By {tool.author}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Advanced Settings Section */}
              <Collapsible open={advancedSettingsOpen} onOpenChange={setAdvancedSettingsOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-between p-0 hover:bg-transparent"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Advanced settings</span>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {advancedSettingsOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-4 space-y-4">
                  {/* Model Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="model" className="text-sm font-medium flex items-center gap-2">
                      Model
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger id="model" className="bg-background">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🤖</span>
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">
                          <div className="flex items-center gap-2">
                            <span>gpt-4o</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Recommended</Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                        <SelectItem value="gpt-4-turbo">gpt-4-turbo</SelectItem>
                        <SelectItem value="claude-3-opus">claude-3-opus</SelectItem>
                        <SelectItem value="claude-3-sonnet">claude-3-sonnet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Temperature */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="temperature" className="text-sm font-medium flex items-center gap-2">
                        Temperature
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </Label>
                      <span className="text-sm font-mono text-muted-foreground">{temperature.toFixed(2)}</span>
                    </div>
                    <Slider
                      id="temperature"
                      value={[temperature]}
                      onValueChange={(value) => setTemperature(value[0])}
                      min={0}
                      max={2}
                      step={0.01}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      Controls randomness: Lower is more focused, higher is more creative
                    </p>
                  </div>

                  {/* Max Iterations */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="maxIterations" className="text-sm font-medium flex items-center gap-2">
                        Max Iterations
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </Label>
                      <span className="text-sm font-mono text-muted-foreground">{maxIterations}</span>
                    </div>
                    <Slider
                      id="maxIterations"
                      value={[maxIterations]}
                      onValueChange={(value) => setMaxIterations(value[0])}
                      min={1}
                      max={50}
                      step={1}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum number of reasoning steps the agent can take
                    </p>
                  </div>

                  {/* Documentation Link */}
                  <div className="pt-2">
                    <a
                      href="https://docs.subconscious.dev/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <span>Learn more about advanced settings</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Metadata Section */}
              <div className="text-muted-foreground text-sm">
                This information is purely to make your agent discoverable.
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Research Assistant"
                  className="bg-background"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of what this agent does so a human can understand why they would use it."
                  rows={3}
                  className="bg-background"
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1 cursor-pointer"
                >
                  {searchParams.get('fork') ? 'Deploy Fork' : 'Deploy Agent'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1 cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>

          {/* Right Panel - Configuration Assistant */}
          <div className="w-[400px] flex flex-col border-l pl-6 sticky top-0 h-screen">
            <div className="flex items-center justify-between mb-4 pt-6">
              <h2 className="text-lg font-semibold">Configuration Assistant</h2>
              <Button variant="ghost" size="icon">
                <span className="sr-only">Close</span>
                ✕
              </Button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-auto mb-4 space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">🤖</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">Configuration Assistant</span>
                    <span className="text-xs text-muted-foreground">10:44 AM</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Hi! I can help you configure this agent with specific capabilities and access to various tools. What type of agent are you trying to build?
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Input - Sticky at bottom */}
            <div className="border-t pt-4 pb-6 bg-background">
              <div className="flex gap-2">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Message Configuration Assistant"
                  className="flex-1 bg-background"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      // Handle send message
                      setChatMessage('');
                    }
                  }}
                />
                <Button 
                  size="icon"
                  className="cursor-pointer"
                  onClick={() => {
                    // Handle send message
                    setChatMessage('');
                  }}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {selectedModel}
              </div>
            </div>
          </div>
            </>
          )}

          {activeTab === 'guardrails' && (
            <div className="flex-1 flex items-center justify-center bg-background rounded-lg border">
              <div className="text-center text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Guardrails configuration coming soon</p>
              </div>
            </div>
          )}

          {activeTab === 'datasets' && (
            <div className="flex-1 flex items-center justify-center bg-background rounded-lg border">
              <div className="text-center text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Datasets view coming soon</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}