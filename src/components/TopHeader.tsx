import { useState } from 'react';
import { Camera, Flame, RotateCcw, Sparkles } from 'lucide-react';
import type { AppTab, UserProfile } from '../types';

interface TopHeaderProps {
  user: UserProfile;
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onResetWorkspace: () => Promise<void>;
  isResetting: boolean;
}

const NAV_ITEMS: { id: AppTab; label: string }[] = [
  { id: 'trail', label: 'Trilha' },
  { id: 'achievements', label: 'Conquistas' },
  { id: 'tutor', label: 'Tutor IA' },
  { id: 'feed', label: '@juliaphoto' },
];

export function TopHeader({
  user,
  activeTab,
  onSelectTab,
  onResetWorkspace,
  isResetting,
}: TopHeaderProps) {
  const [confirmingReset, setConfirmingReset] = useState(false);

  const handleConfirmReset = async () => {
    await onResetWorkspace();
    setConfirmingReset(false);
  };

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-white/10 bg-[#0A0B0F]/92 backdrop-blur-md">
      <div className="max-w-6xl mx-auto h-full px-3 sm:px-6 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand + Avatar */}
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          <img
            src={user.photoURL || '/assets/aistudio/Julia_foto_ae837286.jpg'}
            alt={`Avatar de ${user.displayName}`}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover border border-amber-400/50 shrink-0"
          />
          <span className="font-display text-base sm:text-lg font-bold tracking-tight text-zinc-50 whitespace-nowrap shrink-0">
            Julia Photo Quest
          </span>
        </div>

        {/* Zone 2: Desktop Navigation Links */}
        <nav
          aria-label="Navegação principal"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'border-amber-400 text-zinc-50 font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Gamified Stats + Reset Action */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <div
              className="flex items-center gap-1 text-amber-400 font-semibold whitespace-nowrap"
              title="Ofensiva de dias"
              aria-label={`Ofensiva de ${user.streak} dias`}
            >
              <Flame className="w-4 h-4 fill-amber-400/20" />
              <span className="font-mono-num">{user.streak}</span>
            </div>

            <span className="text-zinc-700" aria-hidden="true">
              ·
            </span>

            <div
              className="flex items-center gap-1 text-purple-300 font-semibold whitespace-nowrap"
              title="XP total"
              aria-label={`${user.totalXp} XP total`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-mono-num">{user.totalXp} XP</span>
            </div>

            <span className="hidden sm:inline text-zinc-700" aria-hidden="true">
              ·
            </span>

            <div
              className="hidden sm:flex items-center gap-1 text-zinc-200 font-semibold whitespace-nowrap"
              aria-label={`Nível ${user.level}`}
            >
              <Camera className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-mono-num">Nv. {user.level}</span>
            </div>
          </div>

          {!confirmingReset ? (
            <button
              type="button"
              onClick={() => setConfirmingReset(true)}
              aria-label="Reiniciar progresso da trilha"
              title="Reiniciar trilha para novo teste"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="px-2.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-semibold whitespace-nowrap cursor-pointer min-h-[36px]"
              >
                {isResetting ? 'Zerando...' : 'Zerar trilha'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingReset(false)}
                className="px-2 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-100 cursor-pointer min-h-[36px]"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
