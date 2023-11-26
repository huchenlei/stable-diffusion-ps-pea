<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAppStateStore } from '@/stores/appStateStore';
import DiceOutlined from '@/components/svg/DiceOutlined.vue';
import PromptInput from '@/components/PromptInput.vue';
import { useConfigStore } from '@/stores/configStore';
import SliderGroup from '@/components/SliderGroup.vue';
import { photopeaContext, type PhotopeaBound } from '@/Photopea';
import { PayloadImage, cropImage } from '@/ImageUtil';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import type { IGenerationResult } from '@/Automatic1111';
import { message } from 'ant-design-vue';
import { applyStateDiff, type StateDiff } from '@/Config';
import type { ApplicationState } from '@/Core';
import _ from "lodash";


const a1111Context = useA1111ContextStore().a1111Context;
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

const seed = ref<number>(0);
function rerollSeed() {
  // Generate a 32-bit integer
  seed.value = Math.floor(Math.random() * Math.pow(2, 32));
}

// Send the rendered image to the canvas (selection)
function sendToCanvas() {

}

const renderResult = ref<string | null>(null);
const documentId = ref<number>(0);
const documentName = ref<string>('');
let viewActive = true;
onMounted(async () => {
  async function getActiveDoc(): Promise<[number, string]> {
    return JSON.parse(
      await photopeaContext.invokeAsTask('getActiveDoc'));
  }

  async function getInputImage(): Promise<PayloadImage> {
    const [imageBuffer, bounds] = await photopeaContext.executeTask(async () => {
      const imageBuffer = await photopeaContext.invoke('exportAllLayers', 'PNG') as ArrayBuffer;
      const bounds = JSON.parse(await photopeaContext.invoke('getActiveBound')) as PhotopeaBound;
      return [imageBuffer, bounds];
    });
    return await cropImage(imageBuffer, bounds);
  }

  async function sendPayload(appState: ApplicationState): Promise<string> {
    const response = await fetch(a1111Context.img2imgURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...appState.commonPayload,
        ...appState.img2imgPayload,
      }),
    });
    const result = await response.json() as IGenerationResult;
    if (result.images.length === 0) {
      message.error("No image response from A1111 server.");
      return '';
    }
    return `data:image/png;base64,${result.images[0]}`;
  }

  let previousPayload: ApplicationState | null = null;
  async function renderCanvas() {
    const activeDocumentId = (await getActiveDoc())[0];
    if (documentId.value !== activeDocumentId) {
      return;
    }
    const stateToSend: ApplicationState = _.cloneDeep(appState);

    // Apply LCM config.
    const lcmConfig: StateDiff = configStore.configEntries[configStore.lcmConfigName];
    applyStateDiff(stateToSend, lcmConfig);
    let inputImage: PayloadImage;
    try {
      inputImage = await getInputImage();
    } catch (e) {
      // Failed to get input image.
      return;
    }
    stateToSend.img2imgPayload.init_images = [inputImage.dataURL];
    stateToSend.img2imgPayload.mask = undefined;
    stateToSend.commonPayload.height = inputImage.height;
    stateToSend.commonPayload.width = inputImage.width;
    stateToSend.commonPayload.prompt += ',' + appState.commonPayload.prompt;
    stateToSend.commonPayload.seed = seed.value;

    // Prevent rendering if payload unchanged.
    if (_.isEqual(previousPayload, stateToSend))
      return;

    renderResult.value = await sendPayload(stateToSend);
    previousPayload = stateToSend;
  }

  function scheduleNextRender(fixedInterval: number) {
    if (!viewActive) return;

    console.debug("RealtimeRender: Schedule next render");
    let renderCompleted = false;
    let fixedTimerElapsed = false;
    function checkAndScheduleNextRender() {
      if (renderCompleted && fixedTimerElapsed) {
        scheduleNextRender(fixedInterval);
      }
    }

    renderCanvas().then(() => {
      renderCompleted = true;
      checkAndScheduleNextRender();
    });

    window.setTimeout(() => {
      fixedTimerElapsed = true;
      checkAndScheduleNextRender();
    }, fixedInterval);
  }

  scheduleNextRender(2000);
  [documentId.value, documentName.value] = await getActiveDoc();
  rerollSeed();
});

onUnmounted(() => {
  viewActive = false;
});
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
    <a-row>
      <a-input-number :addonBefore="$t('gen.seed')" v-model:value="seed"></a-input-number>
      <a-button @click="rerollSeed">
        <DiceOutlined></DiceOutlined>
      </a-button>
      <a-button @click="sendToCanvas">
        {{ $t('realtime.sendToCanvas') }}
      </a-button>
    </a-row>

    <PromptInput v-model:payload="appState.commonPayload"></PromptInput>
    <a-image v-if="renderResult" :src="renderResult" :preview=false></a-image>
  </a-space>
</template>

<style scoped></style>
