'use client';

import { useState } from 'react';
import { type FeedbackScore, type FeedbackSuggestion } from '@/lib/prompt-feedback';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  ChevronRight, 
  Sparkles, 
  Target, 
  Lightbulb, 
  AlertCircle,
  TrendingUp,
  Zap,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromptFeedbackPanelProps {
  score: FeedbackScore;
  suggestions: FeedbackSuggestion[];
  onAcceptSuggestion?: (suggestion: FeedbackSuggestion) => void;
}

export function PromptFeedbackPanel({ score, suggestions, onAcceptSuggestion }: PromptFeedbackPanelProps) {
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  const overallScore = Math.round((score.correctness + score.clarity + score.engagement + score.delivery) / 4);

  const getScoreColor = (value: number) => {
    if (value >= 85) return 'text-green-600 bg-green-50';
    if (value >= 70) return 'text-blue-600 bg-blue-50';
    if (value >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'warning':
        return <Target className="h-4 w-4" />;
      case 'suggestion':
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getSuggestionColorClass = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-100 text-red-600';
      case 'warning':
        return 'bg-blue-100 text-blue-600';
      case 'suggestion':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-purple-100 text-purple-600';
    }
  };

  const handleApplySuggestion = (suggestion: FeedbackSuggestion) => {
    onAcceptSuggestion?.(suggestion);
    setAppliedSuggestions(new Set([...appliedSuggestions, suggestion.id]));
    setTimeout(() => setExpandedSuggestion(null), 300);
  };

  const circumference = 2 * Math.PI * 36;
  const strokeDasharray = `${circumference * overallScore / 100} ${circumference}`;

  return (
    <div className="w-full">
      {/* Suggestions Section - Clean & Minimal */}
      {suggestions.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Ways to improve your prompt</h3>
                <p className="text-xs text-gray-500 mt-0.5">Apply suggestions to make your agent instructions more effective</p>
              </div>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                {suggestions.length}
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {suggestions.map((suggestion) => (
              <div 
                key={suggestion.id}
                className={cn(
                  'transition-all duration-200',
                  appliedSuggestions.has(suggestion.id) && 'opacity-50'
                )}
              >
                <div 
                  className="p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedSuggestion(
                    expandedSuggestion === suggestion.id ? null : suggestion.id
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('p-1.5 rounded-lg', getSuggestionColorClass(suggestion.type))}>
                      {getSuggestionIcon(suggestion.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-medium text-sm text-gray-900">{suggestion.title}</h4>
                        {appliedSuggestions.has(suggestion.id) && (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            Applied
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">{suggestion.description}</p>
                    </div>

                    <ChevronRight className={cn(
                      'w-4 h-4 text-gray-400 transition-transform flex-shrink-0',
                      expandedSuggestion === suggestion.id && 'rotate-90'
                    )} />
                  </div>
                </div>

                {/* Expanded View */}
                {expandedSuggestion === suggestion.id && (
                  <div className="px-3 pb-3 bg-gray-50">
                    <div className="mt-2 space-y-3">
                      {suggestion.originalText && suggestion.suggestedText && (
                        <div className="space-y-2">
                          <div className="bg-red-50 rounded-lg border border-red-200 p-2">
                            <p className="text-xs font-medium text-red-700 mb-1">Current:</p>
                            <p className="text-xs text-red-900 line-through">{suggestion.originalText}</p>
                          </div>
                          <ArrowRight className="w-3 h-3 text-gray-400 mx-auto" />
                          <div className="bg-green-50 rounded-lg border border-green-200 p-2">
                            <p className="text-xs font-medium text-green-700 mb-1">Suggested:</p>
                            <p className="text-xs text-green-900">{suggestion.suggestedText}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplySuggestion(suggestion);
                          }}
                          disabled={appliedSuggestions.has(suggestion.id)}
                          size="sm"
                          className={cn(
                            'flex-1 h-8 text-xs',
                            appliedSuggestions.has(suggestion.id)
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          )}
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          {appliedSuggestions.has(suggestion.id) ? 'Applied' : 'Apply'}
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedSuggestion(null);
                          }}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <p className="text-sm text-green-800 font-medium">Great! No suggestions at the moment.</p>
        </div>
      )}
    </div>
  );
}
