<template>
  <div class="max-w-2xl mx-auto">
    <div v-if="sessionExists">
      <div class="flex items-center">
        <div class="flex-grow text-nowrap">
          Session ID: <span class="font-semibold">{{ sessionId }}</span> |
        </div>
        <div class="mr-2 ml-1">Name:</div>
        <input
          v-model="username"
          class="border border-neutral-300 rounded w-full h-10 px-2 focus:outline-emerald-600 focus:border-transparent focus:outline focus:outline-2"
        />
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
          <div v-for="(diceData, diceType) in dice" :key="diceType">
            <div>
              <img :src="`/images/dice/${diceType}.svg`" :alt="diceType.toString()" class="dice" />
            </div>
            <input v-model="diceData.number" class="input dice-number" type="number" min="0" max="99" placeholder="0" />
          </div>
        </div>

        <div class="mt-2">
          <input v-model="message" class="input" type="text" placeholder="Message" @keyup.enter="sendRoll" />
        </div>

        <div class="mt-2 is-flex is-flex-direction-row is-flex-wrap-wrap">
          <button class="button is-success is-flex-grow-3 mr-2 input-small" @click="sendRoll">Send</button>
          <button class="button is-danger is-flex-grow-1 ml-2 input-small" @click="clearDices">Clear dices</button>
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
  sessionId: string;
}>();

const router = useRouter();

const username = ref(randomName());
const sessionStatus = ref("undetermined" as SessionStatus);
const errors = ref([] as string[]);
const displayRolls = ref([] as DisplayRoll[]);
const dice = ref(createNewDiceTable());
const userId = ref("");
const message = ref("");
const rollWindow = ref<HTMLDivElement | null>(null);

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

onMounted(async () => {
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
    validateDices(dice.value);
    reRollDices(dice.value);
    roll = dicesToStr(dice.value);
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
  dice.value = createNewDiceTable();
}

function isCurrentUserRoll(roll: DisplayRoll): boolean {
  return roll.userId === userId.value;
}

function goBack() {
  router.push({ name: "home" });
}
</script>

<style scoped></style>
