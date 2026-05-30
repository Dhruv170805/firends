import React from 'react';
import { cn } from '@/lib/utils';

interface CyberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function CyberInput({ label, className, type = 'text', ...props }: CyberInputProps) {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
          {label}
        </label>
      )}
      <input
        type={type}
        className={cn(
          "block w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder-gray-500 focus:bg-cyber-dark/40 focus:border-cyber-purple focus:ring-4 focus:ring-cyber-purple/10 transition-all outline-none font-medium",
          className
        )}
        {...props}
      />
    </div>
  );
}
