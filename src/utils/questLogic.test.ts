import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyQuestCompletion,
  calculateLevel,
  computeDetectedStyle,
  computeQuestNodeOffset,
  computeUpdatedStreak,
  levelProgressPercent,
} from './questLogic';
import { createSeedBundleForUser } from '../data/initialSeedData';

test('seed bundle generates 5 modules, 15 quests with only #1 unlocked, and 10 locked achievements', () => {
  const seed = createSeedBundleForUser('julia_test_1', 'Julia', '');
  assert.equal(seed.modules.length, 5);
  assert.equal(seed.quests.length, 15);
  assert.equal(seed.achievements.length, 10);
  assert.equal(seed.quests[0].status, 'unlocked');
  assert.equal(seed.quests.slice(1).every((q) => q.status === 'locked'), true);
  assert.equal(seed.achievements.every((a) => a.unlocked_at === ''), true);
});

test('level and XP progress math works deterministically', () => {
  assert.equal(calculateLevel(0), 1);
  assert.equal(calculateLevel(249), 1);
  assert.equal(calculateLevel(250), 2);
  assert.equal(calculateLevel(520), 3);
  assert.equal(levelProgressPercent(125), 50);
});

test('computeDetectedStyle picks dominant style or defaults to Em Descoberta', () => {
  assert.equal(
    computeDetectedStyle({ retrato: 0, natureza: 0, street: 0, macro: 0, digicam: 0 }),
    'Em Descoberta'
  );
  assert.equal(
    computeDetectedStyle({ retrato: 1, natureza: 0, street: 2, macro: 0, digicam: 4 }),
    'Estética Digicam Y2K'
  );
});

test('applyQuestCompletion awards XP, unlocks next quest, updates style, and unlocks Primeiro Clique', () => {
  const seed = createSeedBundleForUser('julia_test_2', 'Julia', '');
  const firstQuest = seed.quests[0];

  const result = applyQuestCompletion({
    user: seed.userProfile as any,
    quests: seed.quests as any,
    achievements: seed.achievements as any,
    questId: firstQuest.id,
    photoUrl: 'data:image/jpeg;base64,fake',
    evaluation: {
      approved: true,
      strength: 'Enquadramento limpo sem zoom digital!',
      suggestion: 'Tente baixar um pouco o ângulo na próxima.',
      mentorMessage: 'Mandou super bem no primeiro clique!',
      detectedTags: ['digicam', 'street'],
    },
    nowIso: '2026-11-18T16:00:00.000Z',
  });

  assert.equal(result.completedQuest.status, 'completed');
  assert.equal(result.unlockedNextQuest?.id, seed.quests[1].id);
  assert.equal(result.unlockedNextQuest?.status, 'unlocked');
  assert.equal(result.newlyUnlockedAchievements.some((a) => a.code === 'first_click'), true);
  // 60 quest XP + 50 first_click bonus XP = 110
  assert.equal(result.xpEarned, 110);
  assert.equal(result.updatedUser.totalXp, 110);
  assert.equal(result.updatedUser.styleCounts.digicam, 1);
});

test('applyQuestCompletion blocks re-completing an already completed quest', () => {
  const seed = createSeedBundleForUser('julia_test_3', 'Julia', '');
  const firstQuest = seed.quests[0];
  const pass1 = applyQuestCompletion({
    user: seed.userProfile as any,
    quests: seed.quests as any,
    achievements: seed.achievements as any,
    questId: firstQuest.id,
    photoUrl: 'data:image/jpeg;base64,fake',
    evaluation: {
      approved: true,
      strength: 'Ótima luz.',
      suggestion: 'Aproxime mais.',
      mentorMessage: 'Boa!',
      detectedTags: ['street'],
    },
  });

  assert.throws(() => {
    applyQuestCompletion({
      user: pass1.updatedUser,
      quests: pass1.updatedQuests,
      achievements: pass1.updatedAchievements,
      questId: firstQuest.id,
      photoUrl: 'data:image/jpeg;base64,fake',
      evaluation: {
        approved: true,
        strength: 'x',
        suggestion: 'y',
        mentorMessage: 'z',
        detectedTags: ['street'],
      },
    });
  });
});

test('streak increments on consecutive day and resets after gap', () => {
  assert.equal(computeUpdatedStreak(2, '2026-11-17', '2026-11-18'), 3);
  assert.equal(computeUpdatedStreak(5, '2026-11-18', '2026-11-18'), 5);
  assert.equal(computeUpdatedStreak(5, '2026-11-10', '2026-11-18'), 1);
});

test('winding trail offset returns deterministic symmetric coordinates', () => {
  assert.equal(computeQuestNodeOffset(0), 0);
  assert.equal(computeQuestNodeOffset(1), -52);
  assert.equal(computeQuestNodeOffset(2), 52);
});
