import {
  Aperture,
  ArrowUpRight,
  CheckCircle2,
  Flame,
  Focus,
  Instagram,
  Lock,
  Sparkles,
  Sun,
  Trophy,
  UserCheck,
  Zap,
} from 'lucide-react';
import type { Achievement } from '../types';

interface AchievementsGalleryProps {
  achievements: Achievement[];
}

function BadgeIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case 'aperture':
      return <Aperture className={className} />;
    case 'focus':
      return <Focus className={className} />;
    case 'sun':
      return <Sun className={className} />;
    case 'arrow-up-right':
      return <ArrowUpRight className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'user-check':
      return <UserCheck className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'instagram':
      return <Instagram className={className} />;
    default:
      return <Trophy className={className} />;
  }
}

export function AchievementsGallery({ achievements }: AchievementsGalleryProps) {
  const unlockedList = achievements.filter((a) => a.unlocked_at !== '');
  const bonusXpEarned = unlockedList.reduce((acc, item) => acc + item.xp_bonus, 0);

  return (
    <div className="space-y-6">
      <section className="bg-[#13151C] border border-white/10 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-amber-400">
            Galeria de Troféus · Estilo Play Store
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-50 tracking-tight">
            Suas Conquistas
          </h1>
          <p className="text-sm text-zinc-400 font-mono-num">
            {unlockedList.length} de {achievements.length} medalhas desbloqueadas
            <span className="mx-2 text-zinc-600" aria-hidden="true">
              ·
            </span>
            +{bonusXpEarned} XP em bônus
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Trophy className="w-6 h-6" />
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((ach) => {
          const isUnlocked = ach.unlocked_at !== '';
          const isMasterTrophy = ach.code === 'all_modules';
          const progressPct = Math.min(
            100,
            Math.round((ach.currentCount / Math.max(1, ach.targetCount)) * 100)
          );

          return (
            <article
              key={ach.id}
              data-testid={`achievement-card-${ach.code}`}
              className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-colors ${
                isMasterTrophy ? 'sm:col-span-2 lg:col-span-3' : ''
              } ${
                isUnlocked
                  ? 'bg-[#151824] border-amber-400/35'
                  : 'bg-[#101218] border-white/8 opacity-80'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 border ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-amber-500/25 to-purple-500/25 border-amber-400/40 text-amber-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 grayscale'
                  }`}
                >
                  <BadgeIcon name={ach.badge_icon} className="w-6 h-6" />
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h2
                      className={`font-display text-base font-bold leading-snug ${
                        isUnlocked ? 'text-zinc-50' : 'text-zinc-300'
                      }`}
                    >
                      {ach.title}
                    </h2>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{ach.description}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/8">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-zinc-400 truncate">{ach.condition}</span>
                  <span
                    className={`font-mono-num font-semibold shrink-0 ${
                      isUnlocked ? 'text-amber-400' : 'text-zinc-500'
                    }`}
                  >
                    +{ach.xp_bonus} XP
                  </span>
                </div>

                {isUnlocked ? (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Desbloqueada em {new Date(ach.unlocked_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono-num">
                      <span className="inline-flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Bloqueada
                      </span>
                      <span>
                        {ach.currentCount}/{ach.targetCount}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-900 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-zinc-600 transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
