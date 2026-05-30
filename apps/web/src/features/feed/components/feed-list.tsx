import React, { useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Post } from '@/types';
import { PostCard } from './post-card';
import { Loader2, Search, X, Camera } from 'lucide-react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';
import { useActiveGroup } from '@/hooks/use-active-group';

const TimelineSkeleton = () => (
  <div className="relative pl-14 md:pl-24 pb-20 animate-pulse">
    <div className="absolute left-[13px] md:left-[21px] top-10 bottom-0 w-[2px] bg-white/10" />
    <div className="absolute left-0 top-1 w-7 h-7 md:w-11 md:h-11 rounded-full bg-white/10 border-2 border-white/20" />
    <div className="cyber-glass p-10 rounded-[3rem] border border-white/10 h-[500px]" />
  </div>
);

export function FeedList() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { activeGroup } = useActiveGroup();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery<Post[]>({
    queryKey: ['feed', activeGroup?.id],
    queryFn: ({ pageParam }) => {
      const cursor = pageParam ? `&cursor=${pageParam}` : '';
      if (activeGroup) {
        return apiFetch(`/sectors/${activeGroup.id}/posts?limit=10${cursor}`);
      }
      return apiFetch(`/posts?limit=10${cursor}`);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < 10) return undefined;
      return lastPage[lastPage.length - 1].created_at;
    },
    enabled: !debouncedSearchQuery,
  });

  const { data: searchResults, isLoading: isSearchLoading } = useQuery<Post[]>({
    queryKey: ['search', debouncedSearchQuery],
    queryFn: () => apiFetch(`/posts/search?q=${debouncedSearchQuery}`),
    enabled: !!debouncedSearchQuery,
  });

  const posts: Post[] = debouncedSearchQuery ? (searchResults || []) : (data?.pages.flat() || []);


  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-12">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="px-4 py-1.5 rounded-full bg-cyber-purple/20 border border-cyber-purple/40 text-[11px] font-black text-white uppercase tracking-[0.4em] animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              Live Connection
            </div>
          </div>
          <h2 className="text-7xl md:text-8xl font-black text-white tracking-tighter leading-none">
            Memory<br/><span className="cyber-gradient-text">Feed</span>
          </h2>
        </div>
        
        <div className="relative group w-full md:w-[500px]">
          <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none text-gray-400 group-focus-within:text-cyber-purple transition-colors">
            <Search size={26} />
          </div>
          <input
            type="text"
            placeholder="Search memories..."
            className="w-full bg-white/10 border border-white/20 rounded-3xl py-6 pl-16 pr-14 text-lg font-bold text-white placeholder-gray-500 focus:border-cyber-purple focus:ring-8 focus:ring-cyber-purple/10 transition-all outline-none shadow-2xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-7 flex items-center text-gray-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          )}
        </div>
      </header>

      {isSearchLoading || searchQuery !== debouncedSearchQuery || (isLoading && !searchQuery) ? (
        <div className="space-y-6">
          <TimelineSkeleton />
          <TimelineSkeleton />
        </div>
      ) : posts.length === 0 ? (
        <div className="cyber-glass rounded-[4rem] p-32 text-center neon-border">
          <div className="w-28 h-28 bg-white/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner border border-white/20">
            <Search size={48} className="text-gray-600" />
          </div>
          <h3 className="text-4xl font-black text-white mb-4 tracking-tight">No Memories Yet</h3>
          <p className="text-gray-400 font-bold max-w-sm mx-auto mb-14 uppercase tracking-[0.3em] text-[11px] leading-relaxed">
            {searchQuery 
              ? `No memories found matching "${searchQuery}".` 
              : 'This feed is empty. Start posting your memories!'}
          </p>
          {!searchQuery && (
            <Link 
              href="/create" 
              className="inline-flex items-center gap-5 bg-gradient-to-r from-cyber-purple to-cyber-pink text-white px-14 py-6 rounded-3xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl neon-glow-purple"
            >
              <Camera size={24} />
              <span>Create First Post</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="relative">
          {/* Vertical Timeline Path */}
          <div className="absolute left-[13px] md:left-[21px] top-0 bottom-0 w-[2px] bg-white/10" />
          
          <div className="grid">
            {posts.map((post: Post, i: number) => (
              <PostCard 
                key={post.id} 
                post={post} 
                isFirst={i === 0} 
                isLast={i === posts.length - 1} 
              />
            ))}
          </div>

          {!searchQuery && hasNextPage && (
            <div className="flex justify-center py-24 pl-14 md:pl-24">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="cyber-glass border border-white/20 px-12 py-5 rounded-[2rem] font-black text-white hover:border-cyber-purple transition-all disabled:opacity-50 flex items-center gap-5 uppercase tracking-[0.3em] text-[11px] shadow-2xl cursor-pointer"
              >
                {isFetchingNextPage ? <Loader2 size={22} className="animate-spin text-cyber-purple" /> : null}
                Load More
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
