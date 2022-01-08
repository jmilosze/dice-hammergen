import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import rs from "randomstring";

admin.initializeApp();

const MAX_SESSIONS = 1000;
const MAX_RETRY = 3;
const SESSION_EXPIRY = 28800;
// const SESSION_EXPIRY = 60;

const timestamp = function() {
  return Math.floor(Date.now() / 1000);
};

export const createSession = functions.https.onRequest(
  async (request, response) => {
    response.set("Access-Control-Allow-Origin", "*");

    const sessionsNode = await admin
      .database()
      .ref("sessionTimestamps")
      .once("value");

    if (sessionsNode.numChildren() >= MAX_SESSIONS) {
      response.json({
        state: -1,
        msg: `Session number exceeded maximum of ${MAX_SESSIONS}.`,
        data: null
      });
      return;
    }

    let newSession = "";
    for (let i = 0; i < MAX_RETRY; ++i) {
      newSession = rs.generate({ length: 6, charset: "alphanumeric", readable: true });
      if (!sessionsNode.child(newSession).exists()) {
        break;
      }
      newSession = "";
    }

    if (!newSession) {
      response.json({
        state: -2,
        msg: `Could not generate unique session number.`,
        data: null
      });
      return;
    }

    await admin
      .database()
      .ref(`sessionTimestamps/${newSession}`)
      .set(timestamp());

    const newSessionNode = admin.database().ref(`sessions/${newSession}`);
    await newSessionNode
      .push()
      .set({ user: "system", msg: "Session start.", roll: "", timestamp: timestamp(), userId: "system" });

    response.json({
      state: 0,
      msg: `Session created successfully.`,
      data: newSession
    });
  }
);

export const clearExpired = functions.pubsub
  .schedule("0 */8 * * *")
  .onRun(async () => {
// export const clearExpired = functions.https.onRequest(
//   async (request, response) => {
//     response.send("dsasdasdasd");
    const sessionsNode = await admin
      .database()
      .ref("sessionTimestamps")
      .once("value");

    if (!sessionsNode.exists()) {
      return;
    }
    const currentTime = timestamp();
    sessionsNode.forEach(childSnapshot => {
      if (currentTime - childSnapshot.val() >= SESSION_EXPIRY) {
        childSnapshot.ref
          .remove()
          .then(() => {})
          .catch(() => {});

        admin
          .database()
          .ref(`sessions/${childSnapshot.key}`)
          .remove()
          .then(() => {})
          .catch(() => {});
      }
    });
  }
);
