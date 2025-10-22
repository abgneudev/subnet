export interface Agent {
  id: string;
  title: string;
  description: string;
  prompt: string;
  tools: string[];
}

export interface Tool {
  value: string;
  label: string;
  description: string;
  author: string;
  category: 'search' | 'data' | 'communication' | 'analysis' | 'utility';
  logo: string; // emoji or icon
  verified?: boolean;
}

export const AVAILABLE_TOOLS: Tool[] = [
  {
    value: 'parallel_search',
    label: 'Parallel Search',
    description: 'Execute multiple search queries simultaneously for faster results and comprehensive data gathering.',
    author: 'Subnet',
    category: 'search',
    logo: '🔍',
    verified: true,
  },
  {
    value: 'exa_search',
    label: 'Exa Search',
    description: 'AI-powered semantic search engine that understands context and meaning for more relevant results.',
    author: 'Exa AI',
    category: 'search',
    logo: '🎯',
    verified: true,
  },
  {
    value: 'exa_crawl',
    label: 'Exa Crawl',
    description: 'Intelligently crawl and extract structured data from websites with advanced parsing capabilities.',
    author: 'Exa AI',
    category: 'data',
    logo: '🕷️',
    verified: true,
  },
  {
    value: 'exa_find_similar',
    label: 'Exa Find Similar',
    description: 'Discover content similar to a given webpage using neural similarity matching algorithms.',
    author: 'Exa AI',
    category: 'search',
    logo: '🔗',
    verified: true,
  },
  {
    value: 'web_search',
    label: 'Google Web Search',
    description: 'Access Google\'s comprehensive web search index for finding information across the internet.',
    author: 'Google',
    category: 'search',
    logo: '🌐',
    verified: true,
  },
  {
    value: 'webpage_understanding',
    label: 'Jina Webpage Understanding',
    description: 'Extract and understand webpage content with advanced AI-powered content analysis and summarization.',
    author: 'Jina AI',
    category: 'analysis',
    logo: '📄',
    verified: true,
  },
];
