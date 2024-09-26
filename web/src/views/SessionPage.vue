<template>
  <div class="max-w-2xl mx-auto">
    <div v-if="errors.length" class="my-5">
      <div v-for="error in errors" :key="error" class="text-red-500 text-center">{{ error }}</div>
    </div>

    <div v-if="sessionExists">
      <!--   session and username   -->
      <div class="flex items-center h-14">
        <div class="flex-grow text-nowrap">
          Session ID: <span class="font-semibold">{{ sessionId }}</span> |
        </div>
        <div class="mr-2 ml-1">Name:</div>
        <input v-model="username" class="input-standard" />
      </div>

      <!--   roll windows   -->
      <div ref="rollWindow" class="border rounded p-1.5 overflow-scroll overflow-x-hidden overflow-y-auto chat-height">
        <div v-for="dRoll in displayRolls" :key="dRoll.timestamp" class="mt-1 mb-1 has-text-left has-text-white">
          <div
            v-if="!isCurrentUserRoll(dRoll)"
            class="bg-sky-500 rounded w-fit p-1.5 text-neutral-100 bubble-width mr-auto"
          >
            {{ dRoll.user }}
            <br />
            <div v-if="dRoll.msg">
              {{ dRoll.msg }}
            </div>
            <div v-else>
              <ViewRoll :diceTable="dRoll.roll" />
            </div>
          </div>

          <div v-else class="bg-emerald-500 rounded w-fit p-1.5 text-neutral-100 bubble-width ml-auto">
            <div v-if="dRoll.msg">
              {{ dRoll.msg }}
            </div>
            <div v-else>
              <ViewRoll :diceTable="dRoll.roll" />
            </div>
          </div>
        </div>
      </div>

      <!--   dice and buttons   -->
      <div class="pt-2 h-52">
        <div class="flex justify-between gap-2 sm:gap-6">
          <div v-for="(diceData, diceType) in dice" :key="diceType">
            <div class="flex justify-center">
              <button class="" @click="increaseDice(diceType)">
                <img :src="`/images/dice/${diceType}.svg`" :alt="diceType.toString()" class="w-12" />
              </button>
            </div>
            <input
              v-model="diceData.number"
              class="input-standard text-center"
              type="number"
              min="0"
              max="99"
              placeholder="0"
            />
          </div>
        </div>

        <div class="mt-2">
          <input v-model="message" class="input-standard" type="text" placeholder="Message" @keyup.enter="sendRoll" />
        </div>

        <div class="mt-2 flex gap-2 justify-center">
          <button
            class="btn-primary flex-1"
            :class="submitting ? 'pointer-events-none bg-emerald-600' : ''"
            @click="sendRoll"
          >
            <AnimatedSpinner v-if="submitting" class="mx-auto" />
            {{ submitting ? "" : message ? "Message" : "Roll" }}
          </button>
          <button class="btn-red flex-1" @click="clearDice">
            {{ message ? "Clear message" : "Clear dice" }}
          </button>
        </div>
      </div>
    </div>
    <div v-else-if="sessionDoesNotExist">
      <p class="text-red-500 text-center text-2xl my-6">Session does not exist</p>
      <div class="flex justify-center">
        <button class="btn-primary" @click="goBack">Go Back</button>
      </div>
    </div>
    <div v-else>
      <p class="text-center">Checking Session...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from "vue";
import {
  DisplayRoll,
  createNewDiceTable,
  reRollDices,
  dicesToStr,
  strToDices,
  validateDice,
  DiceTable,
} from "../dice.ts";
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
import AnimatedSpinner from "../components/AnimatedSpinner.vue";

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
const submitting = ref(false);
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

function increaseDice(diceType: keyof DiceTable) {
  if (dice.value[diceType].number !== null) {
    dice.value[diceType].number += 1;
  } else {
    dice.value[diceType].number = 1;
  }
}

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
    validateDice(dice.value);
    reRollDices(dice.value);
    roll = dicesToStr(dice.value);
  }

  if (!msg && !roll) {
    return;
  }

  submitting.value = true;

  const newRollRef = push(sessionRef);

  await set(newRollRef, {
    user: username.value,
    msg: msg,
    roll: roll,
    timestamp: timestamp(),
    userId: userId.value,
  });

  submitting.value = false;
}

function clearDice() {
  if (message.value) {
    message.value = "";
    return;
  }
  dice.value = createNewDiceTable();
}

function isCurrentUserRoll(roll: DisplayRoll): boolean {
  return roll.userId === userId.value;
}

function goBack() {
  router.push({ name: "home" });
}
</script>

<style scoped>
.chat-height {
  height: calc(100dvh - 20rem);
  min-height: 10rem;
}

.bubble-width {
  max-width: 80%;
}
</style>
