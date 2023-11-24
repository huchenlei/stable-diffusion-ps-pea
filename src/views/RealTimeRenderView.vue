<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStateStore } from '@/stores/appStateStore';

const appStateStore = useAppStateStore();
const appState = appStateStore.appState;

// Seed control.
// - Display the current active seed
// - A button that reroll the seed
// - A list of previously used seeds
const seed = appState.commonPayload.seed;

// Prompt input

// Send to canvas button
// Send the rendered image to the canvas (selection)
</script>

<template>
  <a-space direction="vertical" style="width: 100%;">
      <a-input-number :addonBefore="$t('gen.seed')" v-model:value="seed"></a-input-number>
      
  </a-space>
</template>

<style scoped>
</style>
