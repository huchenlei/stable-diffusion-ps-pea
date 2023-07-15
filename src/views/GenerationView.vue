<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import {
  type ISampler,
  CommonPayload,
  Img2ImgPayload,
  Txt2ImgPayload,
  GenerationMode,
} from '../Automatic1111';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import { photopeaContext, type PhotopeaBound } from '../Photopea';
import { cropImage } from '../ImageUtil';
import SDModelSelection from '@/components/SDModelSelection.vue';
import PayloadRadio from '@/components/PayloadRadio.vue';
import Img2ImgPayloadDisplay from '@/components/Img2ImgPayloadDisplay.vue';
import Txt2ImgPayloadDisplay from '@/components/Txt2ImgPayloadDisplay.vue';
import ResultImagesPicker from '@/components/ResultImagesPicker.vue';
import GenerationProgress from '@/components/GenerationProgress.vue';
import PromptInput from '@/components/PromptInput.vue';

const generationMode = ref(GenerationMode.Img2Img);
const autoGenerationMode = ref(true);
const generationActive = ref(false);
const left = ref(0);
const top = ref(0);

const context = useA1111ContextStore().a1111Context;
const commonPayload = reactive(new CommonPayload());
commonPayload.sampler_name = context.samplers[0].name;
const img2imgPayload = reactive(new Img2ImgPayload());
const txt2imgPayload = reactive(new Txt2ImgPayload());

// Image URLs of generated images.
const resultImages: string[] = reactive([]);

const samplerOptions = computed(() => {
  return context.samplers.map(sampler => {
    return {
      value: sampler.name,
      label: sampler.name,
    };
  });
});

async function generate() {
  try {
    const imageBuffer = await photopeaContext.invoke('exportAllLayers', /* format= */'PNG') as ArrayBuffer;
    const maskBuffer = await photopeaContext.invoke('exportMaskFromSelection', /* format= */'PNG') as ArrayBuffer;
    const maskBound = JSON.parse(await photopeaContext.invoke('getSelectionBound') as string) as PhotopeaBound;

    const [image, mask] = await Promise.all([cropImage(imageBuffer, maskBound), cropImage(maskBuffer, maskBound)]);

    if (autoGenerationMode.value) {
      const isImg2Img = !(image.isSolidColor && mask.isSolidColor);
      generationMode.value = isImg2Img ? GenerationMode.Img2Img : GenerationMode.Txt2Img;
    }

    const isImg2Img = generationMode.value === GenerationMode.Img2Img;
    const url = isImg2Img ? context.img2imgURL : context.txt2imgURL;
    const extraPayload = isImg2Img ? img2imgPayload : txt2imgPayload;
    if (isImg2Img) {
      img2imgPayload.init_images = [image.dataURL];
      img2imgPayload.mask = mask.dataURL;
    }
    commonPayload.width = image.width;
    commonPayload.height = image.height;

    // Start progress bar.
    generationActive.value = true;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...commonPayload,
        ...extraPayload,
      }),
    });
    const data = await response.json();

    // Clear array content.
    resultImages.length = 0;
    resultImages.push(...data['images'].map((image: string) => `data:image/png;base64,${image}`));
    left.value = image.left;
    top.value = image.top;
  } catch (e) {
    console.error(e);
    return;
  }
}

</script>
<template>
  <div>
    <GenerationProgress v-model:active="generationActive"></GenerationProgress>

    <a-space direction="vertical" class="root">
      <SDModelSelection :models="context.sdModels" :activeModelName="context.options.sd_model_checkpoint"
        @change="(value: string) => context.options.sd_model_checkpoint = value">
      </SDModelSelection>

      <a-space>
        <PayloadRadio :value="generationMode" @update:value="mode => generationMode = mode" :enum-type="GenerationMode">
        </PayloadRadio>
        <a-checkbox v-model:checked="autoGenerationMode" :label="$t('gen.autoGenerationModeHint')">Auto</a-checkbox>
      </a-space>

      <a-form :model="commonPayload" class="payload" :labelWrap="true" layout="vertical" size="small">
        <a-form-item>
          <PromptInput v-model:payload="commonPayload"></PromptInput>
        </a-form-item>
        <a-form-item label="Sampler">
          <a-select ref="select" v-model:value="commonPayload.sampler_name" :options="samplerOptions"></a-select>
        </a-form-item>
        <a-form-item>
          <a-input-number addonBefore="Batch Size" v-model:value="commonPayload.batch_size" :min="1" :max="64" />
        </a-form-item>
        <a-form-item>
          <a-input-number addonBefore="CFG Scale" v-model:value="commonPayload.cfg_scale" :min="1" :max="30" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="generate">{{ $t('generate') }}</a-button>
        </a-form-item>
        <ResultImagesPicker :image-urls="resultImages" :left="left" :top="top"></ResultImagesPicker>
      </a-form>

      <a-collapse :bordered="false">
        <a-collapse-panel header="Advanced settings">
          <a-space direction="vertical">
            <a-input-number :addonBefore="$t('width')" addonAfter="px" v-model:value="commonPayload.width" :min="64"
              :max="2048" />
            <a-input-number :addonBefore="$t('height')" addonAfter="px" v-model:value="commonPayload.height" :min="64"
              :max="2048" />

            <Img2ImgPayloadDisplay v-if="generationMode === GenerationMode.Img2Img" :payload="img2imgPayload">
            </Img2ImgPayloadDisplay>
            <Txt2ImgPayloadDisplay v-if="generationMode === GenerationMode.Txt2Img" :payload="txt2imgPayload">
            </Txt2ImgPayloadDisplay>
          </a-space>
        </a-collapse-panel>
      </a-collapse>
    </a-space>
  </div>
</template>

<style scoped>
.root {
  width: 100%;
}
</style>