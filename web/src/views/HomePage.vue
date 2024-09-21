<template>
  <div class="text-2xl text-center">Roll RPG dices with friends.</div>
  <div class="field input-max-width">
    <div class="mt-10 max-w-md mx-auto px-5">
      <input
        v-model="username"
        class="border border-neutral-300 rounded w-full h-10 px-2 focus:outline-emerald-700 focus:border-transparent focus:outline focus:outline-2 disabled:bg-neutral-200"
        placeholder="Your Name"
      />
    </div>
  </div>
  <div class="mt-2 max-w-md mx-auto px-5">
    <div
      class="flex items-stretch focus-within:outline-emerald-700 focus-within:outline-2 focus-within:outline rounded"
    >
      <div class="flex-grow">
        <input
          v-model="sessionId"
          class="border-b border-l border-t border-neutral-300 rounded-l w-full h-10 px-2 focus:border-transparent outline-0"
          placeholder="Session ID"
        />
      </div>
      <div class="bg-emerald-500 rounded-r hover:bg-emerald-700">
        <button class="px-5 h-10 text-neutral-100 w-full" @click="joinSession">Join</button>
      </div>
    </div>
    <p v-if="invalidSession" class="mt-1 text-red-600 text-xs text-center">
      ID must be a combination of 6 letters and/or numbers.
    </p>
  </div>

  <div class="mx-auto text-center my-1">or</div>

  <div class="mx-auto">
    <button
      class="ml-1 mr-1 mb-2"
      :class="submitting ? 'button is-success is-loading' : 'button is-success'"
      @click="createSession"
    >
      Create Session
    </button>
    <button :disabled="lastSessionDisabled" class="button is-success ml-1 mr-1" @click="joinLastSession">
      Join Last Session
    </button>
  </div>

  <div v-if="errors.length">
    <div v-for="error in errors" :key="error" class="help is-danger">{{ error }}</div>
  </div>

  <div class="is-size-4 mb-3 mt-5 has-text-left">What can I do here?</div>
  <div class="has-text-left">
    <p class="mb-2">
      Hammergen Dice is an online multiplayer dice roller. You can roll RPG dices by yourself or with friends. To start
      rolling simply hit "Create New Session" button.
    </p>
    <p class="mb-2">
      If you want to roll with friends, create a new session and give them 6 character session ID number which they can
      you to join the session. Alternatively, after creating a session, you can just copy and give them session URL, for
      example: {{ domain }}/s/V4A6nA. Session expires after 8 hours.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import axios from "axios";
import randomName from "../randomName";
import { useRouter } from "vue-router";

const props = defineProps<{
  initialUsername?: string;
  initialSessionId?: string;
}>();

const username = ref(props.initialUsername ? props.initialUsername : "");
const sessionId = ref(props.initialSessionId ? props.initialSessionId : "");
const lastSessionId = ref("");
const errors = ref([] as string[]);
const submitting = ref(false);
const invalidSession = ref(null as boolean | null);

const router = useRouter();

const storedSession = localStorage.getItem("lastSessionId");
if (storedSession) {
  lastSessionId.value = storedSession;
}

const domain = computed(() => {
  return window.location.origin;
});

const lastSessionDisabled = computed(() => {
  return !lastSessionId.value;
});

function defaultUsername() {
  return username.value ? username.value : randomName();
}

function checkSessionId() {
  const re = /^[a-zA-Z0-9]{6}$/;
  invalidSession.value = !re.test(sessionId.value);
}

function joinLastSession() {
  router.push({
    name: "session",
    params: { sessionId: lastSessionId.value, initialUsername: username.value },
  });
}

function joinSession() {
  checkSessionId();

  if (invalidSession.value) {
    return;
  }

  router.push({
    name: "session",
    params: { sessionId: sessionId.value, initialUsername: username.value },
  });
}

async function createSession() {
  submitting.value = true;
  try {
    const newSession = await axios.get(import.meta.env.VITE_FUNCTIONS_URL + "/createSession");
    if (newSession.data.state === -1 || newSession.data.state === -2) {
      errors.value.push(newSession.data.msg);
    } else {
      sessionId.value = newSession.data.data;
    }
  } catch {
    errors.value.push("Server Error.");
  }

  if (!sessionId.value) {
    submitting.value = false;
    return;
  }

  await router.push({
    name: "session",
    params: { sessionId: sessionId.value, initialUsername: defaultUsername() },
  });
}
</script>

<style></style>
