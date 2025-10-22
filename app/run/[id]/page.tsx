'use client';

import type React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import type { Agent } from '@/lib/types';
import { AVAILABLE_TOOLS } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import { parse } from 'partial-json';
import { cn } from '@/lib/utils';
import { 
  LoaderCircle, GitBranch, Share, Twitter, Facebook, Linkedin, Copy, 
  Heart, UserPlus, Download, MessageSquare, Cpu, Zap, Shield, 
  BarChart3, Clock, Users, Star, ExternalLink, Code2, Play, Wrench
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function RunAgentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [embedCode, setEmbedCode] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('run');
  const reasoningRef = useRef<HTMLPreElement>(null);

  const getToolLabel = (toolValue: string) => {
    const tool = AVAILABLE_TOOLS.find((t) => t.value === toolValue);
    return tool?.label || toolValue;
  };

  useEffect(() => {
    async function fetchAgent() {
      const id = params.id as string;

      try {
        const response = await fetch(`/api/agents/${id}`);

        if (!response.ok) {
          router.push('/');
          return;
        }

        const data = await response.json();
        setAgent(data);
      } catch (error) {
        console.error('Error fetching agent:', error);
        router.push('/');
      }
    }

    fetchAgent();
  }, [params.id, router]);

  // Scroll to bottom when result updates
  useEffect(() => {
    if (reasoningRef.current) {
      reasoningRef.current.scrollTop = reasoningRef.current.scrollHeight;
    }
  }, [result]);

  // Build embed code on client when agent is available
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    setEmbedCode(`<iframe src="${url}" style="border:0;width:350px;height:600px;border-radius:12px;overflow:hidden;" />`);
  }, [agent]);

  const handleRun = async () => {
    if (isRunning || !agent) return;

    setIsRunning(true);
    setResult('');

    try {
      const response = await fetch(`/api/agents/${agent.id}/run`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start agent');
      }

      // Get the readable stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      // Read the stream
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode the chunk and accumulate it
        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;
        console.log('Accumulated text', accumulatedText);
        setResult(parse(accumulatedText));
      }

      setIsRunning(false);
    } catch (error) {
      console.error('Error running agent:', error);
      setResult('Error: Failed to run agent. Please try again.');
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setResult('');
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast({ 
        title: "Link copied!", 
        description: "Agent link has been copied to clipboard" 
      });
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast({ 
      title: isLiked ? "Unliked" : "Liked!", 
      description: isLiked ? "Removed from favorites" : "Added to your favorites" 
    });
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast({ 
      title: isFollowing ? "Unfollowed" : "Following!", 
      description: isFollowing ? "Unfollowed author" : "You're now following the author" 
    });
  };

  if (!agent) {
    return null;
  }

  // Mock data - replace with actual data from your API
  const authorData = {
    name: "John Doe",
    username: "@johndoe",
    followers: 1234,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john"
  };

  const agentStats = {
    runs: 5432,
    likes: 234,
    forks: 45,
    avgResponseTime: "2.3s",
    successRate: "98.5%",
    lastUpdated: "2 days ago"
  };

  return (
    <div className="bg-background min-h-screen overflow-x-hidden">
      <Header />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl overflow-x-hidden">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 overflow-x-hidden">
          <div className="space-y-6 overflow-x-hidden order-1 lg:order-2">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <img
                    src={authorData.avatar}
                    alt={authorData.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-medium">{authorData.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {authorData.followers.toLocaleString()} followers
                    </p>
                  </div>
                </div>
                <Button
                  variant={isFollowing ? "secondary" : "default"}
                  size="sm"
                  onClick={handleFollow}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {agent.tools.map((tool) => (
                  <Badge key={tool} variant="secondary" className="text-xs">
                    {getToolLabel(tool)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Stats Card */}
            <Card className="overflow-x-hidden bg-gradient-to-b from-background to-muted/20 border-muted">
              <CardContent className="p-4 space-y-4">
                {/* Performance Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Performance</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-2 h-2 rounded-full",
                            i <= 3 ? "bg-purple-500" : "bg-muted-foreground/20"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-bold">{agentStats.successRate}</span>
                  </div>
                </div>

                {/* Speed Section */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Speed</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4].map((i) => (
                        <Zap
                          key={i}
                          className={cn(
                            "w-4 h-4",
                            i <= 3 ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/20"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-bold">{agentStats.avgResponseTime}</span>
                  </div>
                </div>

                {/* Usage Section */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Usage</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold">{(agentStats.runs / 1000).toFixed(1)}k</p>
                      <p className="text-xs text-muted-foreground">Total runs</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{agentStats.forks}</p>
                      <p className="text-xs text-muted-foreground">Forks</p>
                    </div>
                  </div>
                </div>

                {/* Activity Section */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Activity</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Updated</span>
                    </div>
                    <span className="text-sm font-medium">{agentStats.lastUpdated}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
                    </div>
                    <span className="text-xs text-muted-foreground">Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tools */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {agent.tools.map((tool) => (
                  <div key={tool} className="flex items-center gap-2 p-2 border rounded-md bg-background">
                    <Zap className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{getToolLabel(tool)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Chat Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Community Chat
                  <Badge variant="secondary" className="text-xs ml-auto">12 online</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground text-center py-8 border rounded-md">
                    Chat feature coming soon
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inference Providers */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Inference Providers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">SubNet Cloud</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded-md opacity-50">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">Self-hosted</span>
                  </div>
                  <Badge variant="outline" className="text-xs">Soon</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 overflow-x-hidden order-2 lg:order-1">
            {/* Title & Description above CTAs */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">{agent.title}</h1>
              <p className="text-muted-foreground">{agent.description}</p>
            </div>
            {/* CTA row (no title or box) */}
            <TooltipProvider>
              <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
                {/* Labeled CTAs */}
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShareModalOpen(true)}
                >
                  <Share className="h-4 w-4 mr-1" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/create?fork=${agent.id}`)}
                >
                  <GitBranch className="h-4 w-4 mr-1" />
                  Fork
                </Button>

                {/* Icon-only CTAs with tooltips aligned right */}
                <div className="ml-auto flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Copy link"
                        onClick={handleCopyLink}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy link</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isLiked ? "destructive" : "ghost"}
                        size="icon"
                        aria-label={isLiked ? "Unlike" : "Like"}
                        onClick={handleLike}
                      >
                        <Heart className={cn("h-4 w-4", isLiked && "fill-current") } />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isLiked ? "Unlike" : "Like"}</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Export JSON"
                        onClick={() => {
                          const agentJson = JSON.stringify(agent, null, 2);
                          const blob = new Blob([agentJson], { type: "application/json" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${agent?.title?.replace(/\s+/g, "-").toLowerCase() || "agent"}.json`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          toast({ title: "Downloaded!", description: "Agent exported as JSON" });
                        }}
                      >
                        <Code2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Export as JSON</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Copy API endpoint"
                        onClick={() => {
                          const apiEndpoint = `${window.location.origin}/api/agents/${agent?.id}`;
                          navigator.clipboard.writeText(apiEndpoint);
                          toast({ title: "Copied!", description: "API endpoint copied to clipboard" });
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy API endpoint</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </TooltipProvider>

            <Card className="overflow-x-hidden">
              <CardHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="run">
                      <Play className="h-4 w-4 mr-2" />
                      Run
                    </TabsTrigger>
                    <TabsTrigger value="instructions">
                      <Code2 className="h-4 w-4 mr-2" />
                      Instructions
                    </TabsTrigger>
                    <TabsTrigger value="versions">
                      <Clock className="h-4 w-4 mr-2" />
                      Versions
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="run" className="mt-6 overflow-x-hidden">
                    <div className="space-y-4">
                      {/* Control Buttons */}
                      <div className="flex gap-2">
                        <Button
                          onClick={handleRun}
                          disabled={isRunning}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          {isRunning ? (
                            <>
                              <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                              Running...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Run Agent
                            </>
                          )}
                        </Button>
                        {result && (
                          <Button variant="outline" onClick={handleReset} disabled={isRunning}>
                            Reset
                          </Button>
                        )}
                      </div>

                      {/* Answer Display Textbox */}
                      {result?.answer && (
                        <div className="border rounded-lg p-4 bg-muted/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <h3 className="text-sm font-semibold">Answer</h3>
                          </div>
                          <div className="bg-background rounded-lg p-4 border overflow-x-auto max-w-full">
                            {typeof result.answer === 'string' ? (
                              <div className="prose prose-sm max-w-none dark:prose-invert break-words">
                                <ReactMarkdown>{result.answer}</ReactMarkdown>
                              </div>
                            ) : (
                              <pre className="text-sm whitespace-pre-wrap break-words overflow-x-auto">
                                {JSON.stringify(result.answer, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Video Demo Section */}
                      {!isRunning && !result && (
                        <div className="w-full bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden">
                          <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 Aspect Ratio */ }}>
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-blue-900/20">
                              {/* Video placeholder - replace with actual video element */}
                              <video
                                className="w-full h-full object-cover"
                                poster="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1920&h=1080&fit=crop"
                                controls
                                muted
                                loop
                              >
                                <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                              
                              {/* Overlay UI elements to simulate the Retool interface */}
                              <div className="absolute inset-0 pointer-events-none">
                                {/* Timeline visualization */}
                                <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs text-white/80">Agent Active</span>
                                  </div>
                                  <div className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                                        <Cpu className="w-4 h-4 text-white" />
                                      </div>
                                      <span className="text-xs text-white/60 mt-1">Init</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                        <Zap className="w-4 h-4 text-white" />
                                      </div>
                                      <span className="text-xs text-white/60 mt-1">Process</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                        <Shield className="w-4 h-4 text-white" />
                                      </div>
                                      <span className="text-xs text-white/60 mt-1">Complete</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Sample output preview */}
                                <div className="absolute bottom-4 left-4 bg-white/10 backdrop-blur-sm rounded-lg p-3 max-w-md">
                                  <p className="text-xs text-white/60 mb-1">Sample Output:</p>
                                  <p className="text-sm text-white">"I've analyzed your request and prepared the report..."</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="p-3 bg-background border-t">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  Demo Mode
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Watch how this agent processes requests in real-time
                                </span>
                              </div>
                              <Button variant="ghost" size="sm" className="text-xs">
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Fullscreen
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Live Execution Results */}
                      {result && (
                        <div className="space-y-4">
                          <div className="border rounded-lg p-4 bg-background">
                            <div className="flex items-center gap-2 mb-3">
                              <h3 className={cn(
                                'text-sm font-semibold',
                                isRunning && 'animate-pulse text-gray-400',
                              )}>
                                Live Execution Log
                              </h3>
                              {isRunning && (
                                <LoaderCircle className="h-4 w-4 animate-spin text-gray-400" />
                              )}
                            </div>
                            
                            {/* Execution timeline */}
                            <div className="space-y-3 mb-4">
                              <div className="flex items-start gap-3">
                                <div className="mt-1">
                                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                    <Play className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">Agent Started</p>
                                  <p className="text-xs text-muted-foreground">Initializing with provided context...</p>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-3">
                                <div className="mt-1">
                                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                    <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">Processing Request</p>
                                  <div className="mt-1 bg-muted/50 rounded p-2 overflow-x-auto max-w-full">
                                    <pre className="text-xs whitespace-pre-wrap break-words">
                                      <code>{JSON.stringify(result?.reasoning || {}, null, 2)}</code>
                                    </pre>
                                  </div>
                                </div>
                              </div>
                              
                              {result?.answer && (
                                <div className="flex items-start gap-3">
                                  <div className="mt-1">
                                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                      <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">Completed Successfully</p>
                                    <div className="mt-1 bg-muted/50 rounded p-3 overflow-x-auto max-w-full">
                                      {typeof result?.answer === 'string' ? (
                                        <div className="text-sm break-words">
                                          <ReactMarkdown>{result.answer}</ReactMarkdown>
                                        </div>
                                      ) : (
                                        <pre className="text-sm whitespace-pre-wrap break-words overflow-x-auto">
                                          {JSON.stringify(result?.answer, null, 2)}
                                        </pre>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="instructions" className="mt-6 overflow-x-hidden">
                    <div className="prose prose-sm text-foreground bg-muted/50 max-h-96 max-w-none overflow-y-auto rounded-md border p-4 text-sm overflow-x-hidden">
                      <ReactMarkdown>{agent.prompt}</ReactMarkdown>
                    </div>
                  </TabsContent>

                  <TabsContent value="versions" className="mt-6 overflow-x-hidden">
                    <div className="space-y-3">
                      <div className="border rounded-md p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">v1.0.0</p>
                            <p className="text-xs text-muted-foreground">Current version - 2 days ago</p>
                          </div>
                          <Badge variant="secondary">Latest</Badge>
                        </div>
                      </div>
                      <div className="border rounded-md p-4 opacity-60">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">v0.9.0</p>
                            <p className="text-xs text-muted-foreground">1 week ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>

      {/* Share Dialog */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Share your agent</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="link" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link">Share Link</TabsTrigger>
              <TabsTrigger value="embed">Embed</TabsTrigger>
            </TabsList>

            <TabsContent value="link" className="space-y-4 mt-4 overflow-x-hidden">
              {/* Preview Card */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="bg-gradient-to-br from-sky-400 via-rose-400 to-amber-400 rounded-xl p-6 mb-4 relative cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={handleCopyLink}
                    >
                      <div className="absolute top-4 right-4 h-8 w-8 bg-white/20 rounded-md flex items-center justify-center pointer-events-none">
                        <Copy className="h-4 w-4 text-white" />
                      </div>
                      
                      <div className="h-[300px] rounded-md bg-white/10 p-6 flex flex-col justify-between">
                        <div>
                          <h3 className="text-white text-2xl font-bold mb-2">{agent.title}</h3>
                          <p className="text-white/80 text-sm">{agent.description}</p>
                        </div>
                        <div className="w-fit px-4 py-2 bg-white/90 hover:bg-white rounded-md text-sm font-medium pointer-events-none">
                          Run on SubNet
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click to copy link</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div>
                <label className="block text-sm font-medium mb-2">Share on social</label>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" asChild>
                    <a 
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out this AI agent: ' + agent.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} 
                      target="_blank" 
                      rel="noreferrer"
                    >
                      <Twitter className="w-4 h-4 mr-2" />
                      Twitter
                    </a>
                  </Button>
                  <Button variant="outline" className="flex-1" asChild>
                    <a 
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} 
                      target="_blank" 
                      rel="noreferrer"
                    >
                      <Facebook className="w-4 h-4 mr-2" />
                      Facebook
                    </a>
                  </Button>
                  <Button variant="outline" className="flex-1" asChild>
                    <a 
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} 
                      target="_blank" 
                      rel="noreferrer"
                    >
                      <Linkedin className="w-4 h-4 mr-2" />
                      LinkedIn
                    </a>
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="embed" className="space-y-4 mt-4 overflow-x-hidden">
              <div>
                <label className="block text-sm font-medium mb-2">Embed code</label>
                <textarea
                  readOnly
                  value={embedCode}
                  className="w-full h-32 p-3 border rounded-md bg-muted text-xs font-mono resize-none overflow-x-auto"
                />
                <Button
                  onClick={() => { 
                    navigator.clipboard.writeText(embedCode); 
                    toast({ title: "Copied!", description: "Embed code copied to clipboard" }); 
                  }}
                  className="mt-2 w-full"
                >
                  Copy Embed Code
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}