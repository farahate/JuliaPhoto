export type StyleKey = 'retrato' | 'natureza' | 'street' | 'macro' | 'digicam';

export type StyleCounts = Record<StyleKey, number>;

export type QuestStatus = 'locked' | 'unlocked' | 'completed';

export type ModuleAccent = 'amber' | 'purple' | 'emerald' | 'rose' | 'cyan';

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  totalXp: number;
  level: number;
  streak: number;
  equipment: string;
  detected_style: string;
  styleCounts: StyleCounts;
  lastActiveDate: string;
}

export interface QuestModule {
  id: string;
  userId: string;
  order: number;
  title: string;
  subtitle: string;
  accent: ModuleAccent;
  icon: string;
  isBonus: boolean;
}

export interface PhotoQuest {
  id: string;
  userId: string;
  moduleId: string;
  order: number;
  title: string;
  description: string;
  cameraTip: string;
  xpReward: number;
  status: QuestStatus;
  styleTag: StyleKey;
  isBonus: boolean;
  photoUrl: string;
  aiStrength: string;
  aiSuggestion: string;
  aiMentorMessage: string;
  aiDetectedTags: string[];
  completedAt: string;
}

export interface Achievement {
  id: string;
  userId: string;
  code: string;
  title: string;
  description: string;
  badge_icon: string;
  condition: string;
  targetCount: number;
  currentCount: number;
  xp_bonus: number;
  unlocked_at: string;
}

export interface TutorMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  text: string;
  createdAtIso?: string;
}

export interface SuggestedBonusQuest {
  title: string;
  description: string;
  cameraTip: string;
  styleTag: StyleKey;
}

export interface PhotoEvaluationResult {
  approved: boolean;
  strength: string;
  suggestion: string;
  mentorMessage: string;
  detectedTags: StyleKey[];
  suggestedBonusQuest?: SuggestedBonusQuest | null;
}

export type AppTab = 'trail' | 'achievements' | 'tutor' | 'feed';
