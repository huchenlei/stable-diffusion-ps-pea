<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStateStore } from '@/stores/appStateStore';
import DiceOutlined from '@/components/svg/DiceOutlined.vue';

const appStateStore = useAppStateStore();
const appState = appStateStore.appState;

// Seed control.
// - Display the current active seed
// - A button that reroll the seed
// - A list of previously used seeds
function rerollSeed() {
  // Generate a 32-bit integer
  appState.commonPayload.seed = Math.floor(Math.random() * Math.pow(2, 32));
}

// Prompt input

// Send to canvas button
// Send the rendered image to the canvas (selection)
</script>

<template>
  <a-space direction="vertical" style="width: 100%;">
    <a-row>
      <a-input-number :addonBefore="$t('gen.seed')" v-model:value="appState.commonPayload.seed"></a-input-number>
      <a-button @click="rerollSeed">
        <DiceOutlined></DiceOutlined>
      </a-button>
    </a-row>
  </a-space>
</template>

<style scoped></style>
