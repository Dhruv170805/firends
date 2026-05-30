'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Mail, GraduationCap, Calendar, Shield, Bell, Settings, ChevronRight, Edit2, Save, X, Loader2, Library, Sparkles, BarChart3, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

const StatCard = ({ label, value, sublabel }: { label: string, value: string, sublabel: string }) => (
  <div className="cyber-glass p-8 rounded-[2.5rem] neon-border flex flex-col items-center text-center group hover:scale-105 transition-transform duration-500">
    <span className="text-[11px] font-black text-white uppercase tracking-[0.4em] mb-3 opacity-80">{label}</span>
    <span className="text-4xl font-black text-white tracking-tighter mb-1.5 cyber-gradient-text">{value}</span>
    <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">{sublabel}</span>
  </div>
);

const PortalSetting = ({ icon: Icon, label, description, color }: { icon: any, label: string, description: string, color: string }) => (
  <button className="w-full flex items-center justify-between p-7 rounded-[2rem] hover:bg-white/10 transition-all group border border-transparent hover:border-white/10">
    <div className="flex items-center gap-7">
      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-lg", color)}>
        <Icon size={28} />
      </div>
      <div className="text-left">
        <p className="text-lg font-black text-white group-hover:text-cyber-purple transition-colors leading-none mb-1.5">{label}</p>
        <p className="text-sm text-gray-400 font-semibold">{description}</p>
      </div>
    </div>
    <ChevronRight size={24} className="text-gray-600 group-hover:text-white transition-colors" />
  </button>
);

const YearbookSkeleton = () => (
  <div className="max-w-5xl mx-auto pb-40 animate-pulse">
    {/* Header Skeleton */}
    <header className="mb-20 relative">
      <div className="h-72 w-full rounded-[4rem] bg-white/5 border border-white/5 overflow-hidden relative shadow-2xl">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-64 bg-white/5 rounded-full" />
        </div>
      </div>
      
      <div className="px-12 -mt-28 flex flex-col items-center md:items-start md:flex-row md:justify-between md:items-end gap-12">
        <div className="relative">
          <div className="w-56 h-56 rounded-[3.5rem] bg-cyber-dark p-2.5 shadow-[0_0_60px_rgba(0,0,0,0.9)] border border-white/5">
            <div className="w-full h-full rounded-[3rem] bg-white/5 border border-white/5" />
          </div>
        </div>
        
        <div className="flex-1 text-center md:text-left mb-6 space-y-4">
          <div className="flex items-center justify-center md:justify-start gap-5 mb-3">
            <div className="h-14 w-60 bg-white/5 rounded-2xl" />
            <div className="h-6 w-24 bg-white/5 rounded-full" />
          </div>
          <div className="h-6 w-80 bg-white/5 rounded-xl mx-auto md:mx-0" />
        </div>

        <div className="mb-6">
          <div className="h-20 w-44 bg-white/5 rounded-[2rem]" />
        </div>
      </div>
    </header>

    {/* Legacy Stats Grid Skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="cyber-glass p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center space-y-3 h-40">
          <div className="h-4 w-20 bg-white/5 rounded-full" />
          <div className="h-10 w-16 bg-white/5 rounded-xl" />
          <div className="h-4 w-28 bg-white/5 rounded-full" />
        </div>
      ))}
    </div>

    {/* Footer Columns Skeleton */}
    <div className="grid md:grid-cols-3 gap-12">
      <div className="md:col-span-2 space-y-12">
        <div className="h-4 w-40 bg-white/5 rounded-full ml-6" />
        <div className="cyber-glass rounded-[3rem] border border-white/5 p-8 space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between p-2">
              <div className="flex items-center gap-7">
                <div className="w-16 h-16 rounded-2xl bg-white/5" />
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-white/5 rounded-lg" />
                  <div className="h-4 w-48 bg-white/5 rounded-lg" />
                </div>
              </div>
              <div className="w-6 h-6 bg-white/5 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-12">
        <div className="h-4 w-32 bg-white/5 rounded-full ml-6" />
        <div className="cyber-glass rounded-[3rem] border border-white/5 p-10 flex flex-col items-center text-center space-y-6 h-[320px]">
          <div className="w-20 h-20 rounded-3xl bg-white/5" />
          <div className="h-4 w-28 bg-white/5 rounded-full" />
          <div className="h-8 w-44 bg-white/5 rounded-lg" />
          <div className="w-full h-[2px] bg-white/5" />
          <div className="h-4 w-32 bg-white/5 rounded-full" />
          <div className="h-8 w-24 bg-white/5 rounded-lg" />
        </div>
      </div>
    </div>
  </div>
);

export default function YearbookPage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showWrapped, setShowWrapped] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    college_id: '',
    batch_year: '',
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiFetch('/users/me'),
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['profile-stats'],
    queryFn: () => apiFetch('/users/me/stats'),
  });

  const formatStatValue = (val: number): string => {
    if (val >= 1000) {
      return (val / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return val.toString();
  };

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        bio: profile.bio || '',
        college_id: profile.college_id || '',
        batch_year: profile.batch_year?.toString() || '',
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiFetch('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update profile');
    }
  });

  if (isLoading) {
    return <YearbookSkeleton />;
  }


  const handleSave = () => {
    updateMutation.mutate({
      ...formData,
      batch_year: formData.batch_year ? parseInt(formData.batch_year) : null,
    });
  };

  return (
    <div className="max-w-5xl mx-auto pb-40">
      <header className="mb-20 relative">
        <div className="h-72 w-full rounded-[4rem] bg-gradient-to-br from-cyber-dark via-[#1a1c2e] to-cyber-dark border border-white/10 overflow-hidden relative shadow-2xl">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyber-purple/25 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyber-pink/15 rounded-full blur-[140px] translate-y-1/2 -translate-x-1/2" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-[140px] font-black text-white/5 tracking-tighter uppercase select-none leading-none">LEGACY</h2>
          </div>
        </div>
        
        <div className="px-12 -mt-28 flex flex-col items-center md:items-start md:flex-row md:justify-between md:items-end gap-12">
          <div className="relative group">
            <div className="w-56 h-56 rounded-[3.5rem] bg-cyber-dark p-2.5 shadow-[0_0_60px_rgba(0,0,0,0.9)] neon-border">
              <div className="w-full h-full rounded-[3rem] bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <User size={100} className="text-gray-700" />
                )}
              </div>
            </div>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={cn(
                "absolute bottom-5 right-5 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl border border-white/20 backdrop-blur-3xl transition-all",
                isEditing ? "bg-red-500 text-white" : "bg-white/15 text-white hover:scale-110 active:scale-95"
              )}
            >
              {isEditing ? <X size={24} /> : <Settings size={24} />}
            </button>
          </div>
          
          <div className="flex-1 text-center md:text-left mb-6">
            {isEditing ? (
              <div className="space-y-5 max-w-md mx-auto md:mx-0">
                <input 
                  className="text-4xl font-black text-white tracking-tighter bg-white/10 border border-white/20 rounded-2xl px-6 py-3 w-full focus:border-cyber-purple outline-none shadow-inner"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  placeholder="Username"
                />
                <textarea 
                  className="text-gray-300 font-bold bg-white/10 border border-white/20 rounded-2xl px-6 py-4 w-full focus:border-cyber-purple outline-none shadow-inner"
                  value={formData.bio}
                  onChange={e => setFormData({...formData, bio: e.target.value})}
                  placeholder="Write a short bio..."
                  rows={3}
                />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center md:justify-start gap-5 mb-3">
                  <h2 className="text-6xl font-black text-white tracking-tighter">{profile?.username || profile?.email?.split('@')[0]}</h2>
                  <div className="px-4 py-1.5 rounded-full bg-cyber-purple/20 border border-cyber-purple/40 text-[10px] font-black text-white uppercase tracking-[0.3em] shadow-sm">v1.0.0 Gold</div>
                </div>
                <p className="text-gray-300 font-bold text-xl max-w-lg leading-relaxed">
                  {profile?.bio || 'Documenting college life and memories.'}
                </p>
              </>
            )}
          </div>

          <div className="flex gap-5 mb-6">
             {isEditing ? (
               <button 
                 onClick={handleSave}
                 disabled={updateMutation.isPending}
                 className="px-12 py-6 rounded-[2rem] bg-cyber-purple text-white font-black shadow-2xl neon-glow-purple flex items-center gap-4 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-sm"
               >
                 {updateMutation.isPending ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                 <span>Save Profile</span>
               </button>
             ) : (
               <button 
                 onClick={() => setShowWrapped(true)}
                 className="px-12 py-6 rounded-[2rem] bg-gradient-to-r from-cyber-purple via-cyber-pink to-orange-500 text-white font-black shadow-2xl neon-glow-purple flex items-center gap-4 hover:scale-105 active:scale-95 transition-all group uppercase tracking-widest text-sm"
               >
                 <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
                 <span>2026 Wrapped</span>
               </button>
             )}
          </div>
        </div>
      </header>

      {/* Legacy Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
        <StatCard 
          label="Total Posts" 
          value={isStatsLoading ? "..." : formatStatValue(stats?.totalNodes ?? 0)} 
          sublabel="Memories Shared" 
        />
        <StatCard 
          label="Late Nights" 
          value={isStatsLoading ? "..." : formatStatValue(stats?.nightsLogged ?? 0)} 
          sublabel="Late Night Posts" 
        />
        <StatCard 
          label="Total Likes" 
          value={isStatsLoading ? "..." : formatStatValue(stats?.timelineFlow ?? 0)} 
          sublabel="Likes Received" 
        />
        <StatCard 
          label="Locations" 
          value={isStatsLoading ? "..." : formatStatValue(stats?.milestones ?? 0)} 
          sublabel="Places Visited" 
        />
      </div>

      <div className="grid md:grid-cols-3 gap-12">
        <div className="md:col-span-2 space-y-12">
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.5em] px-6">Settings & Privacy</h3>
          <div className="cyber-glass rounded-[3rem] border border-white/10 p-5 space-y-3">
            <PortalSetting icon={User} label="Edit Profile" description="Change your name, username, and bio" color="bg-cyber-purple/20 text-cyber-purple" />
            <PortalSetting icon={BarChart3} label="Post Analytics" description="See views, likes, and comments over time" color="bg-blue-500/20 text-blue-500" />
            <PortalSetting icon={Clock} label="Privacy Settings" description="Control who can see your posts" color="bg-cyber-pink/20 text-cyber-pink" />
            <PortalSetting icon={Shield} label="Account Security" description="Manage password and login sessions" color="bg-green-500/20 text-green-500" />
          </div>
        </div>

        <div className="space-y-12">
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.5em] px-6">College Info</h3>
          <div className="cyber-glass rounded-[3rem] border border-white/10 p-10 flex flex-col items-center text-center">
             <div className="w-20 h-20 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center mb-8 shadow-xl">
                <GraduationCap size={40} className="text-cyber-purple shadow-sm" />
             </div>
             <p className="text-[11px] font-black text-cyber-purple uppercase tracking-[0.4em] mb-2">College/School</p>
             <p className="text-2xl font-black text-white tracking-tighter mb-6 leading-tight">{profile?.college_id || 'Stanford University'}</p>
             <div className="w-full h-[2px] bg-white/10 mb-8" />
             <p className="text-[11px] font-black text-cyber-pink uppercase tracking-[0.4em] mb-2">Graduation Year</p>
             <p className="text-2xl font-black text-white tracking-tighter">Class of {profile?.batch_year || '2026'}</p>
          </div>
        </div>
      </div>

      {/* Memory Wrapped Modal (Simplified) */}
      {showWrapped && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
          <div className="absolute inset-0 bg-cyber-dark/98 backdrop-blur-3xl" onClick={() => setShowWrapped(false)} />
          <div className="relative w-full max-w-xl aspect-[9/16] rounded-[4rem] overflow-hidden bg-gradient-to-br from-[#1a1c2e] via-cyber-dark to-black border border-white/20 shadow-[0_0_120px_rgba(168,85,247,0.4)] animate-in fade-in zoom-in duration-500">
             <div className="absolute inset-0 p-12 flex flex-col">
                <div className="flex justify-between items-center mb-20">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-cyber-purple animate-pulse shadow-[0_0_10px_#A855F7]" />
                    <span className="text-[11px] font-black text-white uppercase tracking-[0.4em]">2026 Wrapped</span>
                  </div>
                  <button onClick={() => setShowWrapped(false)} className="text-gray-400 hover:text-white transition-colors p-2">
                    <X size={32} />
                  </button>
                </div>
                
                <div className="flex-1 flex flex-col justify-center text-center space-y-16">
                  <div className="space-y-4">
                    <p className="text-gray-300 font-black uppercase tracking-[0.3em] text-[11px]">This year you captured</p>
                    <h4 className="text-9xl font-black text-white tracking-tighter cyber-gradient-text drop-shadow-2xl">{isStatsLoading ? "..." : stats?.totalNodes ?? 0}</h4>
                    <p className="text-gray-300 font-black uppercase tracking-[0.3em] text-[11px]">unforgettable memories</p>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-gray-300 font-black uppercase tracking-[0.3em] text-[11px]">Your most active hubs recorded</p>
                    <h4 className="text-5xl font-black text-white tracking-tighter">{isStatsLoading ? "..." : stats?.milestones ?? 0}</h4>
                    <p className="text-gray-300 font-black uppercase tracking-[0.3em] text-[11px]">milestone check-ins</p>
                  </div>

                  <div className="space-y-5">
                    <p className="text-gray-300 font-black uppercase tracking-[0.3em] text-[11px]">Your Legacy Vibe</p>
                    <div className="px-10 py-6 rounded-[2.5rem] bg-cyber-purple/25 border border-cyber-purple/40 mx-auto w-fit shadow-2xl">
                       <span className="text-3xl font-black text-white tracking-tighter uppercase italic">Midnight Architect</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pb-12">
                   <button className="w-full py-6 rounded-[2rem] bg-white text-black font-black uppercase tracking-[0.3em] text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all">
                      Share Post
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
