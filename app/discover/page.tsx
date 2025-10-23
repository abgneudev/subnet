'use client';

import { useEffect, useState, useMemo } from 'react';
import type { Agent } from '@/lib/types';
import { AVAILABLE_TOOLS } from '@/lib/types';
import { Header } from '@/components/header';
import { AgentCard } from '@/components/agent-card';
import { 
  Search, 
  Menu, 
  SlidersHorizontal, 
  ArrowUpDown, 
  ChevronDown,
  X 
} from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'For You', icon: '⭐' },
  { value: 'popular', label: 'Most Popular', icon: '🔥' },
  { value: 'research', label: 'Research', icon: '🔍' },
  { value: 'content', label: 'Content Creation', icon: '✍️' },
  { value: 'analysis', label: 'Data Analysis', icon: '📊' },
  { value: 'automation', label: 'Automation', icon: '⚙️' },
  { value: 'support', label: 'Customer Support', icon: '💬' },
  { value: 'coding', label: 'Coding Assistant', icon: '💻' },
  { value: 'marketing', label: 'Marketing', icon: '📢' },
];

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'recent', label: 'Recently Added' },
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
];

export default function DiscoverPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('popular');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAgents() {
      try {
        const response = await fetch('/api/agents');
        if (!response.ok) {
          throw new Error('Failed to fetch agents');
        }
        const data = await response.json();
        setAgents(data);
      } catch (error) {
        console.error('Error fetching agents:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAgents();
  }, []);

  // Use useMemo for better performance and to ensure proper filtering/sorting
  const filteredAgents = useMemo(() => {
    let filtered = [...agents];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(agent => {
        const title = agent.title.toLowerCase();
        const desc = agent.description.toLowerCase();
        
        switch (selectedCategory) {
          case 'research':
            return title.includes('research') || desc.includes('research') || 
                   agent.tools.some(t => t.includes('search') || t.includes('exa'));
          case 'content':
            return title.includes('content') || title.includes('writer') || title.includes('blog') ||
                   desc.includes('content') || desc.includes('writing');
          case 'analysis':
            return title.includes('analysis') || title.includes('data') || 
                   desc.includes('analysis') || desc.includes('analytics');
          case 'automation':
            return title.includes('automation') || title.includes('workflow') ||
                   desc.includes('automat');
          case 'support':
            return title.includes('support') || title.includes('customer') || title.includes('help') ||
                   desc.includes('support') || desc.includes('customer');
          case 'coding':
            return title.includes('code') || title.includes('dev') || title.includes('programming') ||
                   desc.includes('code') || desc.includes('programming');
          case 'marketing':
            return title.includes('market') || title.includes('seo') || title.includes('social') ||
                   desc.includes('market') || desc.includes('campaign');
          case 'popular':
            return agent.tools.length > 2; // Agents with more tools are "popular"
          default:
            return true;
        }
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(agent => {
        const titleMatch = agent.title.toLowerCase().includes(query);
        const descMatch = agent.description.toLowerCase().includes(query);
        // Also search in tools if needed
        const toolsMatch = agent.tools.some(tool => tool.toLowerCase().includes(query));
        return titleMatch || descMatch || toolsMatch;
      });
    }

    // Filter by selected tools (AND logic - agent must have ALL selected tools)
    // Change to OR logic if you want agents with ANY of the selected tools
    if (selectedTools.length > 0) {
      filtered = filtered.filter(agent => 
        selectedTools.every(tool => agent.tools.includes(tool))
        // For OR logic, use: selectedTools.some(tool => agent.tools.includes(tool))
      );
    }

    // Sort the results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.title.localeCompare(b.title);
        
        case 'name-desc':
          return b.title.localeCompare(a.title);
        
        case 'recent':
          // Handle both string and numeric IDs
          const aId = typeof a.id === 'number' ? a.id : parseInt(a.id as string) || 0;
          const bId = typeof b.id === 'number' ? b.id : parseInt(b.id as string) || 0;
          return bId - aId; // Higher ID = more recent
        
        case 'popular':
        default:
          // Better popularity proxy: count of tools (more tools = more capability = popular)
          // You could also use a combination of factors
          const aPopularity = a.tools.length * 10 + a.description.length;
          const bPopularity = b.tools.length * 10 + b.description.length;
          return bPopularity - aPopularity;
      }
    });

    return filtered;
  }, [searchQuery, selectedTools, sortBy, selectedCategory, agents]);

  const toggleTool = (tool: string) => {
    setSelectedTools(prev =>
      prev.includes(tool) 
        ? prev.filter(t => t !== tool) 
        : [...prev, tool]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedTools([]);
    setSortBy('popular');
  };

  const activeFilterCount = 
    (searchQuery ? 1 : 0) + 
    (selectedCategory !== 'all' ? 1 : 0) + 
    selectedTools.length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking inside a dropdown
      if (!target.closest('[data-dropdown-trigger]') && !target.closest('[data-dropdown-content]')) {
        setDropdownOpen(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="bg-background min-h-screen">
      <Header />
      
      {/* Filter Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 h-14">
            {/* Search */}
            <div className="flex items-center flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search agents by name, tools, or capability..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Tools Dropdown */}
            <div className="relative">
              <button
                data-dropdown-trigger="tools"
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen(dropdownOpen === 'tools' ? null : 'tools');
                }}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTools.length > 0 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Tools
                {selectedTools.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                    {selectedTools.length}
                  </span>
                )}
                <ChevronDown className={`w-3 h-3 ml-2 transition-transform ${
                  dropdownOpen === 'tools' ? 'rotate-180' : ''
                }`} />
              </button>
              
              {dropdownOpen === 'tools' && (
                <div 
                  data-dropdown-content="tools"
                  className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg p-4 min-w-[300px] shadow-xl z-50"
                >
                  <div className="mb-2 text-xs text-gray-500 font-medium">
                    Select tools to filter by:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_TOOLS.map((tool) => (
                      <button
                        key={tool.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTool(tool.value);
                        }}
                        className={`px-3 py-1 text-xs rounded-full transition-all ${
                          selectedTools.includes(tool.value)
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tool.label}
                      </button>
                    ))}
                  </div>
                  {selectedTools.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => setSelectedTools([])}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear tool filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                data-dropdown-trigger="sort"
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen(dropdownOpen === 'sort' ? null : 'sort');
                }}
                className="flex items-center px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 text-sm font-medium transition-colors"
              >
                <ArrowUpDown className="w-4 h-4 mr-2" />
                {SORT_OPTIONS.find(opt => opt.value === sortBy)?.label || 'Sort'}
                <ChevronDown className={`w-3 h-3 ml-2 transition-transform ${
                  dropdownOpen === 'sort' ? 'rotate-180' : ''
                }`} />
              </button>
              
              {dropdownOpen === 'sort' && (
                <div 
                  data-dropdown-content="sort"
                  className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg py-2 min-w-[180px] shadow-xl z-50"
                >
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSortBy(option.value);
                        setDropdownOpen(null);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900 transition-colors ${
                        sortBy === option.value 
                          ? 'text-blue-600 bg-blue-50 font-medium' 
                          : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors flex items-center"
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Chips */}
        <div className="container mx-auto px-4 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Filters Pills */}
      {(selectedTools.length > 0 || searchQuery) && (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600 font-medium">Active filters:</span>
              
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                  Search: "{searchQuery}"
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-blue-900 ml-1" 
                    onClick={() => setSearchQuery('')}
                  />
                </span>
              )}
              
              {selectedTools.map((tool) => (
                <span 
                  key={tool}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                >
                  {AVAILABLE_TOOLS.find(t => t.value === tool)?.label || tool}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-blue-900 ml-1" 
                    onClick={() => toggleTool(tool)}
                  />
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-foreground mb-2 text-4xl font-bold">Discover Agents</h1>
          <p className="text-muted-foreground">
            SubNet is a network of agents powered by Subconscious
          </p>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            <p className="text-muted-foreground text-lg mt-4">Loading agents...</p>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground mb-4 text-lg">
              {agents.length === 0
                ? "Hmm we didn't find any agents. Create the first agent on SubNet!"
                : searchQuery || selectedTools.length > 0
                  ? 'No agents match your filters. Try adjusting your search or filters.'
                  : 'No agents available.'}
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              Showing {filteredAgents.length} {filteredAgents.length === 1 ? 'agent' : 'agents'}
              {filteredAgents.length !== agents.length && ` of ${agents.length} total`}
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onDelete={(agentId) => {
                    setAgents(prev => prev.filter(a => a.id !== agentId));
                  }}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
