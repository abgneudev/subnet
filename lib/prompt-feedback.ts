export interface FeedbackSuggestion {
  id: string;
  category: 'correctness' | 'clarity' | 'engagement' | 'delivery';
  type: 'error' | 'warning' | 'suggestion';
  title: string;
  description: string;
  originalText?: string;
  suggestedText?: string;
  position?: { start: number; end: number };
}

export interface FeedbackScore {
  correctness: number;
  clarity: number;
  engagement: number;
  delivery: number;
}

export function analyzePrompt(text: string): {
  score: FeedbackScore;
  suggestions: FeedbackSuggestion[];
} {
  const suggestions: FeedbackSuggestion[] = [];
  
  // Correctness checks
  if (text.includes('your') && text.includes('you are')) {
    const match = text.match(/you are a ([^.]+)/i);
    if (match) {
      suggestions.push({
        id: 'passive-voice-1',
        category: 'correctness',
        type: 'suggestion',
        title: 'Rewrite in active voice',
        description: 'Use active voice for clearer, more direct instructions',
        originalText: match[0],
        suggestedText: match[0].replace('you are', 'You must act as'),
      });
    }
  }

  // Check for punctuation issues
  const sentences = text.split(/[.!?]+/);
  sentences.forEach((sentence, idx) => {
    if (sentence.trim() && !sentence.trim().endsWith('.') && idx < sentences.length - 1) {
      suggestions.push({
        id: `punctuation-${idx}`,
        category: 'correctness',
        type: 'error',
        title: 'Punctuation problem',
        description: 'Missing period at end of sentence',
        originalText: sentence.trim(),
      });
    }
  });

  // Clarity checks
  if (text.length > 0 && text.split(' ').length < 10) {
    suggestions.push({
      id: 'too-short',
      category: 'clarity',
      type: 'warning',
      title: 'Instructions too brief',
      description: 'Add more context and specific requirements for better results',
    });
  }

  if (text.includes('etc') || text.includes('...')) {
    suggestions.push({
      id: 'vague-language',
      category: 'clarity',
      type: 'warning',
      title: 'Avoid vague language',
      description: 'Be specific instead of using "etc" or "..." - list out exact requirements',
    });
  }

  // Engagement checks
  const hasExamples = text.toLowerCase().includes('example') || text.toLowerCase().includes('for instance');
  if (!hasExamples && text.length > 50) {
    suggestions.push({
      id: 'add-examples',
      category: 'engagement',
      type: 'suggestion',
      title: 'Include examples',
      description: 'Add concrete examples to help the agent understand expected outputs',
    });
  }

  if (!text.toLowerCase().includes('step') && !text.toLowerCase().includes('first') && text.length > 100) {
    suggestions.push({
      id: 'add-structure',
      category: 'engagement',
      type: 'suggestion',
      title: 'Add step-by-step structure',
      description: 'Break down instructions into numbered steps for clarity',
    });
  }

  // Delivery checks
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount > 500) {
    suggestions.push({
      id: 'too-long',
      category: 'delivery',
      type: 'warning',
      title: 'Instructions too lengthy',
      description: 'Consider condensing to focus on key requirements (currently ' + wordCount + ' words)',
    });
  }

  if (text.includes('never') || text.includes('always') || text.includes('must')) {
    suggestions.push({
      id: 'strong-language',
      category: 'delivery',
      type: 'suggestion',
      title: 'Consider softening absolute language',
      description: 'Words like "never" and "always" can be overly restrictive - use when truly necessary',
    });
  }

  // Calculate scores (0-100)
  const score: FeedbackScore = {
    correctness: Math.max(0, 100 - (suggestions.filter(s => s.category === 'correctness').length * 15)),
    clarity: Math.max(0, 100 - (suggestions.filter(s => s.category === 'clarity').length * 20)),
    engagement: Math.max(0, 100 - (suggestions.filter(s => s.category === 'engagement').length * 15)),
    delivery: Math.max(0, 100 - (suggestions.filter(s => s.category === 'delivery').length * 15)),
  };

  return { score, suggestions };
}
