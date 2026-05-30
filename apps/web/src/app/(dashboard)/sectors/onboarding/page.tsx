'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Users, Plus, Key, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function OnboardingPage() {
  const [mode, setMode] = useState<'selection' | 'create' | 'join'>('selection');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Join States
  const [inviteCode, setInviteCode] = useState('');

  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const newSector = await apiFetch('/sectors', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });

      toast.success(`Group "${newSector.name}" created successfully!`);
      // Redirect to home feed
      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error('Error creating group:', err);
      setError(err.message || 'Failed to create group.');
      toast.error(err.message || 'Failed to create group.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    // Quick regex validation for UUID v4
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(inviteCode.trim())) {
      setError('Invalid Access Code format. Code must be a valid UUID.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const sector = await apiFetch('/sectors/join', {
        method: 'POST',
        body: JSON.stringify({
          inviteCode: inviteCode.trim(),
        }),
      });

      toast.success(`Joined group "${sector.name}" successfully!`);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error('Error joining group:', err);
      setError(err.message || 'Failed to join group. Verify the code.');
      toast.error(err.message || 'Failed to join group.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-6 animate-fade-in">
      <div className="w-full max-w-xl space-y-8 cyber-glass p-8 sm:p-12 rounded-[3.5rem] border border-white/20 relative z-10 shadow-2xl">
        
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center relative mb-6 h-16">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyber-purple via-cyber-pink to-orange-500 flex items-center justify-center shadow-lg neon-glow-purple rotate-12 absolute animate-pulse" />
            <div className="w-12 h-12 rounded-xl bg-cyber-dark/80 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-inner relative z-10">
              <span className="text-xl font-black italic tracking-tighter text-white select-none">L²</span>
            </div>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white mb-2">
            Choose Your Group
          </h2>
          <p className="text-gray-400 font-semibold text-xs leading-relaxed max-w-sm mx-auto">
            To start sharing memories, you must join a private group. Groups keep your memories visible only to friends you choose.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-950/40 p-4 text-xs text-red-400 font-bold flex items-center gap-3 border border-red-500/20">
            <AlertCircle size={16} className="text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Mode Selector / Main Onboarding Forms */}
        {mode === 'selection' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            {/* Create Sector Card */}
            <button
              onClick={() => {
                setMode('create');
                setError(null);
              }}
              className="flex flex-col items-center justify-center text-center p-8 rounded-3xl border border-white/10 bg-white/5 hover:bg-gradient-to-tr hover:from-cyber-purple/20 hover:to-cyber-pink/10 hover:border-cyber-purple/40 hover:scale-[1.03] transition-all duration-300 group shadow-lg"
            >
              <div className="w-14 h-14 bg-cyber-purple/10 border border-cyber-purple/20 text-cyber-purple rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                <Plus size={24} />
              </div>
              <h3 className="text-lg font-black text-white mb-2 tracking-tight group-hover:text-cyber-purple transition-colors">
                Create a Group
              </h3>
              <p className="text-gray-400 font-semibold text-[11px] leading-normal">
                Create a new private group. You will be the leader and can invite your classmates or friends.
              </p>
            </button>

            {/* Join Sector Card */}
            <button
              onClick={() => {
                setMode('join');
                setError(null);
              }}
              className="flex flex-col items-center justify-center text-center p-8 rounded-3xl border border-white/10 bg-white/5 hover:bg-gradient-to-tr hover:from-cyber-pink/20 hover:to-cyber-purple/10 hover:border-cyber-pink/40 hover:scale-[1.03] transition-all duration-300 group shadow-lg"
            >
              <div className="w-14 h-14 bg-cyber-pink/10 border border-cyber-pink/20 text-cyber-pink rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                <Key size={24} />
              </div>
              <h3 className="text-lg font-black text-white mb-2 tracking-tight group-hover:text-cyber-pink transition-colors">
                Join with Code
              </h3>
              <p className="text-gray-400 font-semibold text-[11px] leading-normal">
                Join an existing group using a secure code shared by the group leader.
              </p>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="sector-name" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                Group Name *
              </label>
              <input
                id="sector-name"
                type="text"
                placeholder="e.g. Batch of 2008, Study Group..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white placeholder-gray-500 focus:border-cyber-purple transition-all outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="sector-desc" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                Group Description
              </label>
              <textarea
                id="sector-desc"
                placeholder="Describe who is in this group..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white placeholder-gray-500 focus:border-cyber-purple transition-all outline-none resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1 bg-gradient-to-r from-cyber-purple to-cyber-pink text-white py-4.5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all text-xs flex items-center justify-center gap-2 shadow-lg neon-glow-purple cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Create Group</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setMode('selection')}
                className="px-6 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl font-black uppercase tracking-widest transition-all text-xs"
                disabled={loading}
              >
                Back
              </button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="invite-code" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                Group Invite Code *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-500">
                  <Key size={16} />
                </div>
                <input
                  id="invite-code"
                  type="text"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white placeholder-gray-500 focus:border-cyber-pink transition-all outline-none"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <p className="text-[10px] font-semibold text-gray-500 px-1">
                Enter the code shared by your group leader.
              </p>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="submit"
                disabled={loading || !inviteCode.trim()}
                className="flex-1 bg-gradient-to-r from-cyber-pink to-cyber-purple text-white py-4.5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all text-xs flex items-center justify-center gap-2 shadow-lg neon-glow-pink cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Users size={14} />
                    <span>Join Group</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setMode('selection')}
                className="px-6 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl font-black uppercase tracking-widest transition-all text-xs"
                disabled={loading}
              >
                Back
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
