import React, { useState } from 'react';
import { X, Send, User, Loader2 } from 'lucide-react';
import { Comment, Post } from '@/types';
import { apiFetch } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface CommentsModalProps {
  post: Post;
  onClose: () => void;
}

export function CommentsModal({ post, onClose }: CommentsModalProps) {
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: ['comments', post.id],
    queryFn: () => apiFetch(`/interactions/comments/${post.id}`),
  });

  const commentMutation = useMutation({
    mutationFn: (newContent: string) => 
      apiFetch(`/interactions/comment/${post.id}`, {
        method: 'POST',
        body: JSON.stringify({ content: newContent })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', post.id] });
      setContent('');
      toast.success('Comment added!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add comment');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    commentMutation.mutate(content);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg h-[80vh] sm:h-[600px] bg-[#111718] sm:rounded-[2.5rem] rounded-t-[2.5rem] flex flex-col overflow-hidden border-t sm:border border-white/10 shadow-2xl animate-fade-in z-10">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <h3 className="font-black text-white uppercase tracking-widest text-sm">Comments</h3>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white">
            <X size={20} />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-cyber-purple" size={32} />
            </div>
          ) : comments?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
              <MessageCircleOff />
              <p className="mt-4 font-bold text-gray-400 uppercase tracking-widest text-xs">No comments yet</p>
              <p className="text-xs text-gray-500 mt-1">Be the first to share your thoughts.</p>
            </div>
          ) : (
            comments?.map((comment) => (
              <div key={comment.id} className="flex gap-4 group">
                <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {comment.user?.avatar_url ? (
                    <img src={comment.user.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} className="text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-black text-white text-sm tracking-tight">{comment.user?.username}</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <div className="p-4 bg-white/5 border-t border-white/10 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          <form onSubmit={handleSubmit} className="flex items-end gap-3 relative">
            <input
              type="text"
              placeholder="Add a comment..."
              className="flex-1 bg-white/10 border border-white/20 rounded-2xl py-4 pl-5 pr-14 text-white text-sm font-semibold outline-none focus:border-cyber-purple focus:ring-2 focus:ring-cyber-purple/20 transition-all shadow-inner"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={commentMutation.isPending}
            />
            <button
              type="submit"
              disabled={!content.trim() || commentMutation.isPending}
              className="absolute right-2 top-2 bottom-2 aspect-square rounded-xl bg-cyber-purple text-white flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 transition-all neon-glow-purple"
            >
              {commentMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

const MessageCircleOff = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
    <path d="M20.5 14.5A9 9 0 0 0 9.5 3.5" />
    <path d="M17 17a8.97 8.97 0 0 1-5 1.5c-4.97 0-9-4.03-9-9 0-1.72.48-3.32 1.3-4.66" />
    <path d="M2 2l20 20" />
    <path d="M7.5 7.5l-2-2" />
    <path d="M16.5 16.5l2 2" />
  </svg>
);
