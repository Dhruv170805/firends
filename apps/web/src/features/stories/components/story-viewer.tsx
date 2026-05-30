'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StoryItem {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  created_at: string;
}

interface StoryViewerProps {
  user: {
    id: string;
    username: string;
    avatar_url?: string | null;
  };
  stories: StoryItem[];
  onClose: () => void;
  onNextUser?: () => void;
  onPrevUser?: () => void;
}

export function StoryViewer({
  user,
  stories,
  onClose,
  onNextUser,
  onPrevUser,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const duration = 5000; // 5 seconds per snap

  const activeStory = stories[currentIndex];

  // Reset indices when stories change
  useEffect(() => {
    setCurrentIndex(0);
    setProgress(0);
  }, [user.id, stories]);

  // Manage progress bar ticking
  useEffect(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);

    setProgress(0);
    const tickInterval = 50; // Every 50ms
    const step = (tickInterval / duration) * 100;

    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, tickInterval);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [currentIndex, user.id]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      if (onNextUser) {
        onNextUser();
      } else {
        onClose();
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      if (onPrevUser) {
        onPrevUser();
      } else {
        // Reset current story
        setProgress(0);
      }
    }
  };

  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const width = window.innerWidth;
    const clickX = e.clientX;

    // Tapping left 30% goes back, right 70% goes forward
    if (clickX < width * 0.3) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  if (!activeStory) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center select-none">
      {/* Background Blur Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl pointer-events-none"
        style={{ backgroundImage: `url(${activeStory.media_url})` }}
      />

      {/* Main Snap Frame */}
      <div 
        className="w-full max-w-lg h-full md:h-[90vh] md:rounded-[2.5rem] relative overflow-hidden bg-black flex flex-col justify-center border border-white/5 shadow-2xl cursor-pointer"
        onClick={handleScreenClick}
      >
        {/* Story Media */}
        {activeStory.media_type === 'video' ? (
          <video 
            src={activeStory.media_url} 
            className="w-full h-full object-contain pointer-events-none"
            autoPlay 
            muted 
            playsInline
          />
        ) : (
          <img 
            src={activeStory.media_url} 
            alt="Snap" 
            className="w-full h-full object-contain pointer-events-none"
          />
        )}

        {/* HUD Overlay */}
        <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-black/80 to-transparent flex flex-col gap-4 z-10">
          
          {/* Progress Indicators */}
          <div className="flex gap-1.5 w-full">
            {stories.map((_, idx) => {
              let fillWidth = '0%';
              if (idx < currentIndex) fillWidth = '100%';
              if (idx === currentIndex) fillWidth = `${progress}%`;

              return (
                <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-75 ease-linear"
                    style={{ width: fillWidth }}
                  />
                </div>
              );
            })}
          </div>

          {/* User Info & Time */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-white/20 bg-white/10 overflow-hidden flex items-center justify-center">
                {user.avatar_url ? (
                  <img src={user.avatar_url} className="w-full h-full object-cover" alt={user.username} />
                ) : (
                  <User size={18} className="text-white" />
                )}
              </div>
              <div>
                <h4 className="text-white text-sm font-black tracking-tight">{user.username}</h4>
                <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">
                  {new Date(activeStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white cursor-pointer transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Hover Arrow Controls (Desktop Assist) */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 items-center justify-center text-white cursor-pointer z-20 hover:scale-110 transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 items-center justify-center text-white cursor-pointer z-20 hover:scale-110 transition-all"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}
