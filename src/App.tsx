import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Sparkles, Trophy, X } from 'lucide-react';
import {
  addBonusQuestOnServer,
  completeQuestOnServer,
  fetchWorkspace,
  getOrCreateLocalProfileId,
  resetWorkspaceOnServer,
  saveWorkspaceBackup,
  sendTutorChatOnServer,
  type WorkspaceSnapshot,
} from './services/apiClient';
import type {
  Achievement,
  AppTab,
  PhotoEvaluationResult,
  PhotoQuest,
  QuestModule,
  SuggestedBonusQuest,
  TutorMessage,
  UserProfile,
} from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TopHeader } from './components/TopHeader';
import { BottomNav } from './components/BottomNav';
import { TrailMap } from './components/TrailMap';
import { QuestModal } from './components/QuestModal';
import { AchievementsGallery } from './components/AchievementsGallery';
import { TutorChat } from './components/TutorChat';
import { InstagramFeedView } from './components/InstagramFeedView';

interface CelebrationBanner {
  xpEarned: number;
  questTitle: string;
  unlockedAchievements: Achievement[];
}

function PhotoQuestApp() {
  const [profileId] = useState<string>(() => getOrCreateLocalProfileId());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [modules, setModules] = useState<QuestModule[]>([]);
  const [quests, setQuests] = useState<PhotoQuest[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [tutorMessages, setTutorMessages] = useState<TutorMessage[]>([]);

  const [activeTab, setActiveTab] = useState<AppTab>('trail');
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [pendingBonusQuest, setPendingBonusQuest] = useState<SuggestedBonusQuest | null>(null);
  const [isCreatingBonus, setIsCreatingBonus] = useState(false);
  const [celebration, setCelebration] = useState<CelebrationBanner | null>(null);

  const [tutorDraft, setTutorDraft] = useState<string | undefined>(undefined);
  const [isTutorSending, setIsTutorSending] = useState(false);
  const [tutorError, setTutorError] = useState<string | null>(null);

  const applyWorkspaceSnapshot = useCallback(
    (ws: WorkspaceSnapshot) => {
      setUserProfile(ws.userProfile);
      setModules(ws.modules);
      setQuests(ws.quests);
      setAchievements(ws.achievements);
      setTutorMessages(ws.tutorMessages);
      saveWorkspaceBackup(profileId, ws);
    },
    [profileId]
  );

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const ws = await fetchWorkspace(profileId);
      applyWorkspaceSnapshot(ws);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Erro ao conectar com o servidor da aplicação.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [profileId, applyWorkspaceSnapshot]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const selectedQuest = useMemo(
    () => quests.find((q) => q.id === selectedQuestId) ?? null,
    [quests, selectedQuestId]
  );

  const selectedQuestModuleTitle = useMemo(() => {
    if (!selectedQuest) return '';
    return modules.find((m) => m.id === selectedQuest.moduleId)?.title ?? 'Missão Fotográfica';
  }, [modules, selectedQuest]);

  const completedCount = useMemo(
    () => quests.filter((q) => q.status === 'completed').length,
    [quests]
  );

  const handleCompleteQuest = async (
    questId: string,
    photoDataUrl: string,
    evaluation: PhotoEvaluationResult
  ) => {
    const { workspace, outcome } = await completeQuestOnServer({
      profileId,
      questId,
      photoUrl: photoDataUrl,
      evaluation,
    });

    applyWorkspaceSnapshot(workspace);

    if (evaluation.suggestedBonusQuest?.title) {
      setPendingBonusQuest(evaluation.suggestedBonusQuest);
    }

    setCelebration({
      xpEarned: outcome.xpEarned,
      questTitle: outcome.completedQuest.title,
      unlockedAchievements: outcome.newlyUnlockedAchievements,
    });
  };

  const handleAcceptBonusQuest = async () => {
    if (!pendingBonusQuest) return;
    setIsCreatingBonus(true);
    try {
      const { workspace } = await addBonusQuestOnServer({
        profileId,
        suggestion: pendingBonusQuest,
      });
      applyWorkspaceSnapshot(workspace);
      setPendingBonusQuest(null);
    } finally {
      setIsCreatingBonus(false);
    }
  };

  const handleResetWorkspace = async () => {
    setIsResetting(true);
    try {
      const ws = await resetWorkspaceOnServer(profileId);
      applyWorkspaceSnapshot(ws);
      setSelectedQuestId(null);
      setCelebration(null);
      setPendingBonusQuest(null);
      setTutorError(null);
      setActiveTab('trail');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSendTutorMessage = async (
    text: string,
    imagePayload?: { dataUrl: string; mimeType: string }
  ) => {
    if (!userProfile) return;
    setTutorError(null);
    setIsTutorSending(true);

    const optimisticMsg: TutorMessage = {
      id: `optimistic_${Date.now()}`,
      userId: userProfile.uid,
      role: 'user',
      text,
    };

    const nextHistory = [...tutorMessages, optimisticMsg];
    setTutorMessages(nextHistory);

    try {
      const data = await sendTutorChatOnServer({
        profileId,
        messages: nextHistory.map((m) => ({ role: m.role, text: m.text })),
        userContext: {
          level: userProfile.level,
          totalXp: userProfile.totalXp,
          detected_style: userProfile.detected_style,
          completedCount,
          equipment: userProfile.equipment,
        },
        imageBase64: imagePayload?.dataUrl,
        mimeType: imagePayload?.mimeType,
      });

      setTutorMessages(data.tutorMessages);
      if (userProfile) {
        saveWorkspaceBackup(profileId, {
          userProfile,
          modules,
          quests,
          achievements,
          tutorMessages: data.tutorMessages,
        });
      }
    } catch (err) {
      setTutorMessages(tutorMessages);
      setTutorError(err instanceof Error ? err.message : 'Falha na comunicação com o Tutor IA.');
    } finally {
      setIsTutorSending(false);
    }
  };

  const handleAskTutorForCaption = (quest: PhotoQuest) => {
    setSelectedQuestId(null);
    setTutorDraft(
      `Crie 2 opções de legenda estilosas e hashtags para eu postar no @juliaphoto a foto da missão "${quest.title}" (estilo ${quest.styleTag}).`
    );
    setActiveTab('tutor');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0B0F] flex items-center justify-center text-zinc-200 p-6">
        <div className="flex items-center gap-2.5 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
          <span>Preparando trilha e câmera Acrensly 8K...</span>
        </div>
      </div>
    );
  }

  if (loadError || !userProfile) {
    return (
      <div className="min-h-screen bg-[#0A0B0F] flex items-center justify-center text-zinc-200 p-6">
        <div className="max-w-sm w-full bg-[#13151C] border border-white/10 rounded-2xl p-6 text-center space-y-4">
          <p className="text-sm text-rose-300">
            {loadError || 'Não foi possível inicializar sua trilha.'}
          </p>
          <button
            type="button"
            onClick={() => void loadWorkspace()}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm min-h-[44px] cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0B0F] text-zinc-100 pb-20 md:pb-10">
      <TopHeader
        user={userProfile}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onResetWorkspace={handleResetWorkspace}
        isResetting={isResetting}
      />

      <main className="max-w-6xl mx-auto px-3 sm:px-6 pt-6">
        {celebration && (
          <div
            role="status"
            className="mb-6 rounded-2xl bg-[#161925] border border-amber-400/40 p-4 flex items-start justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="font-display text-sm sm:text-base font-bold text-zinc-50 flex flex-wrap items-center gap-2">
                  <span>Missão concluída: {celebration.questTitle}</span>
                  <span className="font-mono-num text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />+{celebration.xpEarned} XP
                  </span>
                </p>
                {celebration.unlockedAchievements.length > 0 && (
                  <p className="text-xs text-purple-300 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      Nova medalha:{' '}
                      {celebration.unlockedAchievements.map((a) => a.title).join(', ')}
                    </span>
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCelebration(null)}
              aria-label="Fechar aviso de conquista"
              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {activeTab === 'trail' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8">
              <TrailMap
                user={userProfile}
                modules={modules}
                quests={quests}
                onSelectQuest={(quest) => setSelectedQuestId(quest.id)}
                pendingBonusQuest={pendingBonusQuest}
                onAcceptBonusQuest={handleAcceptBonusQuest}
                onDismissBonusQuest={() => setPendingBonusQuest(null)}
                isCreatingBonus={isCreatingBonus}
              />
            </div>

            <aside className="hidden lg:block lg:col-span-4 sticky top-20">
              <InstagramFeedView
                user={userProfile}
                quests={quests}
                onSelectQuest={(quest) => setSelectedQuestId(quest.id)}
                compact
              />
            </aside>
          </div>
        )}

        {activeTab === 'achievements' && (
          <AchievementsGallery achievements={achievements} />
        )}

        {activeTab === 'tutor' && (
          <div className="max-w-3xl mx-auto">
            <TutorChat
              user={userProfile}
              completedCount={completedCount}
              messages={tutorMessages}
              initialDraft={tutorDraft}
              onConsumeInitialDraft={() => setTutorDraft(undefined)}
              onSendMessage={handleSendTutorMessage}
              isSending={isTutorSending}
              errorMsg={tutorError}
            />
          </div>
        )}

        {activeTab === 'feed' && (
          <div className="max-w-3xl mx-auto">
            <InstagramFeedView
              user={userProfile}
              quests={quests}
              onSelectQuest={(quest) => setSelectedQuestId(quest.id)}
            />
          </div>
        )}
      </main>

      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />

      {selectedQuest && (
        <QuestModal
          quest={selectedQuest}
          moduleTitle={selectedQuestModuleTitle}
          currentStyle={userProfile.detected_style}
          onClose={() => setSelectedQuestId(null)}
          onCompleteQuest={handleCompleteQuest}
          onAskTutorForCaption={handleAskTutorForCaption}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <PhotoQuestApp />
    </ErrorBoundary>
  );
}
