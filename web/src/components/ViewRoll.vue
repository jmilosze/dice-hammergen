<template>
  <div>
    <span v-for="dice in dicesDisplay" :key="dice.diceType">
      <span>{{ dice.prefix }}</span>
      <img :src="`/images/dice/${dice.diceType}.svg`" :alt="dice.diceType" class="dice" />
      <span> {{ dice.suffix }} </span>
    </span>
    <span> {{ rollSum }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { DiceTable } from "../dice.ts";

const props = defineProps<{
  diceTable: DiceTable;
}>();

const dicesDisplay = computed(() => {
  const dices: { prefix: string; diceType: string; suffix: string }[] = [];

  for (const [diceType, diceData] of Object.entries(props.diceTable)) {
    if (diceData.number) {
      const prefix = diceData.number > 1 ? `${diceData.number}x` : "";
      dices.push({ prefix: prefix, diceType: diceType, suffix: "" });
    }
  }

  for (const [index, dice] of dices.entries()) {
    dice.suffix = index !== dices.length - 1 ? " + " : " roll is ";
  }

  return dices;
});

const rollSum = computed(() => {
  let sum = 0;
  for (const diceData of Object.values(props.diceTable)) {
    sum += diceData.roll ? diceData.roll : 0;
  }
  return sum;
});
</script>

<style scoped>
.dice {
  vertical-align: middle;
  width: 2rem;
}
</style>
