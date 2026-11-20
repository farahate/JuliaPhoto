import fs from 'node:fs/promises';
import path from 'node:path';
import { createSeedBundleForUser, DEFAULT_AVATAR_URL } from '../src/data/initialSeedData.js';
import type {
  Achievement,
  PhotoEvaluationResult,
  PhotoQuest,
  QuestModule,
  SuggestedBonusQuest,
  TutorMessage,
  UserProfile,
} from '../src/types.ts';
import { applyQuestCompletion, sanitizeText } from '../src/utils/questLogic.ts';

export interface WorkspaceData {
  userProfile: UserProfile;
  modules: QuestModule[];
  quests: PhotoQuest[];
  achievements: Achievement[];
  tutorMessages: TutorMessage[];
}

interface DatabaseSchema {
  workspaces: Record<string, WorkspaceData>;
}

const DEFAULT_DB_PATH = path.resolve(process.cwd(), '.data', 'julia-photo-quest.json');

export function normalizeProfileId(rawId?: string | null): string {
  const cleaned = String(rawId || 'julia')
    .trim()
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 64);
  return cleaned || 'julia';
}

export class WorkspaceStore {
  private dbPath: string;
  private writeChain: Promise<void> = Promise.resolve();

  constructor(dbPath: string = DEFAULT_DB_PATH) {
    this.dbPath = dbPath;
  }

  private async readDb(): Promise<DatabaseSchema> {
    try {
      const raw = await fs.readFile(this.dbPath, 'utf8');
      const parsed = JSON.parse(raw) as DatabaseSchema;
      if (parsed && typeof parsed.workspaces === 'object' && parsed.workspaces !== null) {
        return parsed;
      }
    } catch {
      // File missing or unreadable -> initialize fresh
    }
    return { workspaces: {} };
  }

  private async writeDb(db: DatabaseSchema): Promise<void> {
    await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
    const tmpPath = `${this.dbPath}.tmp.${Date.now()}`;
    await fs.writeFile(tmpPath, JSON.stringify(db, null, 2), 'utf8');
    await fs.rename(tmpPath, this.dbPath);
  }

  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.writeChain.then(fn, fn);
    this.writeChain = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  private createFreshWorkspace(profileId: string): WorkspaceData {
    const seed = createSeedBundleForUser(profileId, 'Julia', DEFAULT_AVATAR_URL);
    return {
      userProfile: seed.userProfile as UserProfile,
      modules: seed.modules as QuestModule[],
      quests: seed.quests as PhotoQuest[],
      achievements: seed.achievements as Achievement[],
      tutorMessages: [],
    };
  }

  async getOrSeedWorkspace(rawProfileId?: string | null): Promise<WorkspaceData> {
    const profileId = normalizeProfileId(rawProfileId);
    return this.enqueue(async () => {
      const db = await this.readDb();
      if (!db.workspaces[profileId]) {
        db.workspaces[profileId] = this.createFreshWorkspace(profileId);
        await this.writeDb(db);
      } else if (
        !db.workspaces[profileId].userProfile.photoURL ||
        db.workspaces[profileId].userProfile.photoURL ===
          '/src/assets/images/julia_avatar_1795044145658.jpg'
      ) {
        db.workspaces[profileId].userProfile.photoURL = DEFAULT_AVATAR_URL;
        await this.writeDb(db);
      }
      return db.workspaces[profileId];
    });
  }

  async resetWorkspace(rawProfileId?: string | null): Promise<WorkspaceData> {
    const profileId = normalizeProfileId(rawProfileId);
    return this.enqueue(async () => {
      const db = await this.readDb();
      const fresh = this.createFreshWorkspace(profileId);
      db.workspaces[profileId] = fresh;
      await this.writeDb(db);
      return fresh;
    });
  }

  async restoreWorkspace(
    rawProfileId: string | null | undefined,
    snapshot: WorkspaceData
  ): Promise<WorkspaceData> {
    const profileId = normalizeProfileId(rawProfileId);
    if (
      !snapshot ||
      !snapshot.userProfile ||
      !Array.isArray(snapshot.modules) ||
      !Array.isArray(snapshot.quests) ||
      !Array.isArray(snapshot.achievements) ||
      !Array.isArray(snapshot.tutorMessages)
    ) {
      throw new Error('Snapshot inválido para restauração.');
    }

    return this.enqueue(async () => {
      const db = await this.readDb();
      const restored: WorkspaceData = {
        userProfile: {
          ...snapshot.userProfile,
          uid: profileId,
          photoURL:
            !snapshot.userProfile.photoURL ||
            snapshot.userProfile.photoURL === '/src/assets/images/julia_avatar_1795044145658.jpg'
              ? DEFAULT_AVATAR_URL
              : snapshot.userProfile.photoURL,
        },
        modules: snapshot.modules,
        quests: snapshot.quests,
        achievements: snapshot.achievements,
        tutorMessages: snapshot.tutorMessages.slice(-60),
      };
      db.workspaces[profileId] = restored;
      await this.writeDb(db);
      return restored;
    });
  }

  async completeQuest(params: {
    profileId?: string | null;
    questId: string;
    photoUrl: string;
    evaluation: PhotoEvaluationResult;
  }) {
    const profileId = normalizeProfileId(params.profileId);
    return this.enqueue(async () => {
      const db = await this.readDb();
      const ws = db.workspaces[profileId] ?? this.createFreshWorkspace(profileId);

      const outcome = applyQuestCompletion({
        user: ws.userProfile,
        quests: ws.quests,
        achievements: ws.achievements,
        questId: params.questId,
        photoUrl: params.photoUrl,
        evaluation: params.evaluation,
      });

      const updatedWs: WorkspaceData = {
        ...ws,
        userProfile: outcome.updatedUser,
        quests: outcome.updatedQuests,
        achievements: outcome.updatedAchievements,
      };

      db.workspaces[profileId] = updatedWs;
      await this.writeDb(db);

      return { workspace: updatedWs, outcome };
    });
  }

  async addBonusQuest(params: {
    profileId?: string | null;
    suggestion: SuggestedBonusQuest;
  }): Promise<{ workspace: WorkspaceData; bonusQuest: PhotoQuest }> {
    const profileId = normalizeProfileId(params.profileId);
    return this.enqueue(async () => {
      const db = await this.readDb();
      const ws = db.workspaces[profileId] ?? this.createFreshWorkspace(profileId);
      const targetModule = ws.modules[ws.modules.length - 1];
      const nextOrder = Math.max(15, ...ws.quests.map((q) => q.order)) + 1;
      const validStyle =
        params.suggestion.styleTag === 'retrato' ||
        params.suggestion.styleTag === 'natureza' ||
        params.suggestion.styleTag === 'street' ||
        params.suggestion.styleTag === 'macro' ||
        params.suggestion.styleTag === 'digicam'
          ? params.suggestion.styleTag
          : 'digicam';

      const bonusQuest: PhotoQuest = {
        id: `${profileId}_bonus_${Date.now()}`,
        userId: profileId,
        moduleId: targetModule.id,
        order: nextOrder,
        title: sanitizeText(params.suggestion.title, 95) || 'Missão Bônus de Estilo',
        description:
          sanitizeText(params.suggestion.description, 380) ||
          'Explore esse estilo que combinou com você fazendo um clique criativo hoje.',
        cameraTip:
          sanitizeText(params.suggestion.cameraTip, 330) ||
          'Use a lente f/1.8 sem zoom digital e trave o foco com meio-clique.',
        xpReward: 120,
        status: 'unlocked',
        styleTag: validStyle,
        isBonus: true,
        photoUrl: '',
        aiStrength: '',
        aiSuggestion: '',
        aiMentorMessage: '',
        aiDetectedTags: [],
        completedAt: '',
      };

      const updatedWs: WorkspaceData = {
        ...ws,
        quests: [...ws.quests, bonusQuest],
      };

      db.workspaces[profileId] = updatedWs;
      await this.writeDb(db);

      return { workspace: updatedWs, bonusQuest };
    });
  }

  async appendTutorMessages(
    rawProfileId: string | null | undefined,
    entries: Array<{ role: 'user' | 'assistant'; text: string }>
  ): Promise<TutorMessage[]> {
    const profileId = normalizeProfileId(rawProfileId);
    return this.enqueue(async () => {
      const db = await this.readDb();
      const ws = db.workspaces[profileId] ?? this.createFreshWorkspace(profileId);
      const nowIso = new Date().toISOString();

      const newMessages: TutorMessage[] = entries.map((entry, idx) => ({
        id: `${profileId}_msg_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        userId: profileId,
        role: entry.role,
        text: sanitizeText(entry.text, 2450),
        createdAtIso: nowIso,
      }));

      const updatedMessages = [...ws.tutorMessages, ...newMessages].slice(-60);
      db.workspaces[profileId] = {
        ...ws,
        tutorMessages: updatedMessages,
      };
      await this.writeDb(db);
      return updatedMessages;
    });
  }
}
