'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Map as MapIcon, Search, X, MapPin, Camera, Loader2, Sparkles, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

const HotspotMarker = ({ post, onClick }: { post: any, onClick: () => void }) => {
  // Map coordinates (approx 37.42, -122.16) to SVG 1000x1000 space
  const x = ((post.longitude + 122.175) / 0.02) * 1000;
  const y = ((37.435 - post.latitude) / 0.015) * 1000;

  return (
    <g 
      className="cursor-pointer group" 
      onClick={onClick}
      transform={`translate(${x}, ${y})`}
    >
      <circle r="12" className="fill-cyber-purple/20 animate-ping" />
      <circle r="8" className="fill-cyber-purple shadow-[0_0_15px_#A855F7] group-hover:r-10 transition-all" />
      <circle r="4" className="fill-white" />
    </g>
  );
};

export default function CampusMapPage() {
  const [selectedPost, setSelectedPost] = useState<any>(null);
  
  const { data: posts, isLoading } = useQuery({
    queryKey: ['map-posts'],
    queryFn: () => apiFetch('/posts?limit=50'), // In real app, filter for posts with coords
  });

  const mapPosts = posts?.filter((p: any) => p.latitude && p.longitude) || [];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-cyber-pink/20 border border-cyber-pink/30 text-[10px] font-black text-cyber-pink uppercase tracking-[0.4em] animate-pulse">
              Location Map Active
            </div>
          </div>
          <h2 className="text-6xl font-black text-white tracking-tighter leading-none">
            Campus<br/><span className="cyber-gradient-text text-cyber-pink">Map</span>
          </h2>
        </div>
        
        <div className="cyber-glass px-8 py-5 rounded-2xl border border-white/10 flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Map Posts</span>
            <span className="text-2xl font-black text-white">{mapPosts.length}</span>
          </div>
          <div className="w-[1px] h-10 bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Zone</span>
            <span className="text-2xl font-black text-white tracking-tighter italic">ALPHA-1</span>
          </div>
        </div>
      </header>

      <div className="flex-1 relative cyber-glass rounded-[4rem] overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] bg-[#0A0F1A]">
        {/* Abstract Cyber Map Grid */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, #A855F7 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <svg 
          viewBox="0 0 1000 1000" 
          className="w-full h-full preserve-3d"
          style={{ transform: 'perspective(1000px) rotateX(20deg)' }}
        >
          {/* Mock Campus Buildings/Zones */}
          <path d="M100,100 L300,100 L350,300 L150,350 Z" className="fill-white/5 stroke-white/10 stroke-1" />
          <text x="180" y="220" className="fill-gray-600 text-[20px] font-black uppercase tracking-[0.5em] select-none">Engineering</text>
          
          <path d="M600,200 L850,150 L900,450 L650,500 Z" className="fill-white/5 stroke-white/10 stroke-1" />
          <text x="700" y="350" className="fill-gray-600 text-[20px] font-black uppercase tracking-[0.5em] select-none">Housing</text>

          <circle cx="500" cy="500" r="120" className="fill-white/5 stroke-white/10 stroke-2 border-dashed" strokeDasharray="10,10" />
          <text x="440" y="510" className="fill-cyber-purple/40 text-[24px] font-black uppercase tracking-[0.8em] select-none">Main Quad</text>

          <path d="M200,650 L450,700 L400,900 L150,850 Z" className="fill-white/5 stroke-white/10 stroke-1" />
          <text x="240" y="790" className="fill-gray-600 text-[20px] font-black uppercase tracking-[0.5em] select-none">Stadium</text>

          {/* Real Hotspots from Data */}
          {mapPosts.map((post: any) => (
            <HotspotMarker key={post.id} post={post} onClick={() => setSelectedPost(post)} />
          ))}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-10 left-10 space-y-4 pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-cyber-purple shadow-[0_0_10px_#A855F7]" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Post</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-3 h-3 rounded-full bg-cyber-pink shadow-[0_0_10px_#EC4899]" />
             <span className="text-[10px] font-black text-white uppercase tracking-widest">Milestone</span>
          </div>
        </div>

        {/* Selected Memory Overlay */}
        {selectedPost && (
          <div className="absolute top-10 right-10 w-96 cyber-glass p-8 rounded-[3rem] border border-white/20 shadow-2xl animate-in slide-in-from-right duration-500">
            <button 
              onClick={() => setSelectedPost(null)}
              className="absolute top-6 right-6 text-gray-500 hover:text-white"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                {selectedPost.user?.avatar_url ? (
                  <img src={selectedPost.user.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-black text-gray-500 uppercase">{selectedPost.user?.username?.charAt(0)}</span>
                )}
              </div>
              <div>
                <h4 className="font-black text-white text-lg leading-none">{selectedPost.user?.username}</h4>
                <div className="flex items-center gap-1 mt-2">
                  <MapPin size={10} className="text-cyber-pink" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{selectedPost.location}</span>
                </div>
              </div>
            </div>

            {selectedPost.media?.[0] && (
              <div className="rounded-2xl overflow-hidden mb-6 aspect-video border border-white/10">
                <img src={selectedPost.media[0].media_url} className="w-full h-full object-cover" />
              </div>
            )}

            <p className="text-gray-200 text-sm font-bold leading-relaxed mb-8 italic">
              "{selectedPost.caption}"
            </p>

            <div className="flex gap-4">
               <button className="flex-1 py-4 rounded-xl bg-cyber-purple text-white font-black uppercase tracking-widest text-[10px] shadow-lg">
                  View Post
               </button>
               <button className="px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center">
                  <Navigation size={16} />
               </button>
            </div>
          </div>
        )}
      </div>

      {!isLoading && mapPosts.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="cyber-glass px-10 py-6 rounded-2xl text-center border border-white/10 shadow-2xl">
              <Sparkles className="mx-auto mb-3 text-cyber-purple" />
              <p className="text-xs font-black text-white uppercase tracking-[0.2em]">Add locations to your posts to show them on the map</p>
           </div>
        </div>
      )}
    </div>
  );
}
