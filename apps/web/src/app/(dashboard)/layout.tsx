'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

import { apiFetch } from '@/lib/api';
import { useActiveGroup } from '@/hooks/use-active-group';
import { toast } from 'sonner';
import { Topbar } from '@/components/layout/Topbar';
import { BottomNav } from '@/components/layout/BottomNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [sectorsLoaded, setSectorsLoaded] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);

  const { activeGroup, changeGroup } = useActiveGroup();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    let notificationChannel: any = null;

    const initializeLayout = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;

      if (!session) {
        router.replace('/login');
        return;
      }

      setLoading(false);

      // Verify sector membership
      try {
        const data = await apiFetch('/sectors');
        if (!active) return;
        setGroups(data || []);

        const hasSectors = data && data.length > 0;
        if (!hasSectors && pathname !== '/sectors/onboarding') {
          router.replace('/sectors/onboarding');
        } else if (hasSectors && pathname === '/sectors/onboarding') {
          router.replace('/');
        }
      } catch (err) {
        console.error('Failed to verify sector access in layout:', err);
      } finally {
        if (active) {
          setSectorsLoaded(true);
        }
      }

      // Establish Realtime Notification Listener
      if (active) {
        notificationChannel = supabase
          .channel(`user-notifications-${session.user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `recipient_id=eq.${session.user.id}`,
            },
            async (payload) => {
              try {
                const { data: sender } = await supabase
                  .from('users')
                  .select('username')
                  .eq('id', payload.new.sender_id)
                  .single();

                const senderName = sender?.username ? `@${sender.username}` : 'Someone';
                let msg = '';
                if (payload.new.type === 'like') {
                  msg = `${senderName} liked your memory.`;
                } else if (payload.new.type === 'comment') {
                  msg = `${senderName} commented on your memory.`;
                } else if (payload.new.type === 'follow') {
                  msg = `${senderName} started following you.`;
                } else {
                  msg = `New interaction from ${senderName}.`;
                }

                toast.info(msg, {
                  icon: '🔔',
                  duration: 5000,
                });
              } catch (err) {
                console.error('Failed to parse incoming notification:', err);
                toast.info('New interaction notification received.', {
                  icon: '🔔',
                  duration: 5000,
                });
              }
            }
          )
          .subscribe();
      }
    };

    initializeLayout();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.replace('/login');
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
      if (notificationChannel) {
        supabase.removeChannel(notificationChannel);
      }
    };
  }, [router, pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const isOnboarding = pathname === '/sectors/onboarding';

  if (loading || !sectorsLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-cyber-dark">
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-[3px] border-white/10 border-t-cyber-purple animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-10 w-10 rounded-full bg-cyber-purple/10 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] bg-[#111718] selection:bg-cyber-purple/20 selection:text-cyber-purple flex-col relative overflow-x-hidden">
      {/* Atmospheric Background Layer */}
      <div className="nostalgia-grain" />
      <div className="light-leak" />

      {/* Top Header - Application Header */}
      <Topbar 
        activeGroup={activeGroup} 
        groups={groups} 
        changeGroup={changeGroup} 
        handleSignOut={handleSignOut} 
      />

      {/* Main Content */}
      <main className="flex-1 min-h-[100dvh]">
        <div className="max-w-4xl mx-auto px-6 py-8 md:py-12 pb-40 md:pb-48">
          {children}
        </div>
      </main>

      {/* Unified Portal Navigation - Modern Application Navigation */}
      <BottomNav isOnboarding={isOnboarding} handleSignOut={handleSignOut} />
    </div>
  );
}

