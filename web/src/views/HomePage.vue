<template>
  <div class="max-w-3xl mx-auto flex flex-col content-height">
    <div class="flex-grow">
      <div class="text-2xl text-center mt-12">Roll RPG dice with friends</div>
      <div class="mt-10 max-w-md mx-auto">
        <div
          class="mt-2 flex items-stretch focus-within:outline-emerald-600 focus-within:outline-2 focus-within:outline rounded"
        >
          <div class="flex-grow">
            <input
              v-model="sessionId"
              class="border-b border-l border-t border-neutral-300 rounded-l w-full px-2 py-1.5 focus:border-transparent outline-0"
              placeholder="Session ID"
            />
          </div>
          <button class="btn-primary py-1.5 px-6 rounded-none rounded-r" @click="joinSession">Join</button>
        </div>
        <p v-if="invalidSession" class="mt-1 text-red-500 text-xs text-center">
          ID must be a combination of 6 letters and/or numbers.
        </p>
      </div>

      <div class="mx-auto text-center my-1">or</div>

      <div class="mx-auto flex justify-center gap-4">
        <button
          class="btn-primary w-32"
          :class="submitting ? 'pointer-events-none bg-emerald-600' : ''"
          @click="createSession"
        >
          <AnimatedSpinner v-if="submitting" class="mx-auto" />
          {{ submitting ? "" : "Create Session" }}
        </button>
        <button :disabled="lastSessionDisabled" class="btn-primary" @click="joinLastSession">Join Last Session</button>
      </div>

      <div v-if="errors.length" class="mt-2">
        <div v-for="error in errors" :key="error" class="text-red-500 text-center">{{ error }}</div>
      </div>

      <div class="text-2xl mb-4 mt-8">What can I do here?</div>
      <div>
        <p class="mb-2">
          Hammergen Dice is an online multiplayer dice roller. You can roll RPG dice by yourself or with friends. To
          start rolling simply hit "Create New Session" button.
        </p>
        <p class="mb-2">
          If you want to roll with friends, create a new session and give them 6 character session ID number which they
          can you to join the session. Alternatively, after creating a session, you can just copy and give them session
          URL, for example: {{ domain }}/s/V4A6nA. Session expires after 8 hours.
        </p>
      </div>
    </div>
    <div class="border-t border-neutral-300">
      <div class="mx-auto max-w-6xl mt-3">
        <div class="text-center my-3">
          Contact:
          <a href="mailto:admin@hammergen.net" class="text-blue-500 hover:text-blue-900">admin@hammergen.net</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import AnimatedSpinner from "../components/AnimatedSpinner.vue";

const sessionId = ref("");
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

function checkSessionId() {
  const re = /^[a-zA-Z0-9]{6}$/;
  invalidSession.value = !re.test(sessionId.value);
}

function joinLastSession() {
  router.push({
    name: "session",
    params: { sessionId: lastSessionId.value },
  });
}

function joinSession() {
  checkSessionId();

  if (invalidSession.value) {
    return;
  }

  router.push({
    name: "session",
    params: { sessionId: sessionId.value },
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
    params: { sessionId: sessionId.value },
  });
}
</script>

<style scoped>
.content-height {
  height: calc(100dvh - 3.5rem);
}
</style>
