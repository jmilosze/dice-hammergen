<template>
  <nav id="navbar" class="has-background-primary-dark">
    <div class="container">
      <div class="has-text-centered is-size-5">
        <router-link to="/" class="has-text-light mr-3">Hammergen Dice</router-link>
      </div>
    </div>
  </nav>

  <section id="main-section" class="section">
    <router-view :key="$route.fullPath" />
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "App"
});
</script>

<style>
#main-section {
  padding-top: 0;
  padding-bottom: 0;
  height: 94vh;
}

#navbar {
  height: 6vh;
  line-height: 6vh;
}
</style>
