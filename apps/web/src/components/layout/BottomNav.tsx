import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, Camera, Users, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav({
  isOnboarding,
  handleSignOut,
}: {
  isOnboarding: boolean;
  handleSignOut: () => void;
}) {
  const pathname = usePathname();

  if (isOnboarding) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 min-h-[5rem] py-2 bg-[#111718]/90 backdrop-blur-3xl border-t border-white/10 flex justify-around items-center z-50 px-4 pb-[env(safe-area-inset-bottom,0px)] max-w-2xl mx-auto md:mb-8 md:rounded-[2.5rem] md:border md:border-white/10 md:bottom-4 md:shadow-[0_0_40px_rgba(0,0,0,0.9)]">

      <Link href="/" className="flex-1 flex flex-col items-center justify-center group gap-1.5">
        <div className={cn(
          "p-2.5 rounded-2xl transition-all duration-300",
          pathname === '/' ? "bg-cyber-purple/20 text-cyber-purple neon-glow-purple" : "text-gray-400 group-hover:text-white"
        )}>
          <Home size={26} strokeWidth={pathname === '/' ? 2.5 : 2} />
        </div>
        <span className={cn("text-[11px] font-black tracking-widest uppercase", pathname === '/' ? "text-cyber-purple" : "text-gray-400")}>Home</span>
      </Link>
      
      <Link href="/search" className="flex-1 flex flex-col items-center justify-center group gap-1.5">
        <div className={cn(
          "p-2.5 rounded-2xl transition-all duration-300",
          pathname === '/search' ? "bg-cyber-purple/20 text-cyber-purple neon-glow-purple" : "text-gray-400 group-hover:text-white"
        )}>
          <Map size={26} strokeWidth={pathname === '/search' ? 2.5 : 2} />
        </div>
        <span className={cn("text-[11px] font-black tracking-widest uppercase", pathname === '/search' ? "text-cyber-purple" : "text-gray-400")}>Map</span>
      </Link>

      <Link href="/create" className="flex-1 flex flex-col items-center justify-center group gap-1.5">
        <div className={cn(
          "p-3.5 rounded-2xl transition-all duration-300 -mt-10 bg-gradient-to-tr from-cyber-purple to-cyber-pink shadow-2xl",
          pathname === '/create' ? "scale-110 neon-glow-purple" : "scale-100 hover:scale-110"
        )}>
          <Camera size={28} strokeWidth={2.5} className="text-white" />
        </div>
        <span className={cn("text-[11px] font-black tracking-widest uppercase mt-0.5", pathname === '/create' ? "text-cyber-pink" : "text-gray-400")}>Post</span>
      </Link>

      <Link href="/sectors" className="flex-1 flex flex-col items-center justify-center group gap-1.5">
        <div className={cn(
          "p-2.5 rounded-2xl transition-all duration-300",
          pathname === '/sectors' ? "bg-cyber-purple/20 text-cyber-purple neon-glow-purple" : "text-gray-400 group-hover:text-white"
        )}>
          <Users size={26} strokeWidth={pathname === '/sectors' ? 2.5 : 2} />
        </div>
        <span className={cn("text-[11px] font-black tracking-widest uppercase", pathname === '/sectors' ? "text-cyber-purple" : "text-gray-400")}>Groups</span>
      </Link>

      <Link href="/profile" className="flex-1 flex flex-col items-center justify-center group gap-1.5">
        <div className={cn(
          "p-2.5 rounded-2xl transition-all duration-300",
          pathname === '/profile' ? "bg-cyber-purple/20 text-cyber-purple neon-glow-purple" : "text-gray-400 group-hover:text-white"
        )}>
          <User size={26} strokeWidth={pathname === '/profile' ? 2.5 : 2} />
        </div>
        <span className={cn("text-[11px] font-black tracking-widest uppercase", pathname === '/profile' ? "text-cyber-purple" : "text-gray-400")}>Profile</span>
      </Link>
      
      <button 
        onClick={handleSignOut}
        className="hidden md:flex flex-1 flex-col items-center justify-center group gap-1.5"
      >
        <div className="p-2.5 text-gray-400 group-hover:text-red-400 transition-colors">
          <LogOut size={26} />
        </div>
        <span className="text-[11px] font-black text-gray-400 tracking-widest uppercase group-hover:text-red-400">Log Out</span>
      </button>
    </nav>
  );
}
