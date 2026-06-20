'use client';

import React from 'react';
import { StoryBubbleList } from '@/features/stories/components/story-bubble';
import { FeedList } from '@/features/feed/components/feed-list';
import { NotificationBell } from '@/features/notifications/components/notification-bell';

export default function PortalPage() {
  return (
    <div className="space-y-20 animate-fade-in">
      {/* Top Row: Info & Notification bell */}
      <div className="flex justify-between items-center pb-8 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="px-4 py-1.5 rounded-full bg-cyber-purple/20 border border-cyber-purple/40 text-[11px] font-black text-white uppercase tracking-[0.4em] animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            Live Connection
          </div>
        </div>
        <NotificationBell />
      </div>

      {/* Stories Node Line - Modern Full-Screen */}
      <section className="relative">
        <StoryBubbleList />
      </section>

      {/* Scanned Memories Stream */}
      <FeedList />
    </div>
  );
}
