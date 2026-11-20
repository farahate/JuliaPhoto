import {
  Camera,
  Check,
  Compass,
  Lock,
  Plus,
  Sparkles,
  Sun,
  Zap,
} from 'lucide-react';
import type {
  ModuleAccent,
  PhotoQuest,
  QuestModule,
  SuggestedBonusQuest,
  UserProfile,
} from '../types';
import {
  computeQuestNodeOffset,
  levelProgressPercent,
  xpRemainingInLevel,
} from '../utils/questLogic';

interface TrailMapProps {
  user: UserProfile;
  modules: QuestModule[];
  quests: PhotoQuest[];
  onSelectQuest: (quest: PhotoQuest) => void;
  pendingBonusQuest: SuggestedBonusQuest | null;
  onAcceptBonusQuest: () => void;
  onDismissBonusQuest: () => void;
  isCreatingBonus: boolean;
}

const ACCENT_STYLES: Record<
  ModuleAccent,
  { headerBg: string; headerBorder: string; text: string; iconBg: string }
> = {
  amber: {
    headerBg: 'bg-amber-500/10',
    headerBorder: 'border-amber-500/25',
    text: 'text-amber-300',
    iconBg: 'bg-amber-500/20 text-amber-300',
  },
  purple: {
    headerBg: 'bg-purple-500/10',
    headerBorder: 'border-purple-500/25',
    text: 'text-purple-300',
    iconBg: 'bg-purple-500/20 text-purple-300',
  },
  emerald: {
    headerBg: 'bg-emerald-500/10',
    headerBorder: 'border-emerald-500/25',
    text: 'text-emerald-300',
    iconBg: 'bg-emerald-500/20 text-emerald-300',
  },
  rose: {
    headerBg: 'bg-rose-500/10',
    headerBorder: 'border-rose-500/25',
    text: 'text-rose-300',
    iconBg: 'bg-rose-500/20 text-rose-300',
  },
  cyan: {
    headerBg: 'bg-cyan-500/10',
    headerBorder: 'border-cyan-500/25',
    text: 'text-cyan-300',
    iconBg: 'bg-cyan-500/20 text-cyan-300',
  },
};

function ModuleIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case 'sun':
      return <Sun className={className} />;
    case 'compass':
      return <Compass className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    default:
      return <Camera className={className} />;
  }
}

export function TrailMap({
  user,
  modules,
  quests,
  onSelectQuest,
  pendingBonusQuest,
  onAcceptBonusQuest,
  onDismissBonusQuest,
  isCreatingBonus,
}: TrailMapProps) {
  const completedCount = quests.filter((q) => q.status === 'completed').length;
  const totalCount = quests.length;
  const lvlPct = levelProgressPercent(user.totalXp);
  const xpLeft = xpRemainingInLevel(user.totalXp);

  return (
    <div className="space-y-8">
      {/* Level & Style Summary Strip */}
      <section className="bg-[#13151C] border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-amber-400">
              Jornada de Fotografia · Nível {user.level}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-50 tracking-tight">
              Sua Trilha Criativa
            </h1>
            <p className="text-sm text-zinc-400">
              Estilo detectado:{' '}
              <span className="text-zinc-100 font-medium">{user.detected_style}</span>
              <span className="mx-2 text-zinc-600" aria-hidden="true">
                ·
              </span>
              <span className="font-mono-num whitespace-nowrap">
                {completedCount}/{totalCount} missões
              </span>
            </p>
          </div>
          <div className="flex sm:block items-baseline justify-between gap-2 sm:text-right space-y-0.5 pt-2 sm:pt-0 border-t border-white/8 sm:border-t-0">
            <p className="text-xs text-zinc-400">Próximo nível em</p>
            <p className="font-mono-num text-base sm:text-lg font-bold text-amber-400">
              {xpLeft} XP
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="h-2.5 w-full rounded-full bg-zinc-900 overflow-hidden border border-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-purple-500 transition-all duration-300"
              style={{ width: `${Math.max(4, lvlPct)}%` }}
            />
          </div>
        </div>
      </section>

      {/* Adaptive AI Trail Bonus Quest Suggestion */}
      {pendingBonusQuest && (
        <section
          aria-label="Sugestão adaptativa da trilha"
          className="bg-[#181625] border border-purple-500/35 rounded-2xl p-5 space-y-3"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nova Missão Bônus Sugerida pelo Tutor IA</span>
              </p>
              <h2 className="font-display text-lg font-bold text-zinc-50">
                {pendingBonusQuest.title}
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {pendingBonusQuest.description}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onAcceptBonusQuest}
              disabled={isCreatingBonus}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-60 text-white font-semibold text-sm transition-colors min-h-[44px] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {isCreatingBonus ? 'Adicionando...' : 'Adicionar à minha trilha (+120 XP)'}
            </button>
            <button
              type="button"
              onClick={onDismissBonusQuest}
              className="px-4 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 transition-colors min-h-[44px] cursor-pointer"
            >
              Agora não
            </button>
          </div>
        </section>
      )}

      {/* Duolingo-style Winding Modules & Nodes */}
      <div className="space-y-10">
        {modules.map((mod) => {
          const modQuests = quests
            .filter((q) => q.moduleId === mod.id)
            .sort((a, b) => a.order - b.order);
          const modCompleted = modQuests.filter((q) => q.status === 'completed').length;
          const style = ACCENT_STYLES[mod.accent] || ACCENT_STYLES.amber;

          return (
            <section key={mod.id} className="space-y-6">
              {/* Module Banner */}
              <div
                className={`rounded-2xl border p-4 sm:p-5 flex items-center justify-between gap-4 ${style.headerBg} ${style.headerBorder}`}
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}
                  >
                    <ModuleIcon name={mod.icon} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h2 className="font-display text-lg font-bold text-zinc-50 leading-snug">
                      {mod.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                      {mod.subtitle}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`font-mono-num text-sm font-semibold ${style.text}`}>
                    {modCompleted}/{modQuests.length}
                  </span>
                </div>
              </div>

              {/* Vertical Winding Trail */}
              <div className="relative flex flex-col items-center py-2 space-y-7">
                {modQuests.map((quest, idx) => {
                  const offsetPx = computeQuestNodeOffset(idx);
                  const isCompleted = quest.status === 'completed';
                  const isUnlocked = quest.status === 'unlocked';
                  const isLocked = quest.status === 'locked';

                  return (
                    <div
                      key={quest.id}
                      className="relative flex flex-col items-center"
                      style={{ transform: `translateX(${offsetPx}px)` }}
                    >
                      {/* Connector line to next node inside same module */}
                      {idx < modQuests.length - 1 && (
                        <div
                          aria-hidden="true"
                          className={`absolute top-[74px] w-0.5 h-8 ${
                            isCompleted ? 'bg-emerald-500/45' : 'bg-zinc-800'
                          }`}
                        />
                      )}

                      <div className="relative flex items-center justify-center">
                        {/* Pulsing halo exclusively on current active unlocked quest */}
                        {isUnlocked && (
                          <span
                            aria-hidden="true"
                            className="absolute -inset-2 rounded-full bg-amber-500/25 animate-pulse"
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => onSelectQuest(quest)}
                          aria-label={`Missão ${quest.order}: ${quest.title} — ${
                            isCompleted
                              ? 'Concluída'
                              : isUnlocked
                                ? 'Disponível para jogar'
                                : 'Bloqueada'
                          }`}
                          data-testid={`quest-node-${quest.order}`}
                          className={`relative w-[76px] h-[76px] rounded-full flex items-center justify-center border-4 transition-transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0B0F] ${
                            isCompleted
                              ? 'bg-emerald-500/20 border-amber-400 text-emerald-300 shadow-lg shadow-amber-500/10'
                              : isUnlocked
                                ? 'bg-gradient-to-br from-amber-400 to-purple-500 border-amber-200 text-zinc-950 shadow-lg shadow-amber-500/20 hover:scale-105'
                                : 'bg-[#13151C] border-zinc-800 text-zinc-500 hover:border-zinc-700'
                          }`}
                        >
                          {isCompleted && quest.photoUrl ? (
                            <img
                              src={quest.photoUrl}
                              alt={quest.title}
                              className="w-full h-full object-cover rounded-full opacity-90"
                            />
                          ) : isCompleted ? (
                            <Check className="w-7 h-7 stroke-[2.75]" />
                          ) : isUnlocked ? (
                            <Camera className="w-7 h-7 stroke-[2.25]" />
                          ) : (
                            <Lock className="w-6 h-6" />
                          )}

                          {isCompleted && (
                            <span
                              aria-hidden="true"
                              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0A0B0F] flex items-center justify-center text-zinc-950"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          )}
                        </button>
                      </div>

                      <div className="mt-2.5 text-center max-w-[190px] space-y-0.5">
                        <p
                          className={`text-sm font-semibold leading-snug ${
                            isLocked ? 'text-zinc-500' : 'text-zinc-100'
                          }`}
                        >
                          {quest.title}
                        </p>
                        <p className="text-xs text-zinc-400 font-mono-num">
                          {isCompleted
                            ? 'Concluída'
                            : isUnlocked
                              ? `Disponível · +${quest.xpReward} XP`
                              : `Bloqueada · +${quest.xpReward} XP`}
                          {quest.isBonus ? ' · Bônus' : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
