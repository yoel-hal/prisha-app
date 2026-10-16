/**
 * Firestore security rules tests. Run against the local emulator only:
 *   npm run test:rules
 */
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteField,
  writeBatch,
} from 'firebase/firestore';

const OWNER = 'owner-uid';
const PARTNER = 'partner-uid';
const STRANGER = 'stranger-uid';
const COUPLE = 'couple-1';
const TOKEN = 'ABCDEFGH2345';

let env: RulesTestEnvironment;

function db(uid: string | null) {
  return uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore();
}

async function seed(partnerAccess: Record<string, unknown>) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const admin = ctx.firestore();
    await setDoc(doc(admin, 'users', OWNER), { coupleId: COUPLE });
    await setDoc(doc(admin, 'couples', COUPLE), { members: [OWNER] });
    await setDoc(doc(admin, 'couples', COUPLE, 'periods', 'p1'), {
      dateGregorian: '2026-10-01',
      dateHebrew: { year: 5787, month: 7, day: 19 },
      onah: 'day',
      createdAt: '2026-10-01T10:00:00.000Z',
      createdBy: OWNER,
    });
    await setDoc(doc(admin, 'couples', COUPLE, 'settings', 's1'), { minhag: 'ashkenaz' });
    await setDoc(doc(admin, 'users', OWNER, 'partnerAccess', 'current'), {
      token: TOKEN,
      pinHash: 'hash',
      isActive: true,
      coupleId: COUPLE,
      ownerName: 'Owner',
      partnerLastSeen: null,
      partnerUid: null,
      ...partnerAccess,
    });
    await setDoc(doc(admin, 'partnerTokens', TOKEN), { ownerId: OWNER });
  });
}

const periodRef = (uid: string | null) => doc(db(uid), 'couples', COUPLE, 'periods', 'p1');
const accessRef = (uid: string | null) => doc(db(uid), 'users', OWNER, 'partnerAccess', 'current');

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-prisha-rules',
    firestore: { rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8') },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

describe('couple data with partner access active', () => {
  test('a stranger cannot read or write periods once a partner is linked', async () => {
    await seed({ partnerUid: PARTNER });
    await assertFails(getDoc(periodRef(STRANGER)));
    await assertFails(updateDoc(periodRef(STRANGER), { onah: 'night' }));
    await assertFails(getDoc(doc(db(STRANGER), 'couples', COUPLE, 'settings', 's1')));
  });

  test('a stranger cannot read periods while the invite is unclaimed', async () => {
    await seed({});
    await assertFails(getDoc(periodRef(STRANGER)));
    await assertFails(getDocs(collection(db(STRANGER), 'couples', COUPLE, 'periods')));
  });

  test('the linked partner can read and write periods and settings', async () => {
    await seed({ partnerUid: PARTNER });
    await assertSucceeds(getDoc(periodRef(PARTNER)));
    await assertSucceeds(getDocs(collection(db(PARTNER), 'couples', COUPLE, 'periods')));
    await assertSucceeds(updateDoc(periodRef(PARTNER), { onah: 'night' }));
    await assertSucceeds(getDoc(doc(db(PARTNER), 'couples', COUPLE, 'settings', 's1')));
  });

  test('the partner loses access when the owner revokes it', async () => {
    await seed({ partnerUid: PARTNER, isActive: false });
    await assertFails(getDoc(periodRef(PARTNER)));
  });

  test('couple members keep full access', async () => {
    await seed({ partnerUid: PARTNER });
    await assertSucceeds(getDoc(periodRef(OWNER)));
    await assertSucceeds(updateDoc(periodRef(OWNER), { onah: 'night' }));
  });

  test('signed-out users get nothing', async () => {
    await seed({ partnerUid: PARTNER });
    await assertFails(getDoc(periodRef(null)));
    await assertFails(getDoc(accessRef(null)));
    await assertFails(getDoc(doc(db(null), 'partnerTokens', TOKEN)));
  });
});

describe('partnerTokens', () => {
  test('nobody can list all tokens', async () => {
    await seed({});
    await assertFails(getDocs(collection(db(STRANGER), 'partnerTokens')));
    await assertFails(getDocs(collection(db(OWNER), 'partnerTokens')));
  });

  test('someone holding the token can look it up', async () => {
    await seed({});
    await assertSucceeds(getDoc(doc(db(STRANGER), 'partnerTokens', TOKEN)));
  });

  test("a stranger cannot overwrite, delete or forge someone else's token", async () => {
    await seed({});
    await assertFails(setDoc(doc(db(STRANGER), 'partnerTokens', TOKEN), { ownerId: STRANGER }));
    await assertFails(deleteDoc(doc(db(STRANGER), 'partnerTokens', TOKEN)));
    await assertFails(setDoc(doc(db(STRANGER), 'partnerTokens', 'NEWTOKEN0000'), { ownerId: OWNER }));
  });

  test('the owner can create and delete their own token', async () => {
    await seed({});
    await assertSucceeds(setDoc(doc(db(OWNER), 'partnerTokens', 'NEWTOKEN0000'), { ownerId: OWNER }));
    await assertSucceeds(deleteDoc(doc(db(OWNER), 'partnerTokens', TOKEN)));
  });
});

describe('partnerAccess', () => {
  test('once claimed, only the owner and the linked partner can read it', async () => {
    await seed({ partnerUid: PARTNER });
    await assertSucceeds(getDoc(accessRef(OWNER)));
    await assertSucceeds(getDoc(accessRef(PARTNER)));
    await assertFails(getDoc(accessRef(STRANGER)));
  });

  test('an unclaimed active invite can be read to join it', async () => {
    await seed({});
    await assertSucceeds(getDoc(accessRef(STRANGER)));
  });

  test('a revoked invite cannot be read by others', async () => {
    await seed({ isActive: false });
    await assertFails(getDoc(accessRef(STRANGER)));
  });

  test('a user can claim an unclaimed invite for themselves only', async () => {
    await seed({});
    await assertFails(
      setDoc(accessRef(STRANGER), { partnerUid: OWNER, partnerConnectedAt: 'now' }, { merge: true }),
    );
    await assertSucceeds(
      setDoc(
        accessRef(PARTNER),
        { partnerUid: PARTNER, isActive: true, partnerConnectedAt: 'now', partnerLastSeen: 'now' },
        { merge: true },
      ),
    );
  });

  test('a claimed invite cannot be taken over', async () => {
    await seed({ partnerUid: PARTNER });
    await assertFails(
      setDoc(accessRef(STRANGER), { partnerUid: STRANGER, partnerConnectedAt: 'now' }, { merge: true }),
    );
  });

  test('a claimer cannot change the token, PIN or couple', async () => {
    await seed({});
    await assertFails(
      setDoc(accessRef(STRANGER), { partnerUid: STRANGER, coupleId: 'other' }, { merge: true }),
    );
    await assertFails(
      setDoc(accessRef(STRANGER), { partnerUid: STRANGER, pinHash: 'x' }, { merge: true }),
    );
  });

  test('only the linked partner can update last-seen', async () => {
    await seed({ partnerUid: PARTNER });
    await assertFails(setDoc(accessRef(STRANGER), { partnerLastSeen: 'now' }, { merge: true }));
    await assertSucceeds(setDoc(accessRef(PARTNER), { partnerLastSeen: 'now' }, { merge: true }));
  });

  test('the owner can revoke and recreate access', async () => {
    await seed({ partnerUid: PARTNER });
    await assertSucceeds(setDoc(accessRef(OWNER), { isActive: false }, { merge: true }));
    await assertSucceeds(
      setDoc(accessRef(OWNER), { token: 'NEWTOKEN0000', pinHash: 'h', isActive: true, coupleId: COUPLE }),
    );
  });
});

describe('couple invites by code', () => {
  const CODE = 'ABC234';
  const JOINER = 'joiner-uid';
  const inviteRef = (uid: string | null, code = CODE) => doc(db(uid), 'coupleInvites', code);
  const future = () => Timestamp.fromMillis(Date.now() + 60 * 60 * 1000);

  async function seedInvite() {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const admin = ctx.firestore();
      await setDoc(doc(admin, 'couples', COUPLE), {
        members: [OWNER],
        inviteCode: CODE,
        inviteExpiresAt: future(),
      });
      await setDoc(doc(admin, 'couples', COUPLE, 'public', 'invite'), {
        inviteCode: CODE,
        inviteExpiresAt: future(),
        inviterEmail: 'owner@example.com',
      });
      await setDoc(doc(admin, 'coupleInvites', CODE), {
        coupleId: COUPLE,
        inviteExpiresAt: future(),
        inviterEmail: 'owner@example.com',
      });
    });
  }

  test('anyone signed in can look up an invite by its code', async () => {
    await seedInvite();
    await assertSucceeds(getDoc(inviteRef(JOINER)));
    await assertFails(getDoc(inviteRef(null)));
  });

  test('nobody can list invites', async () => {
    await seedInvite();
    await assertFails(getDocs(collection(db(JOINER), 'coupleInvites')));
    await assertFails(getDocs(collection(db(OWNER), 'coupleInvites')));
  });

  test('a couple member can create and refresh their invite', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'couples', COUPLE), { members: [OWNER] });
    });
    const data = { coupleId: COUPLE, inviteExpiresAt: future(), inviterEmail: 'owner@example.com' };
    await assertSucceeds(setDoc(inviteRef(OWNER), data));
    await assertSucceeds(setDoc(inviteRef(OWNER), { ...data, inviteExpiresAt: future() }));
  });

  test('a new couple and its invite can be created in one batch', async () => {
    const ownerDb = db(OWNER);
    const batch = writeBatch(ownerDb);
    batch.set(doc(ownerDb, 'couples', 'new-couple'), { members: [OWNER] });
    batch.set(doc(ownerDb, 'coupleInvites', 'NEW234'), {
      coupleId: 'new-couple',
      inviteExpiresAt: future(),
      inviterEmail: 'owner@example.com',
    });
    await assertSucceeds(batch.commit());
  });

  test("a stranger cannot create, redirect or delete someone else's invite", async () => {
    await seedInvite();
    await assertFails(
      setDoc(inviteRef(STRANGER, 'XYZ234'), {
        coupleId: COUPLE,
        inviteExpiresAt: future(),
        inviterEmail: 'x@example.com',
      }),
    );
    await assertFails(
      setDoc(inviteRef(STRANGER), { coupleId: 'other', inviteExpiresAt: future(), inviterEmail: '' }),
    );
    await assertFails(deleteDoc(inviteRef(STRANGER)));
  });

  test('invite docs cannot carry extra fields', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'couples', COUPLE), { members: [OWNER] });
    });
    await assertFails(
      setDoc(inviteRef(OWNER), {
        coupleId: COUPLE,
        inviteExpiresAt: future(),
        inviterEmail: '',
        extra: true,
      }),
    );
  });

  test('the full join flow works for the person holding the code', async () => {
    await seedInvite();
    const joinerDb = db(JOINER);
    await assertSucceeds(getDoc(doc(joinerDb, 'coupleInvites', CODE)));
    await assertSucceeds(getDoc(doc(joinerDb, 'couples', COUPLE)));
    await assertSucceeds(
      updateDoc(doc(joinerDb, 'couples', COUPLE), {
        members: arrayUnion(JOINER),
        inviteCode: deleteField(),
        inviteExpiresAt: deleteField(),
      }),
    );
    await assertSucceeds(deleteDoc(doc(joinerDb, 'couples', COUPLE, 'public', 'invite')));
    await assertSucceeds(deleteDoc(doc(joinerDb, 'coupleInvites', CODE)));
  });
});

describe('data validation', () => {
  const validPeriod = () => ({
    dateGregorian: '2026-10-16',
    dateHebrew: { year: 5787, month: 8, day: 5 },
    onah: 'day',
    createdAt: new Date().toISOString(),
    createdBy: OWNER,
  });
  const newPeriodRef = (uid: string) => doc(db(uid), 'couples', COUPLE, 'periods', 'p2');
  const settingsRef = (uid: string) => doc(db(uid), 'couples', COUPLE, 'settings', 's1');

  test('the onboarding batch (couple, invites, settings, user) succeeds', async () => {
    const ownerDb = db(OWNER);
    const expires = Timestamp.fromMillis(Date.now() + 60 * 60 * 1000);
    const batch = writeBatch(ownerDb);
    batch.set(doc(ownerDb, 'couples', 'onboard'), {
      members: [OWNER],
      createdAt: Timestamp.now(),
      inviteCode: 'ONB234',
      inviteExpiresAt: expires,
    });
    batch.set(doc(ownerDb, 'couples', 'onboard', 'public', 'invite'), {
      inviteCode: 'ONB234',
      inviteExpiresAt: expires,
      inviterEmail: 'owner@example.com',
    });
    batch.set(doc(ownerDb, 'coupleInvites', 'ONB234'), {
      coupleId: 'onboard',
      inviteExpiresAt: expires,
      inviterEmail: 'owner@example.com',
    });
    batch.set(doc(ownerDb, 'users', OWNER), { coupleId: 'onboard', role: 'owner' }, { merge: true });
    batch.set(doc(ownerDb, 'couples', 'onboard', 'settings', 'main'), {
      minhag: 'ashkenaz',
      chumrot: { kavuah: false },
      notifications: {},
      calendar: {},
    });
    await assertSucceeds(batch.commit());
  });

  test('a valid period can be added, edited and deleted', async () => {
    await seed({ partnerUid: PARTNER });
    await assertSucceeds(setDoc(newPeriodRef(OWNER), { ...validPeriod(), notes: 'note' }));
    await assertSucceeds(updateDoc(newPeriodRef(OWNER), { onah: 'night', notes: deleteField() }));
    await assertSucceeds(setDoc(doc(db(PARTNER), 'couples', COUPLE, 'periods', 'p3'), validPeriod()));
    await assertSucceeds(deleteDoc(newPeriodRef(OWNER)));
  });

  test('invalid periods are rejected', async () => {
    await seed({});
    await assertFails(setDoc(newPeriodRef(OWNER), { ...validPeriod(), onah: 'evening' }));
    await assertFails(setDoc(newPeriodRef(OWNER), { ...validPeriod(), dateHebrew: 'yesterday' }));
    await assertFails(setDoc(newPeriodRef(OWNER), { ...validPeriod(), extra: true }));
    await assertFails(setDoc(newPeriodRef(OWNER), { ...validPeriod(), notes: 'x'.repeat(2001) }));
    const { createdBy: _createdBy, ...missing } = validPeriod();
    await assertFails(setDoc(newPeriodRef(OWNER), missing));
  });

  test('settings accept known fields and minhagim only', async () => {
    await seed({});
    await assertSucceeds(setDoc(settingsRef(OWNER), { minhag: 'chabad' }, { merge: true }));
    await assertFails(setDoc(settingsRef(OWNER), { minhag: 'made-up' }, { merge: true }));
    await assertFails(setDoc(settingsRef(OWNER), { isAdmin: true }, { merge: true }));
    await assertFails(setDoc(settingsRef(OWNER), { chumrot: 'all' }, { merge: true }));
  });

  test('a member can only remove themselves from the couple', async () => {
    await seed({});
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'couples', COUPLE), { members: [OWNER, PARTNER] });
    });
    const coupleRefFor = (uid: string) => doc(db(uid), 'couples', COUPLE);
    await assertFails(updateDoc(coupleRefFor(OWNER), { members: [OWNER] }));
    await assertFails(updateDoc(coupleRefFor(OWNER), { members: [OWNER, PARTNER, STRANGER] }));
    await assertFails(updateDoc(coupleRefFor(OWNER), { somethingElse: true }));
    await assertSucceeds(updateDoc(coupleRefFor(PARTNER), { members: [OWNER] }));
  });

  test('a joiner can only add themselves and clear the invite', async () => {
    await seed({});
    const expires = Timestamp.fromMillis(Date.now() + 60 * 60 * 1000);
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'couples', COUPLE), {
        members: [OWNER],
        inviteCode: 'ABC234',
        inviteExpiresAt: expires,
      });
      await setDoc(doc(ctx.firestore(), 'couples', COUPLE, 'public', 'invite'), {
        inviteCode: 'ABC234',
        inviteExpiresAt: expires,
        inviterEmail: '',
      });
    });
    const ref = doc(db(STRANGER), 'couples', COUPLE);
    await assertFails(updateDoc(ref, { members: [STRANGER, PARTNER] }));
    await assertFails(updateDoc(ref, { members: [OWNER, STRANGER], hijacked: true }));
    await assertSucceeds(
      updateDoc(ref, {
        members: [OWNER, STRANGER],
        inviteCode: deleteField(),
        inviteExpiresAt: deleteField(),
      }),
    );
  });

  test('couple and public invite docs only accept known fields', async () => {
    await assertFails(setDoc(doc(db(OWNER), 'couples', 'c2'), { members: [OWNER], extra: 1 }));
    await assertSucceeds(setDoc(doc(db(OWNER), 'couples', 'c2'), { members: [OWNER] }));
    await assertFails(
      setDoc(doc(db(OWNER), 'couples', 'c2', 'public', 'invite'), { inviteCode: 'A', extra: 1 }),
    );
  });
});

describe('account deletion', () => {
  async function deleteAll(ownerDb: ReturnType<typeof db>, path: string[]) {
    const snap = await getDocs(collection(ownerDb, path.join('/')));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  }

  test('a sole member can delete the couple and everything in it, including legacy invites', async () => {
    await seed({ partnerUid: PARTNER });
    await env.withSecurityRulesDisabled(async (ctx) => {
      const admin = ctx.firestore();
      await setDoc(doc(admin, 'couples', COUPLE), { members: [OWNER], inviteCode: 'DEL234' });
      await setDoc(doc(admin, 'couples', COUPLE, 'invites', 'old'), { email: 'x@example.com' });
      await setDoc(doc(admin, 'couples', COUPLE, 'public', 'invite'), { inviteCode: 'DEL234' });
      await setDoc(doc(admin, 'coupleInvites', 'DEL234'), { coupleId: COUPLE });
    });
    const ownerDb = db(OWNER);
    // Same order as deleteAllUserData / deleteCoupleWithSubcollections.
    await assertSucceeds(deleteDoc(doc(ownerDb, 'coupleInvites', 'DEL234')));
    await assertSucceeds(deleteAll(ownerDb, ['couples', COUPLE, 'periods']));
    await assertSucceeds(deleteAll(ownerDb, ['couples', COUPLE, 'invites']));
    await assertSucceeds(deleteAll(ownerDb, ['couples', COUPLE, 'settings']));
    await assertSucceeds(deleteDoc(doc(ownerDb, 'couples', COUPLE, 'public', 'invite')));
    await assertSucceeds(deleteDoc(doc(ownerDb, 'couples', COUPLE)));
    await assertSucceeds(
      setDoc(doc(ownerDb, 'users', OWNER, 'partnerAccess', 'current'), { isActive: false }, { merge: true }),
    );
    await assertSucceeds(deleteDoc(doc(ownerDb, 'partnerTokens', TOKEN)));
    await assertSucceeds(deleteDoc(doc(ownerDb, 'users', OWNER, 'partnerAccess', 'current')));
    await assertSucceeds(deleteDoc(doc(ownerDb, 'users', OWNER)));
  });

  test('a member of a two-person couple leaves without deleting shared data', async () => {
    await seed({});
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'couples', COUPLE), { members: [OWNER, PARTNER] });
    });
    await assertSucceeds(updateDoc(doc(db(PARTNER), 'couples', COUPLE), { members: arrayRemove(PARTNER) }));
    await assertFails(deleteDoc(doc(db(OWNER), 'couples', 'not-mine')));
  });

  test('strangers cannot read or delete legacy invites', async () => {
    await seed({});
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'couples', COUPLE, 'invites', 'old'), { email: 'x@example.com' });
    });
    await assertFails(getDocs(collection(db(STRANGER), 'couples', COUPLE, 'invites')));
    await assertFails(deleteDoc(doc(db(STRANGER), 'couples', COUPLE, 'invites', 'old')));
    await assertFails(setDoc(doc(db(OWNER), 'couples', COUPLE, 'invites', 'new'), { email: '' }));
  });
});
