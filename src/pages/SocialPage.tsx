/**
 * SocialPage — Community hub with Friends, Groups, Challenges, Activity Feed.
 */

import { useState } from 'react';
import { PageShell } from '../shared/components/PageShell';
import { ComponentErrorBoundary } from '../shared/components/ComponentErrorBoundary';
import { useTranslation } from '../i18n';
import { cn } from '../lib/utils';

import { FriendsTabContent } from '../features/social/components/FriendsTabContent';
import { GroupsTabContent } from '../features/social/components/GroupsTabContent';
import { ChallengesTabContent } from '../features/social/components/ChallengesTabContent';
import { ActivityFeedTabContent } from '../features/social/components/ActivityFeedTabContent';

type SocialTab = 'feed' | 'friends' | 'groups' | 'challenges';

export function SocialPage() {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const [activeTab, setActiveTab] = useState<SocialTab>('feed');

  const tabs: { key: SocialTab; label: string }[] = [
    { key: 'feed', label: isDE ? 'Feed' : 'Feed' },
    { key: 'friends', label: isDE ? 'Freunde' : 'Friends' },
    { key: 'groups', label: isDE ? 'Gruppen' : 'Groups' },
    { key: 'challenges', label: 'Challenges' },
  ];

  return (
    <PageShell title={isDE ? 'Community' : 'Community'}>
      {/* Tab Selector */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 py-2 text-xs font-medium rounded-md transition-all',
              activeTab === tab.key
                ? 'bg-white text-teal-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'feed' && (
        <ComponentErrorBoundary label="ActivityFeed" language={language as 'de' | 'en'}>
          <ActivityFeedTabContent />
        </ComponentErrorBoundary>
      )}
      {activeTab === 'friends' && (
        <ComponentErrorBoundary label="Friends" language={language as 'de' | 'en'}>
          <FriendsTabContent />
        </ComponentErrorBoundary>
      )}
      {activeTab === 'groups' && (
        <ComponentErrorBoundary label="Groups" language={language as 'de' | 'en'}>
          <GroupsTabContent />
        </ComponentErrorBoundary>
      )}
      {activeTab === 'challenges' && (
        <ComponentErrorBoundary label="Challenges" language={language as 'de' | 'en'}>
          <ChallengesTabContent />
        </ComponentErrorBoundary>
      )}
    </PageShell>
  );
}
