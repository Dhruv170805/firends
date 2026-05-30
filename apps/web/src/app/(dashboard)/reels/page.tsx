'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Loader2, Heart, MessageCircle, Share2, Music, User, X, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Post } from '@/types';

const ReelItem = ({ post }: { post: Post }) => {
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const options = { threshold: 0.8 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(() => {});
        } else {
          videoRef.current?.pause();
          if (videoRef.current) videoRef.current.currentTime = 0;
        }
      });
    }, options);

    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  const mediaUrl = post.media?.[0]?.media_url;
  const isVideo = post.media?.[0]?.media_type === 'video' || mediaUrl?.endsWith('.mp4');

  return (
    <div className="h-full w-full snap-start relative bg-[#070B14] flex items-center justify-center overflow-hidden border-b border-white/5">
      {isVideo && mediaUrl ? (
        <video
          ref={videoRef}
          src={mediaUrl}
          className="h-full w-full object-cover"
          loop
          playsInline
          muted
        />
      ) : mediaUrl ? (
        <img 
          src={mediaUrl} 
          className="h-full w-full object-cover opacity-80" 
          alt="Post Media"
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-cyber-dark">
          <span className="text-gray-500 uppercase tracking-widest text-xs font-black">No Media</span>
        </div>
      )}
      
      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

      {/* Right Actions - High Contrast */}
      <div className="absolute right-6 bottom-40 flex flex-col gap-8 items-center z-20">
        <div className="flex flex-col items-center gap-2 group">
          <button 
            className={cn(
              "w-14 h-14 rounded-full backdrop-blur-3xl border-2 flex items-center justify-center transition-all shadow-2xl cursor-pointer",
              isLiked 
                ? "bg-cyber-pink text-white border-cyber-pink neon-glow-pink scale-110" 
                : "bg-white/10 text-white border-white/20 hover:bg-white/20"
            )}
            onClick={async () => {
              const previousIsLiked = isLiked;
              const previousLikesCount = likesCount;
              setIsLiked(!isLiked);
              setLikesCount((prev: number) => isLiked ? prev - 1 : prev + 1);
              try {
                await apiFetch(`/interactions/like/${post.id}`, { method: 'POST' });
              } catch (error) {
                setIsLiked(previousIsLiked);
                setLikesCount(previousLikesCount);
              }
            }}
          >
            <Heart size={32} className={isLiked ? "fill-current" : ""} />
          </button>
          <span className="text-xs font-black text-white uppercase tracking-widest drop-shadow-lg">{likesCount}</span>
        </div>

        <div className="flex flex-col items-center gap-2 group">
          <button className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-3xl border-2 border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-2xl">
            <MessageCircle size={32} />
          </button>
          <span className="text-xs font-black text-white uppercase tracking-widest drop-shadow-lg">{post.comments_count || 0}</span>
        </div>

        <button className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-3xl border-2 border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-2xl">
          <Share2 size={28} />
        </button>

        <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-3xl border-2 border-white/20 flex items-center justify-center animate-spin-slow shadow-2xl">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyber-purple to-cyber-pink p-0.5">
            <div className="w-full h-full rounded-full bg-[#070B14] flex items-center justify-center">
              <Music size={16} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Info - Readability Focus */}
      <div className="absolute left-6 right-24 bottom-10 space-y-5 z-20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-3xl border-2 border-white/30 flex items-center justify-center overflow-hidden shadow-2xl">
             {post.user?.avatar_url ? (
                <img src={post.user.avatar_url} className="w-full h-full object-cover" alt="User" />
             ) : (
                <User size={28} className="text-white" />
             )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <span className="font-black text-white tracking-tighter text-2xl drop-shadow-lg">{post.user?.username || 'User'}</span>
              <button className="px-5 py-2 rounded-xl bg-cyber-purple/80 backdrop-blur-xl text-[11px] font-black text-white uppercase tracking-widest hover:bg-cyber-purple transition-all shadow-lg cursor-pointer">
                Follow
              </button>
            </div>
            {post.location && (
              <div className="flex items-center gap-1.5 text-gray-300 font-bold uppercase tracking-widest text-[10px] mt-1.5">
                 <MapPin size={12} className="text-cyber-pink" />
                 <span>{post.location}</span>
              </div>
            )}
          </div>
        </div>
        <p className="text-white text-lg font-bold line-clamp-3 leading-relaxed drop-shadow-lg">
          {post.caption}
        </p>
        <div className="flex items-center gap-3 text-white/80 bg-white/5 backdrop-blur-xl w-fit px-4 py-2 rounded-full border border-white/10">
          <Music size={14} className="animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest truncate max-w-[200px]">Original Post • {post.user?.username || 'User'}</span>
        </div>
      </div>
    </div>
  );
};

export default function LegacyReelsPage() {
  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ['reels'],
    queryFn: () => apiFetch('/posts?limit=20'),
  });

  const mediaPosts = posts?.filter((p: Post) => p.media && p.media.length > 0) || [];

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-140px)] w-full flex items-center justify-center bg-[#070B14] rounded-[4rem]">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="w-12 h-12 animate-spin text-cyber-purple" />
          <span className="text-xs font-black text-gray-500 uppercase tracking-[0.5em]">Loading Feed...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 md:z-auto md:relative md:h-[calc(100vh-140px)] overflow-y-scroll snap-y snap-mandatory scrollbar-hide md:rounded-[4rem] md:shadow-[0_0_100px_rgba(0,0,0,0.9)]">
      {mediaPosts.length > 0 ? (
        mediaPosts.map((post: Post) => (
          <ReelItem key={post.id} post={post} />
        ))
      ) : (
        <div className="h-full w-full flex items-center justify-center text-center p-20">
           <div className="space-y-6">
             <div className="w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center mx-auto">
                <Music size={40} className="text-gray-700" />
             </div>
             <h3 className="text-3xl font-black text-white tracking-tighter">No Videos Found</h3>
             <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Be the first to upload a video or photo to the feed.</p>
           </div>
        </div>
      )}
      
      {/* Mobile Close Button */}
      <button 
        onClick={() => window.history.back()}
        className="md:hidden absolute top-10 left-8 z-50 w-14 h-14 rounded-[2rem] bg-black/40 backdrop-blur-3xl border-2 border-white/20 flex items-center justify-center text-white shadow-2xl active:scale-90 transition-transform"
      >
        <X size={32} />
      </button>
    </div>
  );
}
