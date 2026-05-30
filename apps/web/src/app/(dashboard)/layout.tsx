'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Home, PlusSquare, User, LogOut, Search, PlaySquare, Map, Camera, Library, Users, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { useActiveGroup } from '@/hooks/use-active-group';
import { toast } from 'sonner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [sectorsLoaded, setSectorsLoaded] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
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
    <div className="flex min-h-screen bg-cyber-dark selection:bg-cyber-purple/20 selection:text-cyber-purple flex-col relative overflow-x-hidden">
      {/* God Level Nostalgia Layer */}
      <div className="nostalgia-grain" />
      <div className="light-leak" />

      {/* Top Header - Cyber Branding */}
      <header className="sticky top-0 z-40 bg-cyber-dark/60 backdrop-blur-3xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyber-purple via-cyber-pink to-orange-500 flex items-center justify-center shadow-lg neon-glow-purple">
            <Library size={20} className="text-white" />
          </div>
          <button 
            onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
            className="flex items-center gap-1.5 text-left cursor-pointer group"
          >
            <div className="flex flex-col">
              <h1 className="text-xl font-black tracking-tighter text-white leading-none group-hover:text-cyber-purple transition-colors">
                {activeGroup ? activeGroup.name : 'Public Feed'}
              </h1>
              <span className="text-[11px] font-black cyber-gradient-text uppercase tracking-[0.2em] mt-1">
                {activeGroup ? 'Group Feed' : 'LegacyLoop'}
              </span>
            </div>
            <ChevronDown size={16} className="text-gray-400 group-hover:text-white transition-colors" />
          </button>

          {isGroupDropdownOpen && (
            <>
              <div className="fixed inset-0 z-45" onClick={() => setIsGroupDropdownOpen(false)} />
              <div className="absolute left-0 top-14 w-72 bg-cyber-dark/95 backdrop-blur-3xl rounded-[2rem] border border-white/10 shadow-[0_15px_50px_rgba(0,0,0,0.85)] z-50 overflow-hidden py-4 animate-fade-in">
                <div className="px-6 py-2 border-b border-white/5 flex justify-between items-center mb-2">
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Switch Group</span>
                </div>
                
                <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto scrollbar-hide">
                  <button
                    type="button"
                    onClick={() => {
                      changeGroup(null);
                      setIsGroupDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-6 py-4 text-sm font-black transition-all flex items-center justify-between cursor-pointer",
                      !activeGroup ? "text-cyber-purple bg-white/5" : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <span>Public Feed</span>
                    {!activeGroup && <div className="w-2.5 h-2.5 rounded-full bg-cyber-purple shadow-[0_0_10px_#A855F7]" />}
                  </button>
                  
                  {groups.map((group) => {
                    const isSelected = activeGroup?.id === group.id;
                    return (
                      <button
                        type="button"
                        key={group.id}
                        onClick={() => {
                          changeGroup({ id: group.id, name: group.name });
                          setIsGroupDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-6 py-4 text-sm font-black transition-all flex items-center justify-between cursor-pointer",
                          isSelected ? "text-cyber-purple bg-white/5" : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <span className="truncate pr-4">{group.name}</span>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-cyber-purple shadow-[0_0_10px_#A855F7]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
        <button 
          onClick={handleSignOut}
          className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors border border-white/10"
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-8 md:py-12 pb-32">
          {children}
        </div>
      </main>

      {/* Unified Portal Navigation - Cyber-Nostalgia Style */}
      {!isOnboarding && (
        <nav className="fixed bottom-0 inset-x-0 h-20 bg-cyber-dark/80 backdrop-blur-3xl border-t border-white/10 flex justify-around items-center z-50 px-4 pb-safe max-w-2xl mx-auto md:mb-8 md:rounded-[2.5rem] md:border md:border-white/10 md:bottom-4 md:shadow-[0_0_40px_rgba(0,0,0,0.9)]">

        <Link href="/" className="flex-1 flex flex-col items-center justify-center group gap-1.5">
          <div className={cn(
            "p-2.5 rounded-2xl transition-all duration-300",
            pathname === '/' ? "bg-cyber-purple/20 text-cyber-purple neon-glow-purple" : "text-gray-400 group-hover:text-white"
          )}>
            <Home size={26} strokeWidth={pathname === '/' ? 2.5 : 2} />
          </div>
          <span className={cn("text-[11px] font-black tracking-widest uppercase", pathname === '/' ? "text-cyber-purple" : "text-gray-400")}>Home</span>
        </Link>
        
        <Link href="/search" className="flex-1 flex flex-col items-center justify-center group gap-1.5">
          <div className={cn(
            "p-2.5 rounded-2xl transition-all duration-300",
            pathname === '/search' ? "bg-cyber-purple/20 text-cyber-purple neon-glow-purple" : "text-gray-400 group-hover:text-white"
          )}>
            <Map size={26} strokeWidth={pathname === '/search' ? 2.5 : 2} />
          </div>
          <span className={cn("text-[11px] font-black tracking-widest uppercase", pathname === '/search' ? "text-cyber-purple" : "text-gray-400")}>Map</span>
        </Link>

        <Link href="/create" className="flex-1 flex flex-col items-center justify-center group gap-1.5">
          <div className={cn(
            "p-3.5 rounded-2xl transition-all duration-300 -mt-10 bg-gradient-to-tr from-cyber-purple to-cyber-pink shadow-2xl",
            pathname === '/create' ? "scale-110 neon-glow-purple" : "scale-100 hover:scale-110"
          )}>
            <Camera size={28} strokeWidth={2.5} className="text-white" />
          </div>
          <span className={cn("text-[11px] font-black tracking-widest uppercase mt-0.5", pathname === '/create' ? "text-cyber-pink" : "text-gray-400")}>Post</span>
        </Link>



        <Link href="/sectors" className="flex-1 flex flex-col items-center justify-center group gap-1.5">
          <div className={cn(
            "p-2.5 rounded-2xl transition-all duration-300",
            pathname === '/sectors' ? "bg-cyber-purple/20 text-cyber-purple neon-glow-purple" : "text-gray-400 group-hover:text-white"
          )}>
            <Users size={26} strokeWidth={pathname === '/sectors' ? 2.5 : 2} />
          </div>
          <span className={cn("text-[11px] font-black tracking-widest uppercase", pathname === '/sectors' ? "text-cyber-purple" : "text-gray-400")}>Groups</span>
        </Link>

        <Link href="/profile" className="flex-1 flex flex-col items-center justify-center group gap-1.5">
          <div className={cn(
            "p-2.5 rounded-2xl transition-all duration-300",
            pathname === '/profile' ? "bg-cyber-pink/20 text-cyber-pink neon-glow-pink" : "text-gray-400 group-hover:text-white"
          )}>
            <Library size={26} strokeWidth={pathname === '/profile' ? 2.5 : 2} />
          </div>
          <span className={cn("text-[11px] font-black tracking-widest uppercase", pathname === '/profile' ? "text-cyber-pink" : "text-gray-400")}>Profile</span>
        </Link>
        
        <button 
          onClick={handleSignOut}
          className="hidden md:flex flex-1 flex-col items-center justify-center group gap-1.5"
        >
          <div className="p-2.5 text-gray-400 group-hover:text-red-400 transition-colors">
            <LogOut size={26} />
          </div>
          <span className="text-[11px] font-black text-gray-400 tracking-widest uppercase group-hover:text-red-400">Log Out</span>
        </button>
      </nav>
      )}
    </div>
  );
}

