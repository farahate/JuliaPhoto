import { Camera, Instagram, Sparkles } from 'lucide-react';
import type { PhotoQuest, StyleKey, UserProfile } from '../types';
import { STYLE_LABELS } from '../utils/questLogic';

interface InstagramFeedViewProps {
  user: UserProfile;
  quests: PhotoQuest[];
  onSelectQuest: (quest: PhotoQuest) => void;
  compact?: boolean;
}

export function InstagramFeedView({
  user,
  quests,
  onSelectQuest,
  compact = false,
}: InstagramFeedViewProps) {
  const completedWithPhoto = quests.filter((q) => q.status === 'completed' && q.photoUrl);
  const styleEntries = (Object.entries(user.styleCounts) as [StyleKey, number][]).sort(
    (a, b) => b[1] - a[1]
  );
  const maxScore = Math.max(1, ...styleEntries.map(([, val]) => val));

  return (
    <div className="space-y-5">
      {/* Equipment Card */}
      <section className="bg-[#13151C] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
            <Camera className="w-4 h-4" />
            <span>Equipamento Ativo</span>
          </div>
          <span className="text-xs text-zinc-400 font-mono-num">f=4.04mm · f/1.8</span>
        </div>

        <div className="rounded-xl overflow-hidden bg-[#0A0B0F] border border-white/8 aspect-[16/10]">
          <img
            src="/src/assets/images/camera_acrensly_1795044146430.jpg"
            alt="Câmera compacta Acrensly 8K da Julia"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-1">
          <h2 className="font-display text-base font-bold text-zinc-100">Acrensly 8K Compacta</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Tela Flip 3&quot; · Wi-Fi direto para celular · Lente fixa grande-angular f/1.8 ·
            Regra de ouro: zero zoom digital!
          </p>
        </div>
      </section>

      {/* Style Discovery Breakdown */}
      <section className="bg-[#13151C] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-purple-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Radar de Estilo Fotográfico</span>
          </p>
          <h2 className="font-display text-base font-bold text-zinc-100">
            {user.detected_style}
          </h2>
        </div>

        <div className="space-y-2.5">
          {styleEntries.map(([key, count]) => {
            const pct = Math.round((count / maxScore) * 100);
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300">{STYLE_LABELS[key]}</span>
                  <span className="font-mono-num text-zinc-400">{count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${count === 0 ? 0 : Math.max(12, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* @juliaphoto Feed Preview */}
      <section className="bg-[#13151C] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src={user.photoURL || '/assets/aistudio/Julia_foto_ae837286.jpg'}
              alt="Foto de perfil @juliaphoto"
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover border border-white/15"
            />
            <div>
              <p className="font-display text-sm font-bold text-zinc-50 flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-amber-400" />
                <span>@juliaphoto</span>
              </p>
              <p className="text-[11px] text-zinc-400 font-mono-num">
                {completedWithPhoto.length} publicações selecionadas
              </p>
            </div>
          </div>
        </div>

        {completedWithPhoto.length === 0 ? (
          <div className="rounded-xl bg-[#0A0B0F] border border-dashed border-white/12 p-5 text-center space-y-1.5">
            <p className="text-sm font-medium text-zinc-200">Seu feed está pronto para estrear</p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Envie sua primeira foto na trilha ao lado para montar a grade do @juliaphoto.
            </p>
          </div>
        ) : (
          <div className={`grid grid-cols-3 gap-1.5 ${compact ? '' : 'sm:gap-2.5'}`}>
            {completedWithPhoto.map((quest) => (
              <button
                key={quest.id}
                type="button"
                onClick={() => onSelectQuest(quest)}
                aria-label={`Ver foto da missão ${quest.title} no feed`}
                className="aspect-square rounded-lg overflow-hidden bg-[#0A0B0F] border border-white/10 hover:border-amber-400/60 transition-colors cursor-pointer"
              >
                <img
                  src={quest.photoUrl}
                  alt={quest.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
