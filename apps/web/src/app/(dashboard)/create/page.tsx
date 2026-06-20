'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Camera, MapPin, Send, X, Image as ImageIcon, Globe, Lock, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useActiveGroup } from '@/hooks/use-active-group';

export default function CreatePostPage() {
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [sectors, setSectors] = useState<any[]>([]);
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeGroup } = useActiveGroup();

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const data = await apiFetch('/sectors');
        setSectors(data || []);
      } catch (err) {
        console.error('Failed to load sectors', err);
      }
    };
    fetchSectors();
  }, []);

  useEffect(() => {
    if (activeGroup) {
      setSelectedSectorId(activeGroup.id);
    }
  }, [activeGroup]);

  const CAMPUS_HOTSPOTS = [
    { name: 'Main Quad', lat: 37.4275, lng: -122.1697 },
    { name: 'Memorial Library', lat: 37.4282, lng: -122.1688 },
    { name: 'Engineering Arch', lat: 37.4290, lng: -122.1720 },
    { name: 'Student Union', lat: 37.4265, lng: -122.1705 },
    { name: 'University Stadium', lat: 37.4346, lng: -122.1611 },
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption) return;

    setLoading(true);
    setError(null);
    try {
      let mediaUrl = null;
      if (image) {
        mediaUrl = await uploadImage(image);
      }

      await apiFetch('/posts', {
        method: 'POST',
        body: JSON.stringify({
          caption,
          location,
          latitude: coords?.lat,
          longitude: coords?.lng,
          visibility,
          sector_id: selectedSectorId || null,
          media: mediaUrl ? [{
            media_url: mediaUrl,
            media_type: image?.type.startsWith('video/') ? 'video' : 'image'
          }] : []
        }),
      });
      
      toast.success('Post archived in your timeline!');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      router.push('/');
    } catch (err: any) {
      console.error('Error creating post:', err);
      toast.error(err.message || 'Failed to archive post');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <header className="mb-14">
        <div className="flex items-center gap-4 mb-3">
          <Camera className="text-cyber-purple drop-shadow-lg" size={32} />
          <h2 className="text-5xl font-black text-white tracking-tighter">Create Post</h2>
        </div>
        <p className="text-gray-300 font-bold text-lg tracking-tight">Share a new post to your college timeline.</p>
      </header>

      <div className="cyber-glass rounded-[3rem] overflow-hidden neon-border shadow-2xl">
        <form onSubmit={handleCreatePost} className="p-12">

          {error && (
            <div className="mb-10 rounded-2xl bg-red-500/20 border border-red-500/40 p-5 text-sm font-bold text-red-100">
              {error}
            </div>
          )}

          <div className="space-y-10">
            <div className="relative">
              {imagePreview ? (
                <div className="relative rounded-[2.5rem] overflow-hidden aspect-video bg-white/10 border border-white/20 group shadow-2xl">
                  {image?.type.startsWith('video/') ? (
                    <video src={imagePreview} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                  ) : (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => { setImage(null); setImagePreview(null); }}
                      className="bg-white/20 backdrop-blur-xl p-5 rounded-full text-white hover:bg-white/30 transition-all border border-white/30 shadow-2xl"
                    >
                      <X size={32} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-video rounded-[2.5rem] border-2 border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center gap-6 text-gray-400 hover:bg-white/10 transition-all group shadow-inner"
                >
                  <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform neon-glow-purple border border-white/10">
                    <ImageIcon size={40} className="text-cyber-purple" />
                  </div>
                  <div className="text-center">
                    <span className="block font-black text-white text-xl tracking-tight mb-1">Add Media</span>
                    <span className="text-sm font-bold opacity-60">Upload a photo or video (Max 50MB)</span>
                  </div>
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*"
                onChange={handleImageChange}
              />
            </div>

            <div>
              <label htmlFor="caption" className="block text-[11px] font-black text-white uppercase tracking-[0.4em] mb-4 px-2">
                Caption
              </label>
              <textarea
                id="caption"
                rows={4}
                required
                className="block w-full rounded-3xl border border-white/15 bg-white/5 px-8 py-6 text-white placeholder-gray-500 focus:border-cyber-purple focus:ring-2 focus:ring-cyber-purple/20 sm:text-xl font-semibold transition-all shadow-inner outline-none"
                placeholder="Write about this post..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>

            <div className="space-y-6">
              <label className="block text-[11px] font-black text-white uppercase tracking-[0.4em] px-2">
                Location (Campus Hotspots)
              </label>
              <div className="flex flex-wrap gap-3">
                {CAMPUS_HOTSPOTS.map((spot) => (
                  <button
                    key={spot.name}
                    type="button"
                    onClick={() => {
                      setLocation(spot.name);
                      setCoords({ lat: spot.lat, lng: spot.lng });
                    }}
                    className={cn(
                      "px-6 py-3 rounded-2xl border transition-all font-bold text-xs uppercase tracking-widest shadow-md",
                      location === spot.name 
                        ? "bg-cyber-pink text-white border-cyber-pink neon-glow-pink" 
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                    )}
                  >
                    {spot.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-white uppercase tracking-[0.4em] mb-4 px-2">
                Share To
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-gray-400">
                  <Users size={24} className="text-cyber-purple animate-pulse" />
                </div>
                <select
                  className="block w-full rounded-2xl border border-white/15 bg-cyber-dark/80 px-8 py-6 text-white placeholder-gray-500 focus:border-cyber-purple focus:ring-2 focus:ring-cyber-purple/20 sm:text-lg font-bold transition-all shadow-inner outline-none appearance-none cursor-pointer"
                  value={selectedSectorId || 'public'}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedSectorId(val === 'public' ? null : val);
                  }}
                >
                  <option value="public" className="bg-cyber-dark text-white font-bold">Public Feed</option>
                  {sectors.map((sector) => (
                    <option key={sector.id} value={sector.id} className="bg-cyber-dark text-white font-bold">
                      Group: {sector.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-8 text-white">
                  <svg className="fill-current h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <label htmlFor="location" className="block text-[11px] font-black text-white uppercase tracking-[0.4em] mb-4 px-2">
                  Custom Location
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-gray-400">
                    <MapPin size={24} className="text-cyber-pink" />
                  </div>
                  <input
                    id="location"
                    type="text"
                    className="block w-full rounded-2xl border border-white/15 bg-white/5 pl-16 pr-8 py-6 text-white placeholder-gray-500 focus:border-cyber-purple focus:ring-2 focus:ring-cyber-purple/20 sm:text-lg font-bold transition-all shadow-inner outline-none"
                    placeholder="Where was this taken?..."
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      if (!CAMPUS_HOTSPOTS.find(s => s.name === e.target.value)) setCoords(null);
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-white uppercase tracking-[0.4em] mb-4 px-2">
                  Visibility
                </label>
                <div className="flex gap-4">
                  {selectedSectorId ? (
                    <div className="flex-1 flex items-center justify-center gap-3 py-6 rounded-2xl border border-white/10 bg-white/5 font-black text-xs uppercase tracking-widest text-cyber-pink neon-glow-pink">
                      <Lock size={20} className="animate-pulse" />
                      <span>Group Only</span>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setVisibility('public')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-3 py-6 rounded-2xl border transition-all font-black text-xs uppercase tracking-widest shadow-lg",
                          visibility === 'public' 
                            ? "bg-cyber-purple text-white border-cyber-purple neon-glow-purple" 
                            : "bg-white/5 border-white/10 text-gray-500 hover:bg-white/10"
                        )}
                      >
                        <Globe size={20} />
                        <span>Public</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisibility('private')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-3 py-6 rounded-2xl border transition-all font-black text-xs uppercase tracking-widest shadow-lg",
                          visibility === 'private' 
                            ? "bg-cyber-purple text-white border-cyber-purple neon-glow-purple" 
                            : "bg-white/5 border-white/10 text-gray-500 hover:bg-white/10"
                        )}
                      >
                        <Lock size={20} />
                        <span>Private</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-8 flex flex-col sm:flex-row gap-5">
              <button
                type="submit"
                disabled={loading || !caption}
                className="flex-1 inline-flex justify-center items-center gap-4 bg-gradient-to-r from-cyber-purple to-cyber-pink text-white px-12 py-6 rounded-2xl font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-2xl neon-glow-purple text-sm"
              >
                {loading ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : (
                  <>
                    <Send size={24} />
                    <span>Share Post</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex justify-center items-center px-12 py-6 rounded-2xl font-black text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/10 uppercase tracking-widest text-sm"
              >
                Discard
              </button>
            </div>
          </div>
        </form>

        <div className="bg-white/5 border-t border-white/10 px-12 py-6 flex items-center gap-5 text-[11px] text-gray-300 font-black uppercase tracking-[0.3em]">
          <div className="flex items-center gap-3">
            <div className={cn("w-2.5 h-2.5 rounded-full", visibility === 'public' ? "bg-cyber-purple animate-pulse shadow-[0_0_8px_#A855F7]" : "bg-orange-500 shadow-[0_0_8px_orange]")} />
            <span>
              {visibility === 'public' 
                ? "Post Status: Sharing to public feed" 
                : "Post Status: visible only to you"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
