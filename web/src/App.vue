<template>
  <div class="min-h-dvh flex flex-col">
    <div class="h-14 bg-emerald-600">
      <div class="container mx-auto h-full flex flex-col justify-center">
        <div class="text-neutral-100 text-xl mx-auto">
          <router-link to="/" class="has-text-light mr-3">Hammergen Dice</router-link>
        </div>
      </div>
    </div>

    <div class="container py-12 max-w-6xl mx-auto flex-grow">
      <router-view :key="$route.fullPath" />
    </div>
    <div class="container mx-auto max-w-6xl mt-5">
      <div class="mx-auto my-2 w-fit">
        Contact: <a href="mailto:admin@hammergen.net" class="text-blue-500 hover:text-blue-900">admin@hammergen.net</a>
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
