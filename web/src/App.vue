<template>
  <div class="min-h-dvh flex flex-col min-w-80">
    <div class="h-14 bg-emerald-500">
      <div class="container mx-auto h-full flex flex-col justify-center">
        <div class="text-neutral-100 text-xl font-semibold mx-auto">
          <router-link to="/" class="hover:bg-emerald-600 px-2 py-3 rounded">Hammergen Dice</router-link>
        </div>
      </div>
    </div>

    <div class="container py-12 max-w-6xl mx-auto flex-grow">
      <router-view :key="$route.fullPath" />
    </div>
    <div class="border-t border-neutral-300">
      <div class="container mx-auto max-w-6xl">
        <div class="mx-auto my-4 w-fit">
          Contact:
          <a href="mailto:admin@hammergen.net" class="text-blue-500 hover:text-blue-900">admin@hammergen.net</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "App",
});
</script>

<style></style>
