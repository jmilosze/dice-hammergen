<template>
  <div class="session limit-height mt-2">
    <div class="container limit-height">
      <div class="columns is-centered limit-height">
        <div class="column is-6 has-text-centered limit-height">
          <div v-if="sessionExists" class="is-flex is-flex-direction-column limit-height-90">
            <div class="is-flex is-flex-direction-row has-text-left safari-height-fix">
              <div class="has-text-left is-align-self-center no-breakline">
                Session ID: <span class="has-text-weight-semibold">{{ sessionId }}</span>
              </div>
              <div class="has-text-center is-align-self-center no-breakline mr-1 ml-1">|</div>
              <div class="is-align-self-center no-breakline mr-2">Name:</div>
              <input v-model="username" class="input name-input-small is-flex-grow-5" />
            </div>

            <div ref="rollWindow" class="rolls mt-2 is-flex-grow-5 border">
              <div v-for="dRoll in displayRolls" :key="dRoll.timestamp" class="mt-1 mb-1 has-text-left has-text-white">
                <div v-if="!isCurrentUserRoll(dRoll)" class="roll has-background-info">
                  {{ dRoll.user }}
                  <br />
                  <div v-if="dRoll.msg">
                    {{ dRoll.msg }}
                  </div>
                  <div v-else>
                    <ViewRoll :diceTable="dRoll.roll" />
                  </div>
                </div>

                <div v-else class="roll has-background-primary right">
                  <div v-if="dRoll.msg">
                    {{ dRoll.msg }}
                  </div>
                  <div v-else>
                    <ViewRoll :diceTable="dRoll.roll" />
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-2">
              <div class="is-flex is-flex-direction-row is-justify-content-space-between is-flex-wrap-wrap">
                <div v-for="(diceData, diceType) in dices" :key="diceType">
                  <div>
                    <img :src="`image/dice/${diceType}.svg`" :alt="diceType.toString()" class="dice" />
                  </div>
                  <input
                    v-model="diceData.number"
                    class="input dice-number"
                    type="number"
                    min="0"
                    max="99"
                    placeholder="0"
                  />
                </div>
              </div>

              <div class="mt-2">
                <input v-model="message" class="input" type="text" placeholder="Message" @keyup.enter="sendRoll" />
              </div>

              <div class="mt-2 is-flex is-flex-direction-row is-flex-wrap-wrap">
                <button class="button is-success is-flex-grow-3 mr-2 input-small" @click="sendRoll">Send</button>
                <button class="button is-danger is-flex-grow-1 ml-2 input-small" @click="clearDices">
                  Clear dices
                </button>
              </div>
            </div>
          </div>

          <div v-else-if="sessionDoesNotExist">
            <p class="is-size-5 has-text-centered has-text-danger">Session does not exist.</p>
            <button class="button is-success mt-2" @click="goBack">Go Back</button>
          </div>
          <div v-else>
            <p class="has-text-centered">Checking Session...</p>
          </div>
          <div v-if="errors.length">
            <div v-for="error in errors" :key="error" class="help is-danger">{{ error }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from "vue";
import { DisplayRoll, createNewDiceTable, reRollDices, dicesToStr, strToDices, validateDices } from "../dice.ts";
import ViewRoll from "../components/ViewRoll.vue";
import randomName from "../randomName";
import { useRouter } from "vue-router";
import { db } from "../firebase.ts";
import {
  ref as firebaseRef,
  limitToLast,
  query,
  get,
  onChildAdded,
  push,
  set,
  off,
  DataSnapshot,
} from "firebase/database";
import createRandomString from "../randomString.ts";

const ROLLS_TO_DISPLAY = 250;

type SessionStatus = "exists" | "doesNotExist" | "undetermined";

const timestamp = function () {
  return Math.floor(Date.now() / 1000);
};

const props = defineProps<{
  initialUsername?: string;
  sessionId: string;
}>();

const username = ref(randomName());
const sessionStatus = ref("undetermined" as SessionStatus);
const errors = ref([] as string[]);
const displayRolls = ref([] as DisplayRoll[]);
const dices = ref(createNewDiceTable());
const userId = ref("");
const message = ref("");
const rollWindow = ref<HTMLDivElement | null>(null);

const router = useRouter();
const sessionRef = firebaseRef(db, `sessions/${props.sessionId}`);
const subQuery = query(sessionRef, limitToLast(ROLLS_TO_DISPLAY));

const storedUserId = localStorage.getItem("userId");
if (storedUserId) {
  userId.value = storedUserId;
} else {
  userId.value = createRandomString(16);
  localStorage.setItem("userId", userId.value);
}

const sessionExists = computed(() => {
  return sessionStatus.value === "exists";
});

const sessionDoesNotExist = computed(() => {
  return sessionStatus.value === "doesNotExist";
});

async function setSessionStatus() {
  if (props.initialUsername) {
    username.value = props.initialUsername;
  }

  try {
    const session = await get(query(sessionRef, limitToLast(1)));
    if (!session.val()) {
      sessionStatus.value = "doesNotExist";
    } else {
      onChildAdded(subQuery, (snapshot) => {
        receiveRoll(snapshot);
      });
      sessionStatus.value = "exists";
      localStorage.setItem("lastSessionId", props.sessionId);
    }
  } catch {
    errors.value.push("Server Error.");
  }
}

onMounted(() => {
  setSessionStatus();
});

onUnmounted(() => {
  off(subQuery);
});

function receiveRoll(child: DataSnapshot) {
  const val = child.val();
  const roll = strToDices(val.roll);
  displayRolls.value.push({
    user: val.user,
    msg: val.msg,
    roll: roll,
    timestamp: val.timestamp,
    userId: val.userId,
  });
  if (displayRolls.value.length > ROLLS_TO_DISPLAY) {
    displayRolls.value.shift();
  }

  if (
    rollWindow.value !== null &&
    Math.abs(rollWindow.value.scrollHeight - rollWindow.value.scrollTop - rollWindow.value.clientHeight) <= 2
  ) {
    nextTick(() => {
      if (rollWindow.value) {
        rollWindow.value.scrollTop = rollWindow.value.scrollHeight;
      }
    });
  }
}

async function sendRoll() {
  if (rollWindow.value !== null) {
    rollWindow.value.scrollTop = rollWindow.value.scrollHeight;
  }

  let msg = "";
  let roll = "";

  if (message.value) {
    msg = message.value;
    message.value = "";
  } else {
    validateDices(dices.value);
    reRollDices(dices.value);
    roll = dicesToStr(dices.value);
  }

  if (!msg && !roll) {
    return;
  }

  const newRollRef = push(sessionRef);

  await set(newRollRef, {
    user: username.value,
    msg: msg,
    roll: roll,
    timestamp: timestamp(),
    userId: userId.value,
  });
}

function clearDices() {
  dices.value = createNewDiceTable();
}

function isCurrentUserRoll(roll: DisplayRoll): boolean {
  return roll.userId === userId.value;
}

function goBack() {
  if (props.initialUsername) {
    router.push({ name: "home", params: { initialUsername: props.initialUsername } });
  } else {
    router.push({ name: "home" });
  }
}
</script>

<style scoped>
.no-breakline {
  white-space: nowrap;
}

.dice-number {
  width: 4rem;
  height: 2rem;
  padding: 0 0.2rem;
}

@media (max-width: 768px) {
  .dice-number {
    width: 2.5rem;
    height: 2rem;
    padding: 0 0.2rem;
  }
}

.input-small {
  height: 2rem;
  padding: 0 0.2rem;
}

.name-input-small {
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.2rem;
}

.rolls {
  overflow: scroll;
  overflow-x: hidden;
  overflow-y: auto;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
}

.limit-height {
  height: 100%;
}

.limit-height-90 {
  height: 92.5%;
}

.roll {
  border-radius: 4px;
  padding: 0.125rem 0.5rem;
  width: fit-content;
  max-width: 80%;
}

.right {
  margin-left: auto;
}

.border {
  border-radius: 4px;
  border: 1px solid #dbdbdb;
}

.safari-height-fix {
  min-height: fit-content;
}

.dice {
  width: 3rem;
}
</style>
