'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SmartAutocomplete } from '@/components/SmartAutocomplete';
import { Separator } from '@/components/ui/separator';
import { 
  Lightbulb, 
  TrendingUp, 
  Clock, 
  MapPin, 
  Building, 
  Users,
  Sparkles,
  Search
} from 'lucide-react';

export function AutocompleteDemo() {
  const [demoQuery, setDemoQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const handleDemoSearch = (query: string) => {
    console.log('Demo search:', query);
    setSearchHistory(prev => [query, ...prev.slice(0, 4)]);
  };

  const features = [
    {
      icon: <Lightbulb className="h-5 w-5 text-yellow-500" />,
      title: "Smart Starter Suggestions",
      description: "Get helpful suggestions to begin your search",
      examples: ["investment banking firms in NYC", "tech companies in San Francisco", "law firms in Los Angeles"]
    },
    {
      icon: <Sparkles className="h-5 w-5 text-blue-500" />,
      title: "Intelligent Completions",
      description: "AI-powered suggestions that complete your search intent",
      examples: ["tech companies → in Silicon Valley", "law firms → in Manhattan", "startups → in Austin"]
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-green-500" />,
      title: "Popular Searches",
      description: "See what others are searching for",
      examples: ["AI startups in San Francisco", "venture capital firms", "investment banks in Wall Street"]
    },
    {
      icon: <Clock className="h-5 w-5 text-gray-500" />,
      title: "Recent History",
      description: "Quickly access your recent searches",
      examples: ["Your last 10 searches", "Instant re-search", "No typing required"]
    },
    {
      icon: <MapPin className="h-5 w-5 text-red-500" />,
      title: "Location Intelligence",
      description: "Smart location suggestions and completions",
      examples: ["in New York City", "in San Francisco", "in Los Angeles"]
    },
    {
      icon: <Building className="h-5 w-5 text-purple-500" />,
      title: "Industry Categories",
      description: "Browse by industry type",
      examples: ["technology companies", "financial services", "healthcare organizations"]
    }
  ];

  const searchCategories = [
    { name: "Technology", queries: ["tech companies", "SaaS companies", "AI startups", "fintech companies"] },
    { name: "Finance", queries: ["investment banks", "venture capital", "private equity", "hedge funds"] },
    { name: "Professional Services", queries: ["law firms", "consulting firms", "accounting firms", "marketing agencies"] },
    { name: "Healthcare", queries: ["hospitals", "medical practices", "biotech companies", "pharmaceutical companies"] },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Interactive Autocomplete Demo
          </CardTitle>
          <CardDescription>
            Try typing to see intelligent suggestions and completions in action
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SmartAutocomplete
            value={demoQuery}
            onChange={setDemoQuery}
            onSearch={handleDemoSearch}
            placeholder="Try typing 'tech companies' or 'investment banking'..."
          />
          
          {searchHistory.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Recent demo searches:</div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((query, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-blue-100"
                    onClick={() => setDemoQuery(query)}
                  >
                    {query}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                {feature.icon}
                {feature.title}
              </CardTitle>
              <CardDescription className="text-sm">
                {feature.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {feature.examples.map((example, exampleIndex) => (
                  <div key={exampleIndex} className="text-xs bg-gray-50 dark:bg-gray-900/50 px-2 py-1 rounded font-mono">
                    {example}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search by Category</CardTitle>
          <CardDescription>
            Click on any of these common search types to see them in action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {searchCategories.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="font-medium text-sm">{category.name}</div>
                <div className="flex flex-wrap gap-2">
                  {category.queries.map((query, queryIndex) => (
                    <Badge
                      key={queryIndex}
                      variant="outline"
                      className="cursor-pointer hover:bg-blue-50 hover:border-blue-300"
                      onClick={() => setDemoQuery(query)}
                    >
                      {query}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 text-xs font-bold w-6 h-6 flex items-center justify-center">1</div>
              <div>
                <div className="font-medium">Smart Suggestions</div>
                <div className="text-sm text-gray-600">Start typing and get intelligent suggestions based on popular searches and your input</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 text-xs font-bold w-6 h-6 flex items-center justify-center">2</div>
              <div>
                <div className="font-medium">Context-Aware Completions</div>
                <div className="text-sm text-gray-600">Get smart completions that understand your search intent and suggest locations or industry types</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 text-xs font-bold w-6 h-6 flex items-center justify-center">3</div>
              <div>
                <div className="font-medium">Personalized History</div>
                <div className="text-sm text-gray-600">Your recent searches are saved and prioritized for quick access</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 text-xs font-bold w-6 h-6 flex items-center justify-center">4</div>
              <div>
                <div className="font-medium">Keyboard Navigation</div>
                <div className="text-sm text-gray-600">Use arrow keys to navigate suggestions, Enter to select, Escape to close</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}