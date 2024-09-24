<template>
  <div class="min-w-96">
    <div class="bg-emerald-500 h-14">
      <div class="mx-auto h-full flex flex-col justify-center">
        <div class="text-neutral-100 text-xl font-semibold mx-auto">
          <router-link to="/" class="hover:bg-emerald-600 px-2 py-3 rounded">Hammergen Dice</router-link>
        </div>
      </div>
    </div>

    <div class="px-5 md:px-32 lg:px-64">
      <router-view :key="$route.fullPath" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "App",
});
</script>

<style scoped></style>
