import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Users, PlusSquare, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Topbar({
  activeGroup,
  groups,
  changeGroup,
  handleSignOut,
}: {
  activeGroup: any;
  groups: any[];
  changeGroup: (group: any) => void;
  handleSignOut: () => void;
}) {
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-cyber-dark/60 backdrop-blur-3xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3 relative">
        <button 
          onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
          className="flex items-center gap-2 text-left cursor-pointer group active:scale-95 transition-transform"
        >
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
            {activeGroup ? activeGroup.name : 'Public Feed'}
            <ChevronDown size={20} className={cn(
              "text-gray-400 transition-transform duration-300", 
              isGroupDropdownOpen ? "rotate-180" : "rotate-0"
            )} />
          </h1>
        </button>

        {isGroupDropdownOpen && (
          <>
            <div className="fixed inset-0 z-45" onClick={() => setIsGroupDropdownOpen(false)} />
            <div className="absolute left-0 top-10 w-64 bg-[#1C1B19]/95 backdrop-blur-3xl rounded-3xl border border-white/5 shadow-2xl z-50 overflow-hidden py-2 animate-fade-in origin-top-left">
              
              <div className="max-h-[350px] overflow-y-auto scrollbar-hide">
                <button
                  type="button"
                  onClick={() => {
                    changeGroup(null);
                    setIsGroupDropdownOpen(false);
                  }}
                  className="w-full text-left px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyber-purple to-cyber-pink flex items-center justify-center border border-white/10">
                      <Users size={18} className="text-[#111718]" />
                    </div>
                    <span className={cn(
                      "text-sm font-semibold",
                      !activeGroup ? "text-white" : "text-gray-400 group-hover:text-white"
                    )}>Public Feed</span>
                  </div>
                  {!activeGroup && <div className="w-2 h-2 rounded-full bg-cyber-purple" />}
                </button>
                
                {groups.map((group) => {
                  const isSelected = activeGroup?.id === group.id;
                  return (
                    <button
                      type="button"
                      key={group.id}
                      onClick={() => {
                        changeGroup({ id: group.id, name: group.name });
                        setIsGroupDropdownOpen(false);
                      }}
                      className="w-full text-left px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 flex-shrink-0 text-gray-300 font-bold uppercase">
                          {group.name.substring(0, 1)}
                        </div>
                        <span className={cn(
                          "text-sm font-semibold truncate",
                          isSelected ? "text-white" : "text-gray-400 group-hover:text-white"
                        )}>{group.name}</span>
                      </div>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-cyber-purple flex-shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
              
              <div className="border-t border-white/5 mt-1 pt-1">
                <Link 
                  href="/sectors" 
                  onClick={() => setIsGroupDropdownOpen(false)}
                  className="w-full text-left px-5 py-4 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full border border-dashed border-gray-500 flex items-center justify-center group-hover:border-white transition-colors">
                    <PlusSquare size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-sm font-semibold text-gray-400 group-hover:text-white transition-colors">Manage Groups</span>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
      <button 
        onClick={handleSignOut}
        className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors border border-white/10"
      >
        <LogOut size={20} />
      </button>
    </header>
  );
}
