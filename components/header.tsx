import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';

interface HeaderProps {
  showTabs?: boolean;
  activeTab?: string;
}

export function Header({ showTabs = false, activeTab = 'configuration' }: HeaderProps) {
  const tabs = ['Chats', 'Configuration', 'Logs', 'Evals', 'Datasets'];
  
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo.png" alt="SubNet" width={32} height={32} />
              <div className="flex items-center gap-2">
                <span className="text-foreground text-lg font-semibold">SubNet</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            <span className="text-muted-foreground text-sm ml-2">v0.0.1</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-3">
            {!showTabs && (
              <>
                <Link href="/discover">
                  <Button variant="outline" className="cursor-pointer">
                    Explore
                  </Button>
                </Link>
                <Link href="/create">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer">
                    Create Agent
                  </Button>
                </Link>
              </>
            )}
            {showTabs && (
              <>
                <Link href="/discover">
                  <Button variant="ghost" className="cursor-pointer">
                    Explore
                  </Button>
                </Link>
                <Button variant="outline" className="cursor-pointer">
                  Deploy <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        {showTabs && (
          <div className="flex items-center gap-6 border-t pt-3">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`flex items-center gap-2 text-sm pb-1 border-b-2 transition-colors ${
                  activeTab.toLowerCase() === tab.toLowerCase()
                    ? 'border-primary text-foreground font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'Chats' && <span className="text-lg">💬</span>}
                {tab === 'Configuration' && <span className="text-lg">⚙️</span>}
                {tab === 'Logs' && <span className="text-lg">📊</span>}
                {tab === 'Evals' && <span className="text-lg">📈</span>}
                {tab === 'Datasets' && <span className="text-lg">🗂️</span>}
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
