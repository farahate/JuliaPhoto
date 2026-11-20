import type {
  Achievement,
  PhotoEvaluationResult,
  PhotoQuest,
  QuestModule,
  SuggestedBonusQuest,
  TutorMessage,
  UserProfile,
} from '../types';

export interface WorkspaceSnapshot {
  userProfile: UserProfile;
  modules: QuestModule[];
  quests: PhotoQuest[];
  achievements: Achievement[];
  tutorMessages: TutorMessage[];
}

const PROFILE_STORAGE_KEY = 'jpq_profile_id_v1';
const BACKUP_STORAGE_PREFIX = 'jpq_backup_v1_';

function getBackupKey(profileId: string): string {
  return `${BACKUP_STORAGE_PREFIX}${profileId}`;
}

export function saveWorkspaceBackup(profileId: string, snapshot: WorkspaceSnapshot): void {
  try {
    window.localStorage.setItem(getBackupKey(profileId), JSON.stringify(snapshot));
  } catch {
    // Ignore storage quota errors
  }
}

function readWorkspaceBackup(profileId: string): WorkspaceSnapshot | null {
  try {
    const raw = window.localStorage.getItem(getBackupKey(profileId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkspaceSnapshot;
    if (
      parsed &&
      parsed.userProfile &&
      Array.isArray(parsed.quests) &&
      Array.isArray(parsed.tutorMessages)
    ) {
      return parsed;
    }
  } catch {
    // Ignore invalid backup
  }
  return null;
}

function clearWorkspaceBackup(profileId: string): void {
  try {
    window.localStorage.removeItem(getBackupKey(profileId));
  } catch {
    // Ignore storage restrictions
  }
}

function hasSavedProgress(ws: WorkspaceSnapshot): boolean {
  return (
    ws.userProfile.totalXp > 0 ||
    ws.quests.some((q) => q.status === 'completed') ||
    ws.tutorMessages.length > 0
  );
}

export function getOrCreateLocalProfileId(): string {
  try {
    const existing = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (existing && /^[a-zA-Z0-9_\-]+$/.test(existing)) {
      return existing;
    }
    const created = `julia_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(PROFILE_STORAGE_KEY, created);
    return created;
  } catch {
    return 'julia_web';
  }
}

export async function fetchWorkspace(profileId: string): Promise<WorkspaceSnapshot> {
  const res = await fetch(`/api/workspace?profileId=${encodeURIComponent(profileId)}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Não foi possível carregar sua trilha.');
  }
  const serverWs = data as WorkspaceSnapshot;

  if (!hasSavedProgress(serverWs)) {
    const backup = readWorkspaceBackup(profileId);
    if (backup && hasSavedProgress(backup)) {
      try {
        const restoreRes = await fetch('/api/workspace/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId, snapshot: backup }),
        });
        if (restoreRes.ok) {
          return (await restoreRes.json()) as WorkspaceSnapshot;
        }
      } catch {
        // Fallback to local backup if restore fails transiently
        return backup;
      }
    }
  }

  return serverWs;
}

export async function completeQuestOnServer(params: {
  profileId: string;
  questId: string;
  photoUrl: string;
  evaluation: PhotoEvaluationResult;
}): Promise<{
  workspace: WorkspaceSnapshot;
  outcome: {
    xpEarned: number;
    completedQuest: PhotoQuest;
    newlyUnlockedAchievements: Achievement[];
  };
}> {
  const res = await fetch(`/api/quests/${encodeURIComponent(params.questId)}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profileId: params.profileId,
      photoUrl: params.photoUrl,
      evaluation: params.evaluation,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao salvar progresso da missão.');
  }
  return data;
}

export async function addBonusQuestOnServer(params: {
  profileId: string;
  suggestion: SuggestedBonusQuest;
}): Promise<{ workspace: WorkspaceSnapshot; bonusQuest: PhotoQuest }> {
  const res = await fetch('/api/quests/bonus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao adicionar missão bônus.');
  }
  return data;
}

export async function resetWorkspaceOnServer(profileId: string): Promise<WorkspaceSnapshot> {
  clearWorkspaceBackup(profileId);
  const res = await fetch('/api/workspace/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao reiniciar trilha.');
  }
  return data as WorkspaceSnapshot;
}

export async function sendTutorChatOnServer(params: {
  profileId: string;
  messages: Array<{ role: 'user' | 'assistant'; text: string }>;
  userContext: {
    level: number;
    totalXp: number;
    detected_style: string;
    completedCount: number;
    equipment: string;
  };
  imageBase64?: string;
  mimeType?: string;
}): Promise<{ reply: string; tutorMessages: TutorMessage[] }> {
  const res = await fetch('/api/tutor-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Não foi possível obter resposta do Tutor IA.');
  }
  return data;
}
