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
    await setDoc(doc(admin, 'couples', COUPLE, 'periods', 'p1'), { onah: 'day' });
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
    await assertFails(setDoc(periodRef(STRANGER), { onah: 'night' }));
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
    await assertSucceeds(setDoc(periodRef(PARTNER), { onah: 'night' }));
    await assertSucceeds(getDoc(doc(db(PARTNER), 'couples', COUPLE, 'settings', 's1')));
  });

  test('the partner loses access when the owner revokes it', async () => {
    await seed({ partnerUid: PARTNER, isActive: false });
    await assertFails(getDoc(periodRef(PARTNER)));
  });

  test('couple members keep full access', async () => {
    await seed({ partnerUid: PARTNER });
    await assertSucceeds(getDoc(periodRef(OWNER)));
    await assertSucceeds(setDoc(periodRef(OWNER), { onah: 'night' }));
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
