import React, { useState } from 'react';
import { Post } from '@/types';
import { apiFetch } from '@/lib/api';
import { MapPin, MoreHorizontal, Heart, MessageCircle, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CyberCard } from '@/components/ui/cyber-card';
import { CommentsModal } from './comments-modal';

interface PostCardProps {
  post: Post;
  isFirst?: boolean;
  isLast?: boolean;
}

export function PostCard({ post, isLast }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount((prev: number) => newLiked ? prev + 1 : prev - 1);
    try {
      const response = await apiFetch(`/interactions/like/${post.id}`, { method: 'POST' });
      setIsLiked(response.liked);
    } catch {
      setIsLiked(!newLiked);
      setLikesCount((prev: number) => !newLiked ? prev + 1 : prev - 1);
    } finally {
      setIsLiking(false);
    }
  };

  const formattedDate = new Date(post.created_at).toLocaleDateString(undefined, { 
    year: 'numeric',
    month: 'short', 
    day: 'numeric' 
  });

  const getNostalgicLabel = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffDays = Math.floor((now.getTime() - past.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} Days Ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} Weeks Ago`;
    return `${Math.floor(diffDays / 30)} Months Ago`;
  };

  return (
    <div className="relative pl-14 md:pl-24 pb-20 group">
      {/* Timeline Connector */}
      {!isLast && (
        <div className="absolute left-[13px] md:left-[21px] top-10 bottom-0 w-[2px] bg-gradient-to-b from-cyber-purple/60 via-cyber-pink/30 to-transparent animate-pulse" />
      )}
      
      {/* Timeline Node Dot */}
      <div className="absolute left-0 top-1 w-7 h-7 md:w-11 md:h-11 rounded-full bg-cyber-dark border-2 border-cyber-purple flex items-center justify-center shadow-[0_0_25px_rgba(168,85,247,0.7)] z-10 group-hover:scale-125 transition-transform duration-700">
        <div className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full bg-cyber-purple animate-pulse shadow-[0_0_15px_#A855F7]" />
      </div>

      {/* Date Marker - Nostalgic Style */}
      <div className="absolute left-[50px] md:left-[90px] -top-1 flex gap-3 items-center">
        <span className="text-[11px] md:text-xs font-black text-white uppercase tracking-[0.3em] bg-cyber-purple/20 px-4 py-1.5 rounded-full border border-cyber-purple/30 shadow-sm backdrop-blur-xl">
          {getNostalgicLabel(post.created_at)}
        </span>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest opacity-60">
          • {formattedDate}
        </span>
      </div>

      <CyberCard className="mt-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center shadow-lg group-hover:rotate-3 transition-transform duration-500">
              {post.user?.avatar_url ? (
                <img src={post.user.avatar_url} alt={post.user.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-black text-gray-300 uppercase">{post.user?.username?.charAt(0)}</span>
              )}
            </div>
            <div>
              <h3 className="font-black text-white text-xl tracking-tight leading-none group-hover:cyber-gradient-text transition-all">
                {post.user?.username || 'Post Creator'}
              </h3>
              {post.location && (
                <div className="flex items-center gap-1.5 text-[11px] text-gray-300 font-black uppercase tracking-widest mt-2">
                  <MapPin size={12} className="text-cyber-pink animate-bounce shadow-sm" />
                  <span>{post.location}</span>
                </div>
              )}
            </div>
          </div>
          <button className="text-gray-500 hover:text-white transition-colors p-2">
            <MoreHorizontal size={24} />
          </button>
        </div>

        <p className="text-white text-xl md:text-2xl leading-relaxed mb-8 font-semibold selection:bg-cyber-purple/40 italic drop-shadow-sm">
          "{post.caption}"
        </p>

        {post.media && post.media.length > 0 && (
          <div className="rounded-[2.5rem] overflow-hidden mb-8 bg-white/5 aspect-[16/10] relative group/media border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] memory-glow">
            {post.media[0].media_type === 'video' ? (
              <video 
                src={post.media[0].media_url} 
                className="w-full h-full object-cover group-hover/media:scale-110 transition-transform duration-[2000ms] ease-out"
                autoPlay 
                muted 
                loop 
                playsInline
              />
            ) : (
              <img 
                src={post.media[0].media_url} 
                alt="Post Media"
                className="w-full h-full object-cover group-hover/media:scale-110 transition-transform duration-[2000ms] ease-out"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-cyber-dark/80 via-transparent to-transparent opacity-70 pointer-events-none" />
            
            {/* Shimmering Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-cyber-purple/20 via-transparent to-cyber-pink/20 opacity-40 group-hover/media:opacity-100 transition-opacity animate-pulse" />
          </div>
        )}

        <div className="flex items-center justify-between pt-8 border-t border-white/10">
          <div className="flex items-center gap-8">
            <button 
              onClick={handleLike}
              disabled={isLiking}
              className={cn(
                "flex items-center gap-2.5 transition-all group p-1 cursor-pointer",
                isLiked ? "text-cyber-pink" : "text-gray-400 hover:text-cyber-pink"
              )}
            >
              <Heart className={cn("w-7 h-7 transition-transform", isLiked && "fill-current neon-glow-pink scale-110")} />
              <span className="text-sm font-black tracking-widest">{likesCount}</span>
            </button>
            <button 
              onClick={() => setIsCommentsOpen(true)}
              className="flex items-center gap-2.5 text-gray-400 hover:text-cyber-purple transition-all group p-1 cursor-pointer"
            >
              <MessageCircle className="w-7 h-7 group-hover:neon-glow-purple transition-transform group-hover:scale-110" />
              <span className="text-sm font-black tracking-widest">{post.comments_count || 0}</span>
            </button>
          </div>
          <button className="text-gray-400 hover:text-white transition-colors p-2 cursor-pointer">
            <Share2 size={24} />
          </button>
        </div>
      </CyberCard>

      {isCommentsOpen && (
        <CommentsModal 
          post={post} 
          onClose={() => setIsCommentsOpen(false)} 
        />
      )}
    </div>
  );
}
