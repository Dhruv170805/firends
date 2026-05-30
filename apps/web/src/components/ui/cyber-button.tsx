import React from 'react';
import { cn } from '@/lib/utils';

interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
}

export function CyberButton({
  children,
  className,
  variant = 'primary',
  ...props
}: CyberButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-black uppercase tracking-widest transition-all cursor-pointer active:scale-95 disabled:opacity-50",
        variant === 'primary' && "bg-gradient-to-r from-cyber-purple to-cyber-pink text-white px-10 py-5 rounded-3xl hover:scale-105 shadow-2xl neon-glow-purple",
        variant === 'secondary' && "bg-white/10 text-white px-8 py-4 rounded-2xl hover:bg-white/20 border border-white/10",
        variant === 'outline' && "cyber-glass border border-white/20 px-8 py-4 rounded-2xl text-white hover:border-cyber-purple",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
