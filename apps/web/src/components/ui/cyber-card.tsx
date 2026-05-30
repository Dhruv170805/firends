import React from 'react';
import { cn } from '@/lib/utils';

interface CyberCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CyberCard({ children, className, ...props }: CyberCardProps) {
  return (
    <div
      className={cn(
        "cyber-glass p-7 md:p-10 rounded-[3rem] neon-border card-hover nostalgia-bloom border-white/20",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
