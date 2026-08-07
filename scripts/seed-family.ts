/**
 * One-time local setup script: creates (or reuses) the family document and
 * the parent's Firebase Auth account + users/{uid} doc. There is no public
 * signup flow in this app on purpose -- run this once, then manage kids and
 * tasks from the /parent dashboard.
 *
 * Usage:
 *   npm run seed -- --family="The Smiths" --email=parent@example.com --password=... --name="Justin"
 *
 * Requires FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
 * in .env.local. If DEFAULT_FAMILY_ID is already set there, that family is
 * reused; otherwise a new family is created and its id is printed so you can
 * add it to .env.local as DEFAULT_FAMILY_ID.
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local is optional if these are already in the environment
}

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (const raw of argv) {
    const match = raw.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const familyName = args.family;
  const parentEmail = args.email;
  const parentPassword = args.password;
  const parentName = args.name;

  if (!familyName || !parentEmail || !parentPassword || !parentName) {
    console.error(
      'Usage: npm run seed -- --family="The Smiths" --email=parent@example.com --password=... --name="Justin"'
    );
    process.exit(1);
  }

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.error(
      "Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY. Set them in .env.local."
    );
    process.exit(1);
  }

  initializeApp({
    credential: cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
  const db = getFirestore();
  const auth = getAuth();

  let familyId = process.env.DEFAULT_FAMILY_ID;
  if (familyId) {
    const existing = await db.collection("families").doc(familyId).get();
    if (existing.exists) {
      console.log(`Reusing existing family ${familyId}.`);
    } else {
      await db.collection("families").doc(familyId).set({
        name: familyName,
        createdAt: Date.now(),
      });
      console.log(`Created family ${familyId}.`);
    }
  } else {
    const ref = await db.collection("families").add({
      name: familyName,
      createdAt: Date.now(),
    });
    familyId = ref.id;
    console.log(`Created family ${familyId}.`);
    console.log(`Add this to .env.local: DEFAULT_FAMILY_ID=${familyId}`);
  }

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(parentEmail);
    console.log(`Reusing existing Firebase Auth user ${userRecord.uid} for ${parentEmail}.`);
  } catch {
    userRecord = await auth.createUser({
      email: parentEmail,
      password: parentPassword,
      displayName: parentName,
    });
    console.log(`Created Firebase Auth user ${userRecord.uid} for ${parentEmail}.`);
  }

  await db.collection("users").doc(userRecord.uid).set({
    role: "parent",
    familyId,
    displayName: parentName,
  });
  console.log(`Wrote users/${userRecord.uid} (role: parent, family: ${familyId}).`);

  console.log("\nDone. Sign in at /parent with this email/password.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
