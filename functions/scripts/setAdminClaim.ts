import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config({ path: './.env' });

admin.initializeApp();

const uid = process.env.ADMIN_UID;

if (!uid) {
  console.error('ADMIN_UID not found in functions/.env');
  process.exit(1);
}

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`Success — admin claim set for UID: ${uid}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error setting admin claim:', error);
    process.exit(1);
  });
