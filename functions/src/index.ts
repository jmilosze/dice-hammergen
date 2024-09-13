import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getDatabase, DataSnapshot } from "firebase-admin/database";
import { generate } from "randomstring";

const MAX_SESSIONS = 1000;
const MAX_RETRY = 3;
const SESSION_EXPIRY = 28800; // 8 hours in seconds
const TEST_SESSION_EXPIRY = 30;

initializeApp();
if (process.env.FIREBASE_DATABASE_EMULATOR_HOST) {
  console.log('Using database emulator');
}

const timestamp = () => Math.floor(Date.now() / 1000);

export const createSession = onRequest(async (_request, response) => {
  response.set("Access-Control-Allow-Origin", "*");

  const db = getDatabase();
  const sessionsNode = await db.ref("sessionTimestamps").once("value");

  if (sessionsNode.numChildren() >= MAX_SESSIONS) {
    response.json({
      state: -1,
      msg: `Session number exceeded maximum of ${MAX_SESSIONS}.`,
      data: null,
    });
    return;
  }

  let newSession = "";
  for (let i = 0; i < MAX_RETRY; ++i) {
    newSession = generate({ length: 6, charset: "alphanumeric", readable: true });
    if (!sessionsNode.child(newSession).exists()) {
      break;
    }
    newSession = "";
  }

  if (!newSession) {
    response.json({
      state: -2,
      msg: `Could not generate unique session number.`,
      data: null,
    });
    return;
  }

  await db.ref(`sessionTimestamps/${newSession}`).set(timestamp());

  const newSessionNode = db.ref(`sessions/${newSession}`);
  await newSessionNode
    .push()
    .set({ user: "system", msg: "Session start.", roll: "", timestamp: timestamp(), userId: "system" });

  response.json({
    state: 0,
    msg: `Session created successfully.`,
    data: newSession,
  });
});

export const clearExpiredScheduled = onSchedule("0 */8 * * *", clearExpired);

async function clearExpired() {

  let expiry = SESSION_EXPIRY
  if (process.env.FIREBASE_DATABASE_EMULATOR_HOST) {
    console.log('Using test session expiry');
    expiry = TEST_SESSION_EXPIRY
  }

  const db = getDatabase();
  const sessionsNode = await db.ref("sessionTimestamps").once("value");

  if (!sessionsNode.exists()) {
    return;
  }

  const currentTime = timestamp();
  const updates: Record<string, string | null> = {};

  sessionsNode.forEach((childSnapshot: DataSnapshot) => {
    const sessionTime = childSnapshot.val();

    if (typeof sessionTime === "number" && currentTime - sessionTime >= expiry) {
      const key = childSnapshot.key;
      if (key !== null) {
        updates[`sessionTimestamps/${key}`] = null;
        updates[`sessions/${key}`] = null;
      }
    }
  });

  if (Object.keys(updates).length > 0) {
    await db.ref().update(updates);
  }
}
