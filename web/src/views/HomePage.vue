<template>
  <div class="home limit-height is-flex is-flex-direction-column limit-height">
    <div class="container is-flex-grow-5">
      <div class="columns is-centered">
        <div class="column is-6 has-text-centered">
          <div class="is-size-4 mb-6 mt-6">Roll RPG dices with fiends.</div>
          <div class="field input-max-width">
            <div class="control is-expanded">
              <input v-model="username" class="input" placeholder="Your Name" />
            </div>
          </div>
          <div class="field has-addons input-max-width mb-1">
            <div class="control is-expanded">
              <input v-model="sessionId" class="input" placeholder="Session ID" />
              <p v-if="invalidSession" class="help is-danger">ID must be a combination of 6 letters and/or numbers.</p>
            </div>
            <div class="control">
              <button @click="joinSession" class="button is-success">Join</button>
            </div>
          </div>

          <div class="m-1">or</div>

          <div class="field is-centered">
            <button
              class="ml-1 mr-1 mb-2"
              @click="createSession"
              :class="submitting ? 'button is-success is-loading' : 'button is-success'"
            >
              Create Session
            </button>
            <button @click="joinLastSession" :disabled="lastSessionDisabled" class="button is-success ml-1 mr-1">
              Join Last Session
            </button>
          </div>

          <div v-if="errors.length">
            <div v-for="error in errors" v-bind:key="error" class="help is-danger">{{ error }}</div>
          </div>

          <div class="is-size-4 mb-3 mt-5 has-text-left">What can I do here?</div>
          <div class="has-text-left">
            <p class="mb-2">
              Hammergen Dice is an online multiplayer dice roller. You can roll RPG dices by yourself or with friends.
              To start rolling simply hit "Create New Session" button.
            </p>
            <p class="mb-2">
              If you want to roll with friends, create a new session and give them 6 character session ID number which
              they can you to join the session. Alternatively, after creating a session, you can just copy and give them
              session URL, for example: {{ domain }}/s/V4A6nA. Session expires after 8 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
    <footer class="mb-5">
      <div class="has-text-centered">
        <hr />
        <p>
          &copy; 2019 - 2020 Hammergen - Contact:
          <a href="mailto:admin@hammergen.net">admin@hammergen.net</a>
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import axios from "axios";
import randomName from "../randomName";

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

// export default defineComponent({
//   name: "HomePage",
//   props: {
//     initialUsername: {
//       type: String,
//     },
//     initialSessionId: {
//       type: String,
//     },
//   },
//   data() {
//     return {
//       username: "",
//       sessionId: "",
//       lastSessionId: "",
//       errors: [] as string[],
//       submitting: false,
//       invalidSession: null as boolean | null,
//     };
//   },
//   computed: {
//     getDomain() {
//       return window.location.origin;
//     },
//     lastSessionDisabled(): boolean {
//       return !this.lastSessionId;
//     },
//   },
//   created() {
//     if (this.initialUsername) {
//       this.username = this.initialUsername;
//     }
//     if (this.initialSessionId) {
//       this.sessionId = this.initialSessionId;
//     }
//     this.getLastSessionId();
//   },
//   methods: {
//     getLastSessionId() {
//       const storedSession = localStorage.getItem("lastSessionId");
//       if (storedSession) {
//         this.lastSessionId = storedSession;
//       }
//     },
//     defaultUsername() {
//       return this.username ? this.username : randomName();
//     },
//     checkSessionId() {
//       const re = /^[a-zA-Z0-9]{6}$/;
//       this.invalidSession = !re.test(this.sessionId);
//     },
//     joinLastSession() {
//       this.$router.push({
//         name: "session",
//         params: { sessionId: this.lastSessionId, initialUsername: this.username },
//       });
//     },
//     joinSession() {
//       this.checkSessionId();
//
//       if (this.invalidSession) {
//         return;
//       }
//
//       this.$router.push({
//         name: "session",
//         params: { sessionId: this.sessionId, initialUsername: this.username },
//       });
//     },
//     async createSession() {
//       this.submitting = true;
//       try {
//         const newSession = await axios.get(import.meta.env.VITE_FUNCTIONS_URL + "/createSession");
//         if (newSession.data.state === -1 || newSession.data.state === -2) {
//           this.errors.push(newSession.data.msg);
//         } else {
//           this.sessionId = newSession.data.data;
//         }
//       } catch {
//         this.errors.push("Server Error.");
//       }
//
//       if (!this.sessionId) {
//         this.submitting = false;
//         return;
//       }
//
//       this.$router.push({
//         name: "session",
//         params: { sessionId: this.sessionId, initialUsername: this.defaultUsername() },
//       });
//     },
//   },
// });
</script>

<style scoped>
.input-max-width {
  max-width: 25rem;
  margin-left: auto;
  margin-right: auto;
}

.limit-height {
  height: 100%;
}
</style>
