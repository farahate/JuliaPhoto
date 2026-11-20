import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { WorkspaceStore, normalizeProfileId } from './store.ts';

test('normalizeProfileId sanitizes unsafe characters and defaults empty values', () => {
  assert.equal(normalizeProfileId(''), 'julia');
  assert.equal(normalizeProfileId('julia@test!#1'), 'julia_test__1');
});

test('WorkspaceStore seeds, completes quests, adds bonus quest, saves chat, and resets cleanly', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jpq-store-'));
  const dbPath = path.join(tmpDir, 'db.json');
  const store = new WorkspaceStore(dbPath);

  try {
    const ws1 = await store.getOrSeedWorkspace('julia_ci');
    assert.equal(ws1.modules.length, 5);
    assert.equal(ws1.quests.length, 15);
    assert.equal(ws1.achievements.length, 10);
    assert.equal(ws1.userProfile.totalXp, 0);

    // Complete first quest
    const q1 = ws1.quests[0];
    const { workspace: ws2, outcome } = await store.completeQuest({
      profileId: 'julia_ci',
      questId: q1.id,
      photoUrl: 'data:image/jpeg;base64,abc',
      evaluation: {
        approved: true,
        strength: 'Enquadramento limpo!',
        suggestion: 'Tente luz lateral.',
        mentorMessage: 'Ótimo começo!',
        detectedTags: ['digicam'],
      },
    });

    assert.equal(outcome.xpEarned, 110);
    assert.equal(ws2.userProfile.totalXp, 110);
    assert.equal(ws2.quests[0].status, 'completed');
    assert.equal(ws2.quests[1].status, 'unlocked');
    assert.notEqual(ws2.achievements.find((a) => a.code === 'first_click')?.unlocked_at, '');

    // Add bonus quest
    const { workspace: ws3, bonusQuest } = await store.addBonusQuest({
      profileId: 'julia_ci',
      suggestion: {
        title: 'Flash Retrô no Espelho',
        description: 'Faça um clique noturno usando o flash.',
        cameraTip: 'Fique a 1.5m do espelho.',
        styleTag: 'digicam',
      },
    });
    assert.equal(ws3.quests.length, 16);
    assert.equal(bonusQuest.isBonus, true);
    assert.equal(bonusQuest.status, 'unlocked');

    // Append tutor messages
    const msgs = await store.appendTutorMessages('julia_ci', [
      { role: 'user', text: 'Como usar f/1.8?' },
      { role: 'assistant', text: 'Aproxime do objeto!' },
    ]);
    assert.equal(msgs.length, 2);

    // Reload via new store instance to verify disk persistence
    const storeReloaded = new WorkspaceStore(dbPath);
    const persisted = await storeReloaded.getOrSeedWorkspace('julia_ci');
    assert.equal(persisted.userProfile.totalXp, 110);
    assert.equal(persisted.quests.length, 16);
    assert.equal(persisted.tutorMessages.length, 2);

    // Reset workspace
    const resetWs = await storeReloaded.resetWorkspace('julia_ci');
    assert.equal(resetWs.userProfile.totalXp, 0);
    assert.equal(resetWs.quests.length, 15);
    assert.equal(resetWs.tutorMessages.length, 0);

    // Restore workspace from backup snapshot (e.g., after ephemeral container restart)
    const restoredWs = await storeReloaded.restoreWorkspace('julia_ci', {
      ...ws3,
      tutorMessages: msgs,
    });
    assert.equal(restoredWs.userProfile.totalXp, 110);
    assert.equal(restoredWs.quests.length, 16);
    assert.equal(restoredWs.tutorMessages.length, 2);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});
