'use client';

import { useState, ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  count?: number;
  content: ReactNode;
}

interface AdminTabsProps {
  tabs: Tab[];
}

export default function AdminTabs({ tabs }: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');

  const activeContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-primary-light text-primary-light'
                    : 'border-transparent text-light hover:border-border hover:text-muted'
                }
              `}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium
                    ${
                      activeTab === tab.id
                        ? 'bg-primary-light/20 text-primary-light'
                        : 'bg-card text-light'
                    }
                  `}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>{activeContent}</div>
    </div>
  );
}
