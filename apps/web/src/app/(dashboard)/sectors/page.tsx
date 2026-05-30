'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Post } from '@/types';
import { PostCard } from '@/features/feed/components/post-card';
import { CyberCard } from '@/components/ui/cyber-card';
import { 
  Users, 
  Plus, 
  Settings, 
  UserPlus, 
  MessageSquare, 
  Lock, 
  ShieldAlert, 
  X, 
  Send, 
  Loader2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useActiveGroup } from '@/hooks/use-active-group';

interface Sector {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  user_role: 'leader' | 'member';
}

interface SectorMember {
  id: string;
  role: 'leader' | 'member';
  created_at: string;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
    bio: string | null;
  };
}

export default function SectorsPage() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [activeSector, setActiveSector] = useState<Sector | null>(null);
  const { activeGroup, changeGroup } = useActiveGroup();
  const [activeTab, setActiveTab] = useState<'feed' | 'members'>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<SectorMember[]>([]);
  
  // Loading states
  const [loadingSectors, setLoadingSectors] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSectorName, setNewSectorName] = useState('');
  const [newSectorDesc, setNewSectorDesc] = useState('');
  const [submittingSector, setSubmittingSector] = useState(false);

  const [inviteUsername, setInviteUsername] = useState('');
  const [submittingInvite, setSubmittingInvite] = useState(false);

  // Fetch all sectors
  const fetchSectors = async () => {
    setLoadingSectors(true);
    try {
      const data = await apiFetch('/sectors');
      setSectors(data || []);
      
      // Auto-select active group or first group if available
      if (data && data.length > 0) {
        const savedGroup = localStorage.getItem('activeGroup');
        let activeId = activeGroup?.id;
        if (!activeId && savedGroup) {
          try { activeId = JSON.parse(savedGroup).id; } catch {}
        }
        const matched = data.find((s: Sector) => s.id === activeId);
        if (matched) {
          setActiveSector(matched);
        } else if (!activeSector) {
          setActiveSector(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load groups.');
    } finally {
      setLoadingSectors(false);
    }
  };

  useEffect(() => {
    fetchSectors();
  }, []);

  // Sync local activeSector with global activeGroup
  useEffect(() => {
    if (activeSector) {
      if (!activeGroup || activeGroup.id !== activeSector.id) {
        changeGroup({ id: activeSector.id, name: activeSector.name });
      }
    }
  }, [activeSector]);

  useEffect(() => {
    if (activeGroup) {
      const matched = sectors.find((s) => s.id === activeGroup.id);
      if (matched && (!activeSector || activeSector.id !== activeGroup.id)) {
        setActiveSector(matched);
      }
    }
  }, [activeGroup, sectors]);

  // Fetch active sector posts & members
  useEffect(() => {
    if (!activeSector) {
      setPosts([]);
      setMembers([]);
      return;
    }

    const fetchSectorPosts = async () => {
      setLoadingPosts(true);
      try {
        const data = await apiFetch(`/sectors/${activeSector.id}/posts`);
        setPosts(data || []);
      } catch (error) {
        console.error('Error fetching group posts:', error);
        toast.error('Failed to load group posts.');
      } finally {
        setLoadingPosts(false);
      }
    };

    const fetchSectorMembers = async () => {
      setLoadingMembers(true);
      try {
        const data = await apiFetch(`/sectors/${activeSector.id}/members`);
        setMembers(data || []);
      } catch (error) {
        console.error('Error fetching group members:', error);
        toast.error('Failed to load group members.');
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchSectorPosts();
    fetchSectorMembers();
  }, [activeSector]);

  // Create sector handler
  const handleCreateSector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectorName.trim()) return;

    setSubmittingSector(true);
    try {
      const newSector = await apiFetch('/sectors', {
        method: 'POST',
        body: JSON.stringify({
          name: newSectorName,
          description: newSectorDesc || undefined,
        }),
      });

      toast.success(`Group "${newSector.name}" created!`);
      setNewSectorName('');
      setNewSectorDesc('');
      setShowCreateModal(false);
      
      // Refresh list and select the new sector
      const updatedSectors = await apiFetch('/sectors');
      setSectors(updatedSectors || []);
      const created = updatedSectors.find((s: Sector) => s.id === newSector.id);
      if (created) setActiveSector(created);

    } catch (error: any) {
      console.error('Error creating group:', error);
      toast.error(error.message || 'Failed to create group.');
    } finally {
      setSubmittingSector(false);
    }
  };

  // Invite member handler
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername.trim() || !activeSector) return;

    setSubmittingInvite(true);
    try {
      const added = await apiFetch(`/sectors/${activeSector.id}/members`, {
        method: 'POST',
        body: JSON.stringify({ username: inviteUsername.trim() }),
      });

      toast.success(`User "${inviteUsername}" added to ${activeSector.name}!`);
      setInviteUsername('');
      
      // Refresh members list
      const updatedMembers = await apiFetch(`/sectors/${activeSector.id}/members`);
      setMembers(updatedMembers || []);
    } catch (error: any) {
      console.error('Error inviting member:', error);
      toast.error(error.message || 'Failed to add user to group.');
    } finally {
      setSubmittingInvite(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Users className="text-cyber-purple animate-pulse" size={28} />
            <h2 className="text-4xl font-black text-white tracking-tighter">Private Groups</h2>
          </div>
          <p className="text-gray-400 font-bold text-sm tracking-tight">
            Private groups to share memories with your close friends and family.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyber-purple to-cyber-pink text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-lg neon-glow-purple text-xs self-start sm:self-center"
        >
          <Plus size={16} />
          <span>New Group</span>
        </button>
      </header>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Sectors List */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] px-2">My Groups</h3>
          
          {loadingSectors ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="cyber-glass p-6 rounded-3xl border border-white/5 animate-pulse h-24" />
              ))}
            </div>
          ) : sectors.length === 0 ? (
            <div className="cyber-glass rounded-3xl p-8 text-center border border-white/10">
              <Lock className="text-gray-600 mx-auto mb-4" size={32} />
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest leading-relaxed">
                No groups found. Create a group to start sharing privately with friends.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {sectors.map((sector) => {
                const isActive = activeSector?.id === sector.id;
                return (
                  <button
                    key={sector.id}
                    onClick={() => {
                      setActiveSector(sector);
                      setActiveTab('feed');
                    }}
                    className={cn(
                      "w-full text-left p-6 rounded-3xl border transition-all duration-300 relative group overflow-hidden",
                      isActive
                        ? "bg-gradient-to-tr from-cyber-purple/20 to-cyber-pink/10 border-cyber-purple/50 shadow-[0_0_25px_rgba(168,85,247,0.15)]"
                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                    )}
                  >
                    {isActive && (
                      <div className="absolute right-0 top-0 h-full w-[4px] bg-gradient-to-b from-cyber-purple to-cyber-pink" />
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-black text-white text-lg tracking-tight group-hover:text-cyber-pink transition-colors">
                        {sector.name}
                      </h4>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border",
                        sector.user_role === 'leader'
                          ? "bg-cyber-pink/20 text-cyber-pink border-cyber-pink/30 shadow-[0_0_10px_rgba(236,72,153,0.15)]"
                          : "bg-white/10 text-gray-300 border-white/10"
                      )}>
                        {sector.user_role}
                      </span>
                    </div>
                    <p className="text-gray-400 font-semibold text-xs line-clamp-2 leading-relaxed">
                      {sector.description || "No group description."}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Active Sector View */}
        <div className="lg:col-span-8 space-y-6">
          {activeSector ? (
            <div className="space-y-6">
              {/* Active Sector Card */}
              <CyberCard className="p-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                  <div className="space-y-3">
                    <h3 className="text-3xl font-black text-white tracking-tighter">{activeSector.name}</h3>
                    <p className="text-gray-400 font-semibold text-sm leading-relaxed">
                      {activeSector.description || "Members can see and share posts in this group."}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setActiveTab('feed')}
                      className={cn(
                        "px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all",
                        activeTab === 'feed'
                          ? "bg-cyber-purple text-white border-cyber-purple neon-glow-purple"
                          : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                      )}
                    >
                      Feed
                    </button>
                    <button
                      onClick={() => setActiveTab('members')}
                      className={cn(
                        "px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all",
                        activeTab === 'members'
                          ? "bg-cyber-purple text-white border-cyber-purple neon-glow-purple"
                          : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                      )}
                    >
                      Members ({members.length})
                    </button>
                  </div>
                </div>

                {/* Tab Content: Feed */}
                {activeTab === 'feed' && (
                  <div className="space-y-8">
                    {loadingPosts ? (
                      <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 text-cyber-purple animate-spin" />
                      </div>
                    ) : posts.length === 0 ? (
                      <div className="text-center py-20 border border-dashed border-white/10 rounded-[2.5rem] bg-white/5">
                        <Sparkles className="text-gray-600 mx-auto mb-4" size={32} />
                        <h4 className="text-lg font-black text-white mb-2 tracking-tight">Group Feed Empty</h4>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest max-w-xs mx-auto leading-relaxed mb-6">
                          No posts inside this group yet. Create a post and share it here!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {posts.map((post, index) => (
                          <PostCard 
                            key={post.id} 
                            post={post}
                            isFirst={index === 0}
                            isLast={index === posts.length - 1}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab Content: Members */}
                {activeTab === 'members' && (
                  <div className="space-y-8 animate-fade-in">
                    {/* Add Member (Leader Only) */}
                    {activeSector.user_role === 'leader' && (
                      <div className="p-6 rounded-[2rem] border border-white/10 bg-white/5 shadow-inner">
                        <h4 className="font-black text-white text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                          <UserPlus size={16} className="text-cyber-pink animate-pulse" />
                          <span>Add Member</span>
                        </h4>
                        <form onSubmit={handleInviteMember} className="flex gap-4">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              placeholder="Enter username..."
                              className="w-full bg-cyber-dark/80 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white placeholder-gray-500 focus:border-cyber-purple transition-all outline-none"
                              value={inviteUsername}
                              onChange={(e) => setInviteUsername(e.target.value)}
                              required
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={submittingInvite || !inviteUsername.trim()}
                            className="bg-cyber-purple text-white px-6 rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 disabled:opacity-50 transition-all text-xs flex items-center gap-2 shadow-md hover:shadow-cyber-purple/20"
                          >
                            {submittingInvite ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Plus size={14} />
                                <span>Add</span>
                              </>
                            )}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Members List */}
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em] px-1">Group Members</h4>
                      
                      {loadingMembers ? (
                        <div className="flex justify-center py-10">
                          <Loader2 className="w-8 h-8 text-cyber-purple animate-spin" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {members.map((member) => (
                            <div 
                              key={member.id}
                              className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                            >
                              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center">
                                {member.user.avatar_url ? (
                                  <img src={member.user.avatar_url} alt={member.user.username} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-lg font-black text-gray-300 uppercase">{member.user.username.charAt(0)}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-black text-white text-sm truncate leading-none mb-1.5">
                                  {member.user.username}
                                </h5>
                                <span className={cn(
                                  "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
                                  member.role === 'leader'
                                    ? "bg-cyber-pink/20 text-cyber-pink border-cyber-pink/20"
                                    : "bg-white/10 text-gray-400 border-white/5"
                                )}>
                                  {member.role === 'leader' ? 'Leader' : 'Member'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CyberCard>
            </div>
          ) : (
            <div className="cyber-glass rounded-[4rem] p-32 text-center neon-border flex flex-col items-center justify-center min-h-[50vh]">
              <div className="w-28 h-28 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
                <Lock className="text-gray-600" size={44} />
              </div>
              <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Select a Group</h3>
              <p className="text-gray-400 font-bold max-w-sm mx-auto uppercase tracking-[0.3em] text-[11px] leading-relaxed">
                Select a group from the list to view its feed and members.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Sector Modal (Cyber-Glass styled dialog) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="cyber-glass w-full max-w-lg rounded-[2.5rem] border border-white/15 shadow-2xl overflow-hidden neon-border animate-scale-up">
            {/* Modal Header */}
            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-3">
                <Users className="text-cyber-pink" size={24} />
                <h3 className="text-2xl font-black text-white tracking-tight">Create Group</h3>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSector} className="p-8 space-y-6">
              <div className="space-y-2">
                <label htmlFor="sectorName" className="block text-[10px] font-black text-white uppercase tracking-[0.3em] px-1">
                  Group Name
                </label>
                <input
                  id="sectorName"
                  type="text"
                  placeholder="e.g. Delta Pod, Batch of '08..."
                  maxLength={100}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white placeholder-gray-500 focus:border-cyber-purple transition-all outline-none"
                  value={newSectorName}
                  onChange={(e) => setNewSectorName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="sectorDesc" className="block text-[10px] font-black text-white uppercase tracking-[0.3em] px-1">
                  Group Description
                </label>
                <textarea
                  id="sectorDesc"
                  placeholder="Describe what this group is for..."
                  maxLength={500}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white placeholder-gray-500 focus:border-cyber-purple transition-all outline-none resize-none"
                  value={newSectorDesc}
                  onChange={(e) => setNewSectorDesc(e.target.value)}
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="submit"
                  disabled={submittingSector || !newSectorName.trim()}
                  className="flex-1 bg-gradient-to-r from-cyber-purple to-cyber-pink text-white py-4 rounded-2xl font-black uppercase tracking-[0.15em] hover:scale-[1.03] active:scale-95 disabled:opacity-50 transition-all text-xs shadow-lg neon-glow-purple flex items-center justify-center gap-2"
                >
                  {submittingSector ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Create Group</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl font-black uppercase tracking-widest transition-all text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
