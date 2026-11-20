import type {
  Achievement,
  PhotoEvaluationResult,
  PhotoQuest,
  StyleCounts,
  StyleKey,
  UserProfile,
} from '../types';

export const STYLE_LABELS: Record<StyleKey, string> = {
  retrato: 'Retrato Natural',
  natureza: 'Natureza & Luz',
  street: 'Street & Ângulos',
  macro: 'Macro & Detalhes',
  digicam: 'Estética Digicam Y2K',
};

export function calculateLevel(totalXp: number): number {
  const safeXp = Math.max(0, Math.floor(totalXp));
  return Math.floor(safeXp / 250) + 1;
}

export function levelProgressPercent(totalXp: number): number {
  const safeXp = Math.max(0, Math.floor(totalXp));
  const currentInLevel = safeXp % 250;
  return Math.round((currentInLevel / 250) * 100);
}

export function xpRemainingInLevel(totalXp: number): number {
  const safeXp = Math.max(0, Math.floor(totalXp));
  return 250 - (safeXp % 250);
}

export function computeDetectedStyle(styleCounts: StyleCounts): string {
  const entries = Object.entries(styleCounts) as [StyleKey, number][];
  let topKey: StyleKey | null = null;
  let topCount = 0;

  for (const [key, count] of entries) {
    if (count > topCount) {
      topCount = count;
      topKey = key;
    }
  }

  if (!topKey || topCount === 0) {
    return 'Em Descoberta';
  }
  return STYLE_LABELS[topKey];
}

export function sanitizeText(value: string, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

export function computeQuestNodeOffset(indexInModule: number): number {
  const pattern = [0, -52, 52, -32, 40];
  return pattern[indexInModule % pattern.length];
}

export function computeUpdatedStreak(currentStreak: number, lastActiveDate: string, todayIsoDate: string): number {
  if (!lastActiveDate) return Math.max(1, currentStreak);
  if (lastActiveDate === todayIsoDate) {
    return Math.max(1, currentStreak);
  }
  const prev = new Date(`${lastActiveDate}T00:00:00Z`).getTime();
  const curr = new Date(`${todayIsoDate}T00:00:00Z`).getTime();
  const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) {
    return currentStreak + 1;
  }
  if (diffDays > 1) {
    return 1;
  }
  return Math.max(1, currentStreak);
}

export interface QuestCompletionInput {
  user: UserProfile;
  quests: PhotoQuest[];
  achievements: Achievement[];
  questId: string;
  photoUrl: string;
  evaluation: PhotoEvaluationResult;
  nowIso?: string;
}

export interface QuestCompletionOutput {
  updatedUser: UserProfile;
  completedQuest: PhotoQuest;
  unlockedNextQuest: PhotoQuest | null;
  updatedQuests: PhotoQuest[];
  newlyUnlockedAchievements: Achievement[];
  updatedAchievements: Achievement[];
  xpEarned: number;
}

export function applyQuestCompletion(input: QuestCompletionInput): QuestCompletionOutput {
  const { user, quests, achievements, questId, photoUrl, evaluation } = input;
  const nowIso = input.nowIso ?? new Date().toISOString();
  const todayDate = nowIso.slice(0, 10);

  const targetQuest = quests.find((q) => q.id === questId);
  if (!targetQuest) {
    throw new Error(`Quest não encontrada: ${questId}`);
  }
  if (targetQuest.status !== 'unlocked') {
    throw new Error(`Quest ${questId} não está desbloqueada (status atual: ${targetQuest.status})`);
  }

  const validTags: StyleKey[] = (evaluation.detectedTags || [])
    .filter((tag): tag is StyleKey =>
      tag === 'retrato' || tag === 'natureza' || tag === 'street' || tag === 'macro' || tag === 'digicam'
    )
    .slice(0, 3);

  const tagsToRecord: StyleKey[] = validTags.length > 0 ? validTags : [targetQuest.styleTag];

  const completedQuest: PhotoQuest = {
    ...targetQuest,
    status: 'completed',
    photoUrl: sanitizeText(photoUrl, 395000),
    aiStrength: sanitizeText(evaluation.strength, 390),
    aiSuggestion: sanitizeText(evaluation.suggestion, 390),
    aiMentorMessage: sanitizeText(evaluation.mentorMessage, 590),
    aiDetectedTags: tagsToRecord,
    completedAt: nowIso.slice(0, 38),
  };

  // Find next locked quest in ascending order
  const sortedQuests = [...quests].sort((a, b) => a.order - b.order);
  const nextLocked = sortedQuests.find((q) => q.order > targetQuest.order && q.status === 'locked') || null;
  const unlockedNextQuest: PhotoQuest | null = nextLocked
    ? { ...nextLocked, status: 'unlocked' }
    : null;

  const updatedQuests = quests.map((q) => {
    if (q.id === completedQuest.id) return completedQuest;
    if (unlockedNextQuest && q.id === unlockedNextQuest.id) return unlockedNextQuest;
    return q;
  });

  // Update style counts
  const nextStyleCounts: StyleCounts = { ...user.styleCounts };
  for (const tag of tagsToRecord) {
    nextStyleCounts[tag] = (nextStyleCounts[tag] || 0) + 1;
  }

  const completedList = updatedQuests.filter((q) => q.status === 'completed');
  const completedCount = completedList.length;

  // Compute achievements progress
  const newlyUnlockedAchievements: Achievement[] = [];
  let achievementBonusXp = 0;

  const updatedAchievements = achievements.map((ach) => {
    if (ach.unlocked_at !== '') {
      return ach;
    }

    let nextCount = ach.currentCount;
    switch (ach.code) {
      case 'first_click':
        nextCount = Math.min(ach.targetCount, completedCount);
        break;
      case 'no_digital_zoom': {
        const mod1Done = completedList.filter((q) => q.order >= 1 && q.order <= 3).length;
        nextCount = Math.min(ach.targetCount, mod1Done);
        break;
      }
      case 'golden_hour': {
        const done = completedList.some((q) => q.title.includes('Golden Hour'));
        nextCount = done ? 1 : 0;
        break;
      }
      case 'low_angle': {
        const done = completedList.some((q) => q.title.includes('Ângulo Baixo'));
        nextCount = done ? 1 : 0;
        break;
      }
      case 'digicam_y2k': {
        nextCount = Math.min(ach.targetCount, nextStyleCounts.digicam);
        break;
      }
      case 'macro_eye': {
        nextCount = Math.min(ach.targetCount, nextStyleCounts.macro);
        break;
      }
      case 'portrait_soul': {
        nextCount = Math.min(ach.targetCount, nextStyleCounts.retrato);
        break;
      }
      case 'streak_3': {
        nextCount = Math.min(ach.targetCount, completedCount);
        break;
      }
      case 'feed_debut': {
        const done = completedList.some((q) => q.title.includes('Estreia no Feed'));
        nextCount = done ? 1 : 0;
        break;
      }
      case 'all_modules': {
        nextCount = Math.min(ach.targetCount, completedCount);
        break;
      }
      default:
        break;
    }

    const justUnlocked = nextCount >= ach.targetCount;
    const updatedAch: Achievement = {
      ...ach,
      currentCount: nextCount,
      unlocked_at: justUnlocked ? nowIso.slice(0, 38) : '',
    };

    if (justUnlocked) {
      newlyUnlockedAchievements.push(updatedAch);
      achievementBonusXp += ach.xp_bonus;
    }

    return updatedAch;
  });

  const xpEarned = targetQuest.xpReward + achievementBonusXp;
  const nextTotalXp = user.totalXp + xpEarned;
  const nextLevel = calculateLevel(nextTotalXp);
  const nextStreak = computeUpdatedStreak(user.streak, user.lastActiveDate, todayDate);

  const updatedUser: UserProfile = {
    ...user,
    totalXp: nextTotalXp,
    level: nextLevel,
    streak: nextStreak,
    styleCounts: nextStyleCounts,
    detected_style: computeDetectedStyle(nextStyleCounts),
    lastActiveDate: todayDate,
  };

  return {
    updatedUser,
    completedQuest,
    unlockedNextQuest,
    updatedQuests,
    newlyUnlockedAchievements,
    updatedAchievements,
    xpEarned,
  };
}
