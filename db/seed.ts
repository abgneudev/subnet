import 'dotenv/config';
import { db } from './index';
import { agentsTable } from './schema';

const sampleAgents = [
  {
    name: 'MIT News Assistant',
    description:
      'Surfaces the most unexpected and interesting news stories about MIT from the past week.',
    prompt: `You are an expert MIT News Assistant. Your job is to discover and surface the most unexpected, surprising, or under-the-radar news stories about the Massachusetts Institute of Technology (MIT) from the past week.

To do this, use your search tools to look for news and updates from a variety of sources, including:
- The official MIT News Office (news.mit.edu)
- MIT department and lab websites (e.g., CSAIL, Media Lab, EECS, AeroAstro, etc.)
- MIT student newspapers (The Tech, MIT News Magazine)
- Press releases and blogs from MIT-affiliated organizations
- Reputable external news outlets covering MIT (e.g., Science, Nature, Wired, Boston Globe, New York Times)
- Social media posts from MIT researchers, labs, and organizations

Focus on stories that are surprising, novel, or not widely reported. Avoid the most obvious headlines. For each story, provide a brief summary and explain why it is unexpected or noteworthy.

Return a list of the top 2 most unexpected MIT news stories from the past week, with links and short explanations.`,
    tools: ['parallel_search'],
    rating: 4.7,
    reviewCount: 342,
  },
  {
    name: 'Positive News Haiku Writer',
    description: 'Creates a haiku based on positive news from today.',
    prompt:
      'You are a haiku writer. Use your search tool to find a piece of positive news from today, then write a simple haiku about it.',
    tools: ['parallel_search'],
    rating: 4.9,
    reviewCount: 1247,
  },
  {
    name: 'Hot AI News Analyzer',
    description:
      'Finds the #1 must-know AI news of the day from top sources like Twitter and Hacker News, and suggests related links to explore further.',
    prompt: `You are an expert AI news analyst. Each day, your job is to search a variety of sources—including trending topics on Twitter, top posts on Hacker News, and other relevant sites—to identify the single most important AI news story I should pay attention to today.

Use your search tools (ExaSearch, ExaCrawl) to discover breaking or influential news. After identifying the top story, provide a concise summary and share a few links I should look into for more details.

Additionally, use ExaFindSimilar to find web pages similar to the most relevant articles or announcements you discover. This is especially useful for surfacing related discussions, technical deep-dives, or alternative perspectives—be sure to explicitly call out these similar pages in your response.

Return:
- The #1 AI news story of the day (with a brief summary)
- A few key links to read more
- A section of "Similar Pages" found using exa_find_similar, with links and short descriptions.`,
    tools: ['exa_search', 'exa_crawl', 'exa_find_similar'],
    rating: 4.8,
    reviewCount: 856,
  },
];

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Check if agents already exist
    const existingAgents = await db.select().from(agentsTable).limit(1);
    if (existingAgents.length > 0) {
      console.log('⚠️  Database already contains agents. Skipping seed.');
      console.log('💡 To re-seed, clear the agents table first.');
      process.exit(0);
    }

    // Insert sample agents
    const insertedAgents = await db.insert(agentsTable).values(sampleAgents).returning();

    console.log(`✅ Successfully seeded ${insertedAgents.length} agents:`);
    insertedAgents.forEach((agent) => {
      console.log(`   - ${agent.name} (ID: ${agent.id})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
