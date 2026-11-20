import { Compass, Grid, MessageCircle, Trophy } from 'lucide-react';
import type { AppTab } from '../types';

interface BottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

const MOBILE_TABS: { id: AppTab; label: string; icon: typeof Compass }[] = [
  { id: 'trail', label: 'Trilha', icon: Compass },
  { id: 'achievements', label: 'Conquistas', icon: Trophy },
  { id: 'tutor', label: 'Tutor IA', icon: MessageCircle },
  { id: 'feed', label: 'Feed', icon: Grid },
];

export function BottomNav({ activeTab, onSelectTab }: BottomNavProps) {
  return (
    <nav
      aria-label="Navegação inferior"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-[#0A0B0F]/95 backdrop-blur-md border-t border-white/10"
    >
      <div className="grid grid-cols-4 h-full max-w-md mx-auto">
        {MOBILE_TABS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors cursor-pointer ${
                active ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
