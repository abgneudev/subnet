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
import { Info, Check, Plus, Send, Search, ArrowUpDown, Filter, CheckCircle2, ChevronDown, ChevronUp, ExternalLink, HelpCircle } from 'lucide-react';
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

export default function CreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  return (
    <div className="bg-muted/30 min-h-screen">
      <Header showTabs={true} activeTab="configuration" />
      <main className="container mx-auto px-6 py-6">
        <div className="flex gap-6 h-[calc(100vh-180px)]">
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
                      href="https://docs.subnet.ai/advanced-settings"
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
                  {searchParams.get('fork') ? 'Fork Agent' : 'Create Agent'}
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
          <div className="w-[400px] flex flex-col border-l pl-6">
            <div className="flex items-center justify-between mb-4">
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

            {/* Chat Input */}
            <div className="border-t pt-4">
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
                gpt-4.1
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
