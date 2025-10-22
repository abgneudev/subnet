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
  BarChart3, Clock, Users, Star, ExternalLink, Code2, Play, Wrench,
  Book, FileText, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown,
  AlertCircle, CheckCircle, Terminal, Hash, Globe, Activity,
  BookOpen, Github, Send, MoreVertical, Flag, Network, Braces
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RunAgentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [embedCode, setEmbedCode] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [viewMode, setViewMode] = useState<'json' | 'flowchart'>('flowchart');
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

  useEffect(() => {
    if (reasoningRef.current) {
      reasoningRef.current.scrollTop = reasoningRef.current.scrollHeight;
    }
  }, [result]);

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

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;
        setResult(parse(accumulatedText));
      }

      setIsRunning(false);
    } catch (error) {
      console.error('Error running agent:', error);
      setResult('Error: Failed to run agent. Please try again.');
      setIsRunning(false);
    }
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

  const handleCommentSubmit = () => {
    if (!commentText.trim()) return;
    toast({ 
      title: "Comment posted!", 
      description: "Your comment has been added to the discussion" 
    });
    setCommentText('');
  };

  const renderFlowchart = (data: any) => {
    if (!data || typeof data !== 'object') return null;

    const renderNode = (key: string, value: any, level: number = 0) => {
      const isExpandable = typeof value === 'object' && value !== null;
      const isArray = Array.isArray(value);
      
      return (
        <div key={key} className={cn("relative", level > 0 && "ml-8 mt-2")}>
          {/* Connection line */}
          {level > 0 && (
            <div className="absolute left-[-24px] top-[20px] w-6 h-[2px] bg-border" />
          )}
          
          {/* Node */}
          <div className="relative">
            {level > 0 && (
              <div className="absolute left-[-24px] top-0 bottom-0 w-[2px] bg-border" />
            )}
            
            <div className={cn(
              "inline-flex items-start gap-2 p-3 rounded-lg border bg-card",
              isExpandable && "bg-muted/30"
            )}>
              <div className="flex items-center gap-2 min-w-0">
                {isExpandable ? (
                  <Network className="h-4 w-4 text-blue-500 flex-shrink-0" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0 mt-1" />
                )}
                
                <div className="min-w-0">
                  <span className="font-medium text-sm text-foreground break-words">
                    {key}
                  </span>
                  {!isExpandable && (
                    <span className="text-sm text-muted-foreground ml-2 break-words">
                      {String(value)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Children */}
            {isExpandable && (
              <div className="mt-2 space-y-2">
                {isArray ? (
                  value.map((item: any, index: number) => 
                    renderNode(`[${index}]`, item, level + 1)
                  )
                ) : (
                  Object.entries(value).map(([k, v]) => 
                    renderNode(k, v, level + 1)
                  )
                )}
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-3">
        {Object.entries(data).map(([key, value]) => renderNode(key, value))}
      </div>
    );
  };

  if (!agent) {
    return null;
  }

  // Mock data - replace with actual data from your API
  const authorData = {
    name: "John Doe",
    username: "@johndoe",
    followers: 1234,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
    verified: true,
    organization: "Subconscious AI"
  };

  const agentStats = {
    runs: 5432,
    likes: 234,
    forks: 45,
    avgResponseTime: "2.3s",
    successRate: "98.5%",
    lastUpdated: "2 days ago",
    downloads: 892,
    rating: 4.7,
    reviews: 156
  };

  const mockComments = [
    {
      id: 1,
      author: "Alice Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
      content: "This agent works perfectly for analyzing news sentiment! Great job on the prompt engineering.",
      timestamp: "3 hours ago",
      likes: 12,
      replies: 2
    },
    {
      id: 2,
      author: "Bob Smith",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
      content: "I forked this and added support for Reddit posts. The base structure is really well designed.",
      timestamp: "1 day ago",
      likes: 8,
      replies: 1
    }
  ];

  return (
    <div className="bg-background min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold">{agent.title}</h1>
                <Badge variant="secondary" className="h-6">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={authorData.avatar} />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium hover:underline cursor-pointer">
                        {authorData.name}
                      </span>
                      {authorData.verified && (
                        <CheckCircle className="w-3 h-3 text-blue-500" />
                      )}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-16 p-0 ml-1 hover:bg-transparent"
                              onClick={handleFollow}
                            >
                              <UserPlus className={cn("h-3 w-3", isFollowing && "fill-current")} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isFollowing ? "Unfollow" : "Follow"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-xs text-muted-foreground">{authorData.organization}</p>
                  </div>
                </div>
                
                <Separator orientation="vertical" className="h-6" />
                
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    <span>{agentStats.runs.toLocaleString()} runs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span>{agentStats.rating}</span>
                    <span>({agentStats.reviews})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Updated {agentStats.lastUpdated}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-4">{agent.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {agent.tools.map((tool) => (
                  <Badge key={tool} variant="outline">
                    {getToolLabel(tool)}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleRun}
                disabled={isRunning}
                size="lg"
                className="min-w-[200px]"
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
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/create?fork=${agent.id}`)}
                  className="flex-1"
                >
                  <GitBranch className="h-4 w-4 mr-2" />
                  Fork
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShareModalOpen(true)}
                  className="flex-1"
                >
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isLiked ? "destructive" : "outline"}
                        size="icon"
                        onClick={handleLike}
                      >
                        <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isLiked ? "Unlike" : "Like"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="playground">Playground</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
            <TabsTrigger value="discussions">
              Discussions
              <Badge variant="secondary" className="ml-1 h-5 px-1">
                {mockComments.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Video Demo Component */}
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative w-full bg-gradient-to-br from-purple-900/20 to-blue-900/20">
                      <div className="aspect-video">
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
                        
                        {/* Overlay badges */}
                        <div className="absolute top-4 left-4 flex gap-2">
                          <Badge className="bg-black/50 backdrop-blur-sm text-white border-white/20">
                            <Play className="w-3 h-3 mr-1" />
                            Demo
                          </Badge>
                          <Badge className="bg-black/50 backdrop-blur-sm text-white border-white/20">
                            2:34
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4 bg-background/95 backdrop-blur-sm border-t">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-sm mb-1">See it in action</h3>
                            <p className="text-xs text-muted-foreground">
                              Watch how this agent analyzes news from multiple sources in real-time
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Full Demo
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Model Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Model Card
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Book className="h-4 w-4 mr-2" />
                          Read Full Documentation
                        </Button>
                        <Button variant="outline" size="sm">
                          <Github className="h-4 w-4 mr-2" />
                          View on GitHub
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <div className={cn(
                        "prose prose-sm dark:prose-invert max-w-none",
                        !showFullDescription && "line-clamp-4"
                      )}>
                        <p>
                          {agent.description}
                        </p>
                        <p>
                          This agent leverages advanced natural language processing to analyze news from Twitter and Hacker News, 
                          providing real-time insights and sentiment analysis. It's designed to help users stay informed about 
                          trending topics and understand public sentiment across different platforms.
                        </p>
                        <h4>Key Features:</h4>
                        <ul>
                          <li>Real-time news aggregation from multiple sources</li>
                          <li>Sentiment analysis and trend detection</li>
                          <li>Customizable filtering based on topics</li>
                          <li>Multi-language support</li>
                        </ul>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="mt-2"
                      >
                        {showFullDescription ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Show more
                          </>
                        )}
                      </Button>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-semibold mb-2">How to Use</h3>
                      <ol className="space-y-2 text-sm">
                        <li className="flex gap-2">
                          <span className="font-semibold">1.</span>
                          <span>Click "Run Agent" to start the analysis</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="font-semibold">2.</span>
                          <span>The agent will fetch the latest news from configured sources</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="font-semibold">3.</span>
                          <span>Results will include sentiment analysis and key insights</span>
                        </li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Metadata */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Performance</span>
                      <Badge variant="secondary">{agentStats.successRate}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Avg Response</span>
                      <span className="text-sm font-medium">{agentStats.avgResponseTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Runs</span>
                      <span className="text-sm font-medium">{agentStats.runs.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Downloads</span>
                      <span className="text-sm font-medium">{agentStats.downloads}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Likes</span>
                      <span className="text-sm font-medium">{agentStats.likes}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Forks</span>
                      <span className="text-sm font-medium">{agentStats.forks}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Technical Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Technical Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">FRAMEWORK</span>
                      <Badge variant="outline">Subconscious API v2</Badge>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">LANGUAGE</span>
                      <Badge variant="outline">English</Badge>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">LICENSE</span>
                      <Badge variant="outline">MIT</Badge>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">TAGS</span>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary">#news</Badge>
                        <Badge variant="secondary">#sentiment</Badge>
                        <Badge variant="secondary">#ai</Badge>
                        <Badge variant="secondary">#analysis</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Author Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">About the Author</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={authorData.avatar} />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-sm">{authorData.name}</span>
                          {authorData.verified && (
                            <CheckCircle className="w-3 h-3 text-blue-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{authorData.organization}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Building AI agents to democratize access to information. 
                      Focused on news analysis and sentiment detection.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Globe className="h-3 w-3 mr-1" />
                        Website
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Github className="h-3 w-3 mr-1" />
                        GitHub
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Related Agents */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Related Agents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 cursor-pointer">
                        <span className="text-sm">Market Analysis Bot</span>
                        <ChevronDown className="h-3 w-3 -rotate-90" />
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 cursor-pointer">
                        <span className="text-sm">Social Media Monitor</span>
                        <ChevronDown className="h-3 w-3 -rotate-90" />
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 cursor-pointer">
                        <span className="text-sm">Content Summarizer</span>
                        <ChevronDown className="h-3 w-3 -rotate-90" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="playground" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Test the Agent</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result && (
                      <div className="space-y-4">
                        {/* Answer Section */}
                        {result?.answer && (
                          <div className="border rounded-lg p-4 bg-muted/30">
                            <div className="flex items-center gap-2 mb-3">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <h3 className="text-sm font-semibold">Answer</h3>
                            </div>
                            <div className="bg-background rounded-lg p-4 border">
                              <div className="prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown>{result.answer}</ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Reasoning Section */}
                        {result?.reasoning && (
                          <div className="border rounded-lg p-4 bg-muted/30">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Terminal className="h-4 w-4" />
                                <h3 className="text-sm font-semibold">Reasoning</h3>
                              </div>
                              <div className="flex gap-1 border rounded-md p-1">
                                <Button
                                  variant={viewMode === 'flowchart' ? 'secondary' : 'ghost'}
                                  size="sm"
                                  onClick={() => setViewMode('flowchart')}
                                  className="h-7 px-2"
                                >
                                  <Network className="h-3 w-3 mr-1" />
                                  Flowchart
                                </Button>
                                <Button
                                  variant={viewMode === 'json' ? 'secondary' : 'ghost'}
                                  size="sm"
                                  onClick={() => setViewMode('json')}
                                  className="h-7 px-2"
                                >
                                  <Braces className="h-3 w-3 mr-1" />
                                  JSON
                                </Button>
                              </div>
                            </div>
                            <div className="bg-background rounded-lg p-4 border overflow-x-auto">
                              {viewMode === 'flowchart' ? (
                                renderFlowchart(result.reasoning)
                              ) : (
                                <pre className="text-sm whitespace-pre-wrap">
                                  {typeof result.reasoning === 'string' 
                                    ? result.reasoning 
                                    : JSON.stringify(result.reasoning, null, 2)}
                                </pre>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Fallback for string or other formats */}
                        {!result?.answer && !result?.reasoning && (
                          <div className="border rounded-lg p-4 bg-muted/30">
                            <div className="flex items-center gap-2 mb-3">
                              <Terminal className="h-4 w-4" />
                              <h3 className="text-sm font-semibold">Output</h3>
                            </div>
                            <div className="bg-background rounded-lg p-4 border">
                              {typeof result === 'string' ? (
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                  <ReactMarkdown>{result}</ReactMarkdown>
                                </div>
                              ) : (
                                <pre className="text-sm whitespace-pre-wrap">
                                  {JSON.stringify(result, null, 2)}
                                </pre>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Run controls and output would go here */}
                    <div className="flex gap-2">
                      <Button
                        onClick={handleRun}
                        disabled={isRunning}
                        className="bg-primary hover:bg-primary/90"
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
                        <Button variant="outline" onClick={() => setResult(null)} disabled={isRunning}>
                          Reset
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar - Instructions */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Instructions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm mb-2">System Prompt</h4>
                        <div className="bg-muted/50 rounded-md p-3 text-xs">
                          <p className="whitespace-pre-wrap">
                            {agent.prompt || "You are a news analysis AI agent. Your task is to analyze news from multiple sources including Twitter and Hacker News. Provide real-time insights and sentiment analysis."}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold text-sm mb-2">Capabilities</h4>
                        <div className="space-y-2">
                          {agent.tools.map((tool) => (
                            <div key={tool} className="flex items-center gap-2 text-xs">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span>{getToolLabel(tool)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold text-sm mb-2">Usage Guidelines</h4>
                        <ul className="text-xs space-y-1 text-muted-foreground">
                          <li>• Click "Run Agent" to start analysis</li>
                          <li>• Results will appear in the output section</li>
                          <li>• Use "Reset" to clear previous results</li>
                          <li>• Agent processes data from configured sources</li>
                        </ul>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold text-sm mb-2">Expected Output</h4>
                        <div className="bg-muted/50 rounded-md p-3 text-xs">
                          <p>The agent will return:</p>
                          <ul className="mt-1 space-y-1">
                            <li>• News analysis summary</li>
                            <li>• Sentiment breakdown</li>
                            <li>• Key trends and topics</li>
                            <li>• Source attribution</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documentation" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>API Documentation</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Full API Docs
                    </Button>
                    <Button variant="outline" size="sm">
                      <Code2 className="h-4 w-4 mr-2" />
                      SDK Examples
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Endpoint</h3>
                    <code className="block p-3 bg-muted rounded-md text-sm">
                      POST /api/agents/{agent.id}/run
                    </code>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Request Body</h3>
                    <pre className="p-3 bg-muted rounded-md text-sm overflow-x-auto">
{JSON.stringify({
  "parameters": {
    "max_results": 10,
    "sources": ["twitter", "hackernews"],
    "language": "en"
  }
}, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Response</h3>
                    <pre className="p-3 bg-muted rounded-md text-sm overflow-x-auto">
{JSON.stringify({
  "answer": "Top AI news analysis...",
  "reasoning": {
    "sources_analyzed": 25,
    "sentiment": "positive",
    "key_topics": ["LLMs", "robotics", "ethics"]
  }
}, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discussions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Tabs for Reviews and Discussions */}
                <Card>
                  <CardHeader>
                    <Tabs defaultValue="reviews" className="w-full">
                      <div className="flex items-center justify-between mb-4">
                        <TabsList>
                          <TabsTrigger value="reviews">
                            Reviews
                            <Badge variant="secondary" className="ml-1 h-5 px-1">
                              {agentStats.reviews}
                            </Badge>
                          </TabsTrigger>
                          <TabsTrigger value="discussions">
                            Discussions
                            <Badge variant="secondary" className="ml-1 h-5 px-1">
                              42
                            </Badge>
                          </TabsTrigger>
                        </TabsList>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-semibold">{agentStats.rating}</span>
                            <span className="text-sm text-muted-foreground">
                              ({agentStats.reviews} reviews)
                            </span>
                          </div>
                        </div>
                      </div>

                      <TabsContent value="reviews" className="space-y-4 mt-0">
                        {/* Write Review Section */}
                        <div className="border rounded-lg p-4 bg-muted/20">
                          <h4 className="font-semibold mb-3">Write a Review</h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Your Rating:</span>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={cn(
                                      "h-5 w-5 cursor-pointer transition-colors",
                                      star <= userRating 
                                        ? "text-yellow-500 fill-yellow-500" 
                                        : "text-muted-foreground hover:text-yellow-500"
                                    )}
                                    onClick={() => setUserRating(star)}
                                  />
                                ))}
                              </div>
                              {userRating > 0 && (
                                <span className="text-sm text-muted-foreground ml-2">
                                  {userRating === 5 ? "Excellent!" : 
                                   userRating === 4 ? "Good" : 
                                   userRating === 3 ? "Average" :
                                   userRating === 2 ? "Poor" : "Very Poor"}
                                </span>
                              )}
                            </div>
                            <Textarea
                              placeholder="Share your experience with this agent..."
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              className="min-h-[100px]"
                            />
                            <div className="flex justify-end">
                              <Button 
                                onClick={handleCommentSubmit} 
                                disabled={!commentText.trim() || userRating === 0}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Post Review
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Sort and Filter */}
                        <div className="flex gap-2">
                          <Select defaultValue="helpful">
                            <SelectTrigger className="w-[160px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="helpful">Most Helpful</SelectItem>
                              <SelectItem value="recent">Most Recent</SelectItem>
                              <SelectItem value="highest">Highest Rated</SelectItem>
                              <SelectItem value="lowest">Lowest Rated</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select defaultValue="all">
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Stars</SelectItem>
                              <SelectItem value="5">5 Stars</SelectItem>
                              <SelectItem value="4">4 Stars</SelectItem>
                              <SelectItem value="3">3 Stars</SelectItem>
                              <SelectItem value="2">2 Stars</SelectItem>
                              <SelectItem value="1">1 Star</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Reviews List */}
                        <div className="space-y-4">
                          {[
                            {
                              id: 1,
                              author: "Alice Chen",
                              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
                              rating: 5,
                              content: "This agent works perfectly for analyzing news sentiment! Great job on the prompt engineering. I've been using it daily for market research.",
                              timestamp: "3 hours ago",
                              likes: 12,
                              helpful: 8,
                              verified: true
                            },
                            {
                              id: 2,
                              author: "Bob Smith",
                              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
                              rating: 4,
                              content: "I forked this and added support for Reddit posts. The base structure is really well designed. Would love to see more customization options.",
                              timestamp: "1 day ago",
                              likes: 8,
                              helpful: 6,
                              verified: false
                            },
                            {
                              id: 3,
                              author: "Charlie Davis",
                              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=charlie",
                              rating: 5,
                              content: "Exceptional performance! Processes news from multiple sources incredibly fast. The sentiment analysis is spot on.",
                              timestamp: "2 days ago",
                              likes: 15,
                              helpful: 12,
                              verified: true
                            }
                          ].map((review) => (
                            <div key={review.id} className="border rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={review.avatar} />
                                  <AvatarFallback>{review.author[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-sm">{review.author}</span>
                                      {review.verified && (
                                        <Badge variant="secondary" className="text-xs h-5">
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Verified User
                                        </Badge>
                                      )}
                                      <span className="text-xs text-muted-foreground">{review.timestamp}</span>
                                    </div>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="flex mb-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={cn(
                                          "h-4 w-4",
                                          star <= review.rating 
                                            ? "text-yellow-500 fill-yellow-500" 
                                            : "text-muted-foreground"
                                        )}
                                      />
                                    ))}
                                  </div>
                                  <p className="text-sm mb-3">{review.content}</p>
                                  <div className="flex items-center gap-4">
                                    <Button variant="ghost" size="sm">
                                      <ThumbsUp className="h-3 w-3 mr-1" />
                                      Helpful ({review.helpful})
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      <ThumbsDown className="h-3 w-3 mr-1" />
                                      Not Helpful
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      <Flag className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <Button variant="outline" className="w-full">
                          Load More Reviews
                        </Button>
                      </TabsContent>

                      <TabsContent value="discussions" className="space-y-4 mt-0">
                        <div className="flex gap-2">
                          <Input placeholder="Search discussions..." className="flex-1" />
                          <Button>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            New Discussion
                          </Button>
                        </div>

                        <div className="space-y-4">
                          {[
                            {
                              id: 1,
                              title: "How to integrate with Discord bot?",
                              author: "DevUser123",
                              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=dev",
                              content: "Has anyone successfully integrated this agent with a Discord bot? Looking for guidance.",
                              timestamp: "5 hours ago",
                              replies: 3,
                              likes: 5
                            },
                            {
                              id: 2,
                              title: "Feature Request: Add support for LinkedIn posts",
                              author: "MarketingPro",
                              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=market",
                              content: "Would be amazing if this could analyze LinkedIn posts as well. The B2B insights would be valuable.",
                              timestamp: "1 day ago",
                              replies: 7,
                              likes: 12
                            }
                          ].map((discussion) => (
                            <div key={discussion.id} className="border rounded-lg p-4 hover:bg-muted/20 cursor-pointer">
                              <div className="flex items-start gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={discussion.avatar} />
                                  <AvatarFallback>{discussion.author[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-sm mb-1">{discussion.title}</h4>
                                  <p className="text-sm text-muted-foreground mb-2">{discussion.content}</p>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>{discussion.author}</span>
                                    <span>{discussion.timestamp}</span>
                                    <div className="flex items-center gap-1">
                                      <MessageSquare className="h-3 w-3" />
                                      {discussion.replies} replies
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <ThumbsUp className="h-3 w-3" />
                                      {discussion.likes}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <Button variant="outline" className="w-full">
                          Load More Discussions
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </CardHeader>
                </Card>
              </div>

              {/* Right Sidebar - Rating Breakdown */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Rating Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold">{agentStats.rating}</div>
                      <div className="flex justify-center my-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "h-5 w-5",
                              star <= Math.round(agentStats.rating) 
                                ? "text-yellow-500 fill-yellow-500" 
                                : "text-muted-foreground"
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">{agentStats.reviews} total reviews</p>
                    </div>
                    
                    {[
                      { stars: 5, percentage: 72, count: 112 },
                      { stars: 4, percentage: 18, count: 28 },
                      { stars: 3, percentage: 6, count: 10 },
                      { stars: 2, percentage: 3, count: 4 },
                      { stars: 1, percentage: 1, count: 2 }
                    ].map((rating) => (
                      <div key={rating.stars} className="flex items-center gap-2">
                        <span className="text-sm w-8">{rating.stars}★</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-yellow-500 rounded-full"
                            style={{ width: `${rating.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {rating.count}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Top Contributors</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { name: "Alice Chen", contributions: 12, avatar: "alice" },
                      { name: "Bob Smith", contributions: 8, avatar: "bob" },
                      { name: "Charlie Davis", contributions: 6, avatar: "charlie" }
                    ].map((contributor) => (
                      <div key={contributor.name} className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${contributor.avatar}`} />
                          <AvatarFallback>{contributor.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm flex-1">{contributor.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {contributor.contributions}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="versions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Version History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">v1.0.0</p>
                        <Badge variant="secondary">Latest</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">2 days ago by {authorData.name}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Deploy
                    </Button>
                  </div>
                  <p className="text-sm mt-2">Added support for multiple news sources</p>
                </div>

                <div className="border rounded-md p-4 opacity-60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">v0.9.0</p>
                      <p className="text-sm text-muted-foreground">1 week ago</p>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                  <p className="text-sm mt-2">Initial release</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Success Rate</span>
                      </div>
                      <p className="text-2xl font-bold">{agentStats.successRate}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Avg Response Time</span>
                      </div>
                      <p className="text-2xl font-bold">{agentStats.avgResponseTime}</p>
                    </div>
                  </div>

                  <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/20">
                    <p className="text-muted-foreground">Usage chart visualization would go here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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