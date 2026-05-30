'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Bell, Heart, MessageCircle, UserPlus, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { User, Post } from '@/types';
import { toast } from 'sonner';

interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string;
  type: 'like' | 'comment' | 'follow';
  post_id?: string | null;
  read: boolean;
  created_at: string;
  sender?: User | null;
  post?: Post | null;
}

export function NotificationBell() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // 1. Fetch notifications
  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => apiFetch('/notifications'),
    refetchInterval: 15000, // Poll every 15s for updates
  });

  // 2. Mark as read mutation
  const readMutation = useMutation({
    mutationFn: (notificationId: string) =>
      apiFetch(`/notifications/${notificationId}/read`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update notification');
    },
  });

  const unreadCount = notifications?.filter((n: Notification) => !n.read).length || 0;

  const handleNotificationClick = (n: Notification) => {
    if (!n.read) {
      readMutation.mutate(n.id);
    }
  };

  const getRelativeTime = (date: string) => {
    const diff = new Date().getTime() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Bell Trigger Icon */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white cursor-pointer transition-all relative"
      >
        <Bell size={24} className={cn(unreadCount > 0 && "animate-bounce")} />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-cyber-pink flex items-center justify-center text-[10px] font-black text-white shadow-lg neon-glow-pink">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Glass Droplist Overlay */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-4 w-96 cyber-glass rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.85)] z-50 overflow-hidden py-4 max-h-[500px] overflow-y-auto scrollbar-hide">
            <div className="px-6 py-2 border-b border-white/5 flex justify-between items-center">
              <h4 className="text-sm font-black text-white uppercase tracking-widest">Notifications</h4>
              {unreadCount > 0 && (
                <span className="text-[10px] font-black text-cyber-pink uppercase tracking-widest">{unreadCount} unread</span>
              )}
            </div>

            <div className="divide-y divide-white/5">
              {!notifications || notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 font-bold text-xs uppercase tracking-widest leading-6">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n: Notification) => (
                  <div 
                    key={n.id} 
                    onClick={() => handleNotificationClick(n)}
                    className={cn(
                      "p-5 flex items-start gap-4 cursor-pointer hover:bg-white/5 transition-all",
                      !n.read ? "bg-white/[0.02]" : "opacity-60"
                    )}
                  >
                    {/* Action Icon */}
                    <div className="mt-1">
                      {n.type === 'like' && <Heart size={16} className="text-cyber-pink fill-current" />}
                      {n.type === 'comment' && <MessageCircle size={16} className="text-cyber-purple" />}
                      {n.type === 'follow' && <UserPlus size={16} className="text-blue-400" />}
                    </div>

                    {/* Body */}
                    <div className="flex-1 space-y-1">
                      <p className="text-white text-xs font-semibold leading-relaxed">
                        <span className="font-black text-white">{n.sender?.username || 'Somebody'}</span>{' '}
                        {n.type === 'like' && 'liked your memory.'}
                        {n.type === 'comment' && 'commented: "' + (n.post?.caption ? n.post.caption.substring(0, 20) + '...' : '') + '"'}
                        {n.type === 'follow' && 'started following you.'}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{getRelativeTime(n.created_at)}</span>
                        {!n.read && <Circle size={6} className="fill-current text-cyber-pink" />}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
