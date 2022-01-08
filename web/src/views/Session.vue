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
              <input class="input name-input-small is-flex-grow-5" v-model="username" />
            </div>

            <div class="rolls mt-2 is-flex-grow-5 border" ref="rollWindow">
              <div v-for="dRoll in displayRolls" :key="dRoll" class="mt-1 mb-1 has-text-left has-text-white">
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
                    <img :src="require(`../assets/${diceType}.svg`)" :alt="diceType" class="dice" />
                  </div>
                  <input
                    class="input dice-number"
                    v-model="diceData.number"
                    type="number"
                    min="0"
                    max="99"
                    placeholder="0"
                  />
                </div>
              </div>

              <div class="mt-2">
                <input class="input" v-model="message" v-on:keyup.enter="sendRoll" type="text" placeholder="Message" />
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
            <p class="is-size-5 has-text-centered has-text-danger">
              Session does not exist.
            </p>
            <button @click="goBack" class="button is-success mt-2">
              Go Back
            </button>
          </div>
          <div v-else>
            <p class="has-text-centered">
              Checking Session...
            </p>
          </div>
          <div v-if="errors.length">
            <div v-for="error in errors" v-bind:key="error" class="help is-danger">{{ error }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import fb from "firebase/app";
import rs from "randomstring";
import { DisplayRoll, createNewDiceTable, reRollDices, dicesToStr, strToDices, validateDices } from "@/dices";
import ViewRoll from "@/components/ViewRoll.vue";
import randomName from "@/randomName";

const ROLLS_TO_DISPLAY = 250;

type SessionStatus = "exists" | "doesNotExist" | "undetermined";

const timestamp = function() {
  return Math.floor(Date.now() / 1000);
};

export default defineComponent({
  name: "Session",
  components: { ViewRoll },
  props: {
    initialUsername: {
      type: String
    },
    sessionId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      username: randomName(),
      sessionStatus: "undetermined" as SessionStatus,
      errors: [] as string[],
      displayRolls: [] as DisplayRoll[],
      dices: createNewDiceTable(),
      userId: "",
      message: ""
    };
  },
  created() {
    this.getUserId();
    this.setSessionStatus();
  },
  beforeUnmount() {
    this.$db.ref(`sessions/${this.sessionId}`).off("child_added", this.receiveRoll);
  },
  methods: {
    isCurrentUserRoll(roll: DisplayRoll): boolean {
      return roll.userId === this.userId;
    },
    getUserId() {
      const storedUserId = localStorage.getItem("userId");
      if (storedUserId) {
        this.userId = storedUserId;
      } else {
        this.userId = rs.generate({ length: 16, charset: "alphanumeric" });
        localStorage.setItem("userId", this.userId);
      }
    },
    goBack() {
      if (this.initialUsername) {
        this.$router.push({ name: "home", params: { initialUsername: this.initialUsername } });
      } else {
        this.$router.push({ name: "home" });
      }
    },
    async setSessionStatus() {
      if (this.initialUsername) {
        this.username = this.initialUsername;
      }

      try {
        const session = await this.$db
          .ref(`sessions/${this.sessionId}`)
          .limitToLast(1)
          .once("value");
        if (!session.val()) {
          this.sessionStatus = "doesNotExist";
        } else {
          this.$db
            .ref(`sessions/${this.sessionId}`)
            .limitToLast(ROLLS_TO_DISPLAY)
            .on("child_added", this.receiveRoll);
          this.sessionStatus = "exists";
          localStorage.setItem("lastSessionId", this.sessionId);
        }
      } catch (err) {
        this.errors.push("Server Error.");
      }
    },
    clearDices() {
      this.dices = createNewDiceTable();
    },
    receiveRoll(child: fb.database.DataSnapshot) {
      const val = child.val();
      const roll = strToDices(val.roll);
      this.displayRolls.push({
        user: val.user,
        msg: val.msg,
        roll: roll,
        timestamp: val.timestamp,
        userId: val.userId
      });
      if (this.displayRolls.length > ROLLS_TO_DISPLAY) {
        this.displayRolls.shift();
      }

      const rollWindow = this.$refs.rollWindow as Element;
      if (Math.abs(rollWindow.scrollHeight - rollWindow.scrollTop - rollWindow.clientHeight) <= 2) {
        this.$nextTick(() => (rollWindow.scrollTop = rollWindow.scrollHeight));
      }
    },
    async sendRoll() {
      const rollWindow = this.$refs.rollWindow as Element;
      rollWindow.scrollTop = rollWindow.scrollHeight;

      let msg = "";
      let roll = "";

      if (this.message) {
        msg = this.message;
        this.message = "";
      } else {
        validateDices(this.dices);
        reRollDices(this.dices);
        roll = dicesToStr(this.dices);
      }

      if (!msg && !roll) {
        return;
      }

      await this.$db
        .ref(`sessions/${this.sessionId}`)
        .push()
        .set({ user: this.username, msg: msg, roll: roll, timestamp: timestamp(), userId: this.userId });
    }
  },
  computed: {
    sessionExists(): boolean {
      return this.sessionStatus === "exists";
    },
    sessionDoesNotExist(): boolean {
      return this.sessionStatus === "doesNotExist";
    }
  }
});
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
