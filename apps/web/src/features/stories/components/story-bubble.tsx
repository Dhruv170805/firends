'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Camera, Plus, Loader2, X } from 'lucide-react';

import { StoryViewer, StoryItem } from './story-viewer';
import { User } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface StoryGroup {
  user: User;
  stories: StoryItem[];
}

export function StoryBubbleList() {
  const queryClient = useQueryClient();
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 1. Fetch stories list grouped by creator
  const { data: storyGroups, isLoading } = useQuery<StoryGroup[]>({
    queryKey: ['stories'],
    queryFn: () => apiFetch('/stories'),
  });

  // 2. Story creation mutation
  const createStoryMutation = useMutation({
    mutationFn: (newStory: { media_url: string; media_type: string }) =>
      apiFetch('/stories', {
        method: 'POST',
        body: JSON.stringify(newStory),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      setIsCreating(false);
      setImage(null);
      setImagePreview(null);
      toast.success('Story published successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to post story');
    },
  });

  const uploadImage = async (file: File) => {
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage
      .from('memories')
      .upload(fileName, file);

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('memories')
      .getPublicUrl(data.path);
      
    return publicUrl;
  };

  const handlePostStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return;

    setUploading(true);
    try {
      const uploadedUrl = await uploadImage(image);
      createStoryMutation.mutate({
        media_url: uploadedUrl,
        media_type: image.type.startsWith('video/') ? 'video' : 'image',
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload story asset');
    } finally {
      setUploading(false);
    }
  };

  const handleNextUser = () => {
    if (storyGroups && activeGroupIndex !== null && activeGroupIndex < storyGroups.length - 1) {
      setActiveGroupIndex(activeGroupIndex + 1);
    } else {
      setActiveGroupIndex(null);
    }
  };

  const handlePrevUser = () => {
    if (storyGroups && activeGroupIndex !== null && activeGroupIndex > 0) {
      setActiveGroupIndex(activeGroupIndex - 1);
    }
  };

  const activeGroup = storyGroups && activeGroupIndex !== null ? storyGroups[activeGroupIndex] : null;

  return (
    <div className="relative">
      <div className="flex gap-10 overflow-x-auto pb-10 scrollbar-hide">
        
        {/* Post Story Bubble */}
        <div className="flex flex-col items-center gap-4 flex-shrink-0 group">
          <button 
            onClick={() => setIsCreating(true)}
            className="w-24 h-24 rounded-[3rem] border-2 border-dashed border-white/20 flex items-center justify-center group-hover:border-cyber-purple group-hover:bg-cyber-purple/10 transition-all duration-500 cursor-pointer relative"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyber-purple to-cyber-pink text-white flex items-center justify-center shadow-2xl neon-glow-purple group-hover:scale-110 transition-transform">
              <Camera size={28} />
            </div>
            <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-cyber-purple border border-[#070B14] flex items-center justify-center text-white">
              <Plus size={14} strokeWidth={3} />
            </div>
          </button>
          <span className="text-[11px] font-black text-white uppercase tracking-widest">Add Story</span>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="w-24 h-24 flex items-center justify-center">
            <Loader2 className="animate-spin text-cyber-purple" size={24} />
          </div>
        )}

        {/* Stories groups rendering */}
        {storyGroups?.map((group: StoryGroup, idx: number) => (
          <div 
            key={group.user.id} 
            className="flex flex-col items-center gap-4 flex-shrink-0 group cursor-pointer"
            onClick={() => setActiveGroupIndex(idx)}
          >
            <div className="w-24 h-24 rounded-[3rem] p-[3px] bg-gradient-to-tr from-cyber-purple via-cyber-pink to-orange-500 group-hover:rotate-6 shadow-xl transition-all duration-500">
              <div className="w-full h-full rounded-[2.8rem] bg-cyber-dark p-[4px]">
                <div className="w-full h-full rounded-[2.4rem] bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
                  {group.user.avatar_url ? (
                    <img src={group.user.avatar_url} className="w-full h-full object-cover" alt={group.user.username} />
                  ) : (
                    <span className="text-2xl font-black text-gray-300 uppercase">{group.user.username.charAt(0)}</span>
                  )}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors">
              {group.user.username}
            </span>
          </div>
        ))}
      </div>

      {/* Modern Full-Screen Story Viewer Modal */}
      {activeGroup && (
        <StoryViewer
          user={activeGroup.user}
          stories={activeGroup.stories}
          onClose={() => setActiveGroupIndex(null)}
          onNextUser={handleNextUser}
          onPrevUser={handlePrevUser}
        />
      )}

      {/* Story Upload Popover Dialog */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fade-in">
          <div className="cyber-glass max-w-md w-full p-8 rounded-[2.5rem] neon-border border-white/20 space-y-6">
            <h3 className="text-2xl font-black text-white tracking-tight">Add a Story</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your story will be visible to friends for 24 hours.</p>
            
            <form onSubmit={handlePostStory} className="space-y-6">
              <div className="relative">
                {imagePreview ? (
                  <div className="relative rounded-[2rem] overflow-hidden aspect-[9/12] bg-white/10 border border-white/20 group shadow-2xl">
                    {image?.type.startsWith('video/') ? (
                      <video src={imagePreview} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                    ) : (
                      <img src={imagePreview} alt="Story Preview" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <button
                        type="button"
                        onClick={() => { setImage(null); setImagePreview(null); }}
                        className="bg-white/25 backdrop-blur-xl p-4 rounded-full text-white hover:bg-white/40 transition-all border border-white/30 cursor-pointer"
                      >
                        <X size={24} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-[9/12] rounded-[2rem] border-2 border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center gap-4 text-gray-400 hover:bg-white/10 transition-all group cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform neon-glow-purple border border-white/10">
                      <Camera size={32} className="text-cyber-purple" />
                    </div>
                    <div className="text-center px-6">
                      <span className="block font-black text-white text-sm tracking-tight mb-1">Add Media</span>
                      <span className="text-sm font-bold opacity-60">Choose a photo or video (Max 50MB)</span>
                    </div>
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*,video/*"
                  disabled={uploading || createStoryMutation.isPending}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImage(file);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImagePreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  disabled={uploading || createStoryMutation.isPending || !image}
                  className="flex-1 py-4 bg-gradient-to-r from-cyber-purple to-cyber-pink text-white rounded-2xl text-xs font-black uppercase tracking-widest neon-glow-purple transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer flex justify-center items-center gap-2"
                >
                  {(uploading || createStoryMutation.isPending) ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    'Post Story'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setImage(null);
                    setImagePreview(null);
                  }}
                  className="flex-1 py-4 border border-white/10 bg-white/5 text-gray-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
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
