<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStateStore } from '@/stores/appStateStore';
import DiceOutlined from '@/components/svg/DiceOutlined.vue';
import PromptInput from '@/components/PromptInput.vue';
import { useConfigStore } from '@/stores/configStore';
import SliderGroup from '@/components/SliderGroup.vue';

const appStateStore = useAppStateStore();
const appState = appStateStore.appState;
const configStore = useConfigStore();
const allConfigOptions = computed(() => Object.keys(configStore.configEntries).map(configName => {
  return {
    label: configName,
    value: configName,
  };
}));
const filterConfig = (input: string, option: any) => {
  return option.value.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

function onSelectLCMConfig(configName: string) {
  configStore.lcmConfigName = configName;
  configStore.persistLCM();
}

function rerollSeed() {
  // Generate a 32-bit integer
  appState.commonPayload.seed = Math.floor(Math.random() * Math.pow(2, 32));
}

// Send the rendered image to the canvas (selection)
function sendToCanvas() {

}
</script>

<template>
  <a-space direction="vertical" style="width: 100%;">
    <a-row style="display: flex; align-items: center;">
      <a-tag style="border: none; flex: 0 0 auto;">{{ $t('realtime.realtimeConfig') }}</a-tag>
      <a-select :value="configStore.lcmConfigName" @update:value="onSelectLCMConfig" :options="allConfigOptions"
        show-search :filter-option="filterConfig" style="flex: 1 1 auto;"></a-select>
    </a-row>
    <SliderGroup :label="$t('gen.denoisingStrength')" v-model:value="appState.img2imgPayload.denoising_strength" :min="0"
      :max="1" :step="0.05"></SliderGroup>
    <!-- Seed control.
     - Display the current active seed
     - A button that reroll the seed
     - A list of previously used seeds -->
    <a-row>
      <a-input-number :addonBefore="$t('gen.seed')" v-model:value="appState.commonPayload.seed"></a-input-number>
      <a-button @click="rerollSeed">
        <DiceOutlined></DiceOutlined>
      </a-button>
      <a-button @click="sendToCanvas">
        {{ $t('realtime.sendToCanvas') }}
      </a-button>
    </a-row>

    <PromptInput v-model:payload="appState.commonPayload"></PromptInput>
  </a-space>
</template>

<style scoped></style>
