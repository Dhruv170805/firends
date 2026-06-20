import { useState, useEffect } from 'react';

export interface GroupContextType {
  id: string;
  name: string;
}

export function useActiveGroup() {
  const [activeGroup, setActiveGroup] = useState<GroupContextType | null>(null);

  useEffect(() => {
    // Initial load from localStorage
    const saved = localStorage.getItem('activeGroup');
    if (saved) {
      try {
        setActiveGroup(JSON.parse(saved));
      } catch {
        localStorage.removeItem('activeGroup');
      }
    }

    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<GroupContextType | null>;
      setActiveGroup(customEvent.detail);
    };

    window.addEventListener('activeGroupChanged', handler);
    return () => {
      window.removeEventListener('activeGroupChanged', handler);
    };
  }, []);

  const changeGroup = (group: GroupContextType | null) => {
    if (group) {
      localStorage.setItem('activeGroup', JSON.stringify(group));
    } else {
      localStorage.removeItem('activeGroup');
    }
    setActiveGroup(group);
    window.dispatchEvent(new CustomEvent('activeGroupChanged', { detail: group }));
  };

  return { activeGroup, changeGroup };
}
