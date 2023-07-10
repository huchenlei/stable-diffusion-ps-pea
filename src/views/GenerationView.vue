<script setup lang="ts">
import { ref, reactive } from 'vue';
import { A1111Context, type ISampler, CommonPayload, type IStableDiffusionModel } from '../Automatic1111';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import { photopeaContext, type PhotopeaBound } from '../Photopea';
import { applyMask, cropImage } from '../ImageUtil';
import SDModelSelection from '@/components/SDModelSelection.vue';

const context = useA1111ContextStore().a1111Context;
const payload = reactive(new CommonPayload());
const imgSrc = ref('');

function samplerOptions(samplers: ISampler[]) {
  return samplers.map(sampler => {
    return {
      value: sampler.name,
      label: sampler.name,
    };
  });
}

async function generate() {
  const response = await fetch(context.txt2imgURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  imgSrc.value = `data:image/png;base64,${data['images'][0] as string}`;

  try {
    await photopeaContext.invoke('pasteImageAsNewLayer', imgSrc.value);
  } catch (e) {
    console.error(e);
  }
}

async function captureMask() {
  const maskBuffer = await photopeaContext.invoke('exportMaskFromSelection', /* format= */'PNG') as ArrayBuffer;
  const maskBound = JSON.parse(await photopeaContext.invoke('getSelectionBound') as string) as PhotopeaBound;
  imgSrc.value = await cropImage(maskBuffer, maskBound);
}

async function captureImage() {
  const imageBuffer = await photopeaContext.invoke('exportAllLayers', /* format= */'PNG') as ArrayBuffer;
  const maskBound = JSON.parse(await photopeaContext.invoke('getSelectionBound') as string) as PhotopeaBound;
  imgSrc.value = await cropImage(imageBuffer, maskBound);
}

</script>
<template>
  <a-space direction="vertical">
    <SDModelSelection :models="context.sdModels" :activeModelName="context.options.sd_model_checkpoint"
      @change="(value: string) => context.options.sd_model_checkpoint = value">
    </SDModelSelection>

    <a-form :model="payload" class="payload">
      <a-form-item>
        <a-textarea v-model:value="payload.prompt" placeholder="Enter prompt here"
          :autoSize="{ minRows: 2, maxRows: 6 }" />
      </a-form-item>

      <a-form-item>
        <a-textarea v-model:value="payload.negative_prompt" placeholder="Enter negative prompt here"
          :autoSize="{ minRows: 2, maxRows: 6 }" />
      </a-form-item>

      <a-form-item label="sampler" name="sampler">
        <a-select ref="select" v-model:value="payload.sampler_name"
          :options="samplerOptions(context.samplers)"></a-select>
      </a-form-item>

      <a-form-item label="Batch Size" name="batch_size">
        <a-input-number v-model:value="payload.batch_size" :min="1" :max="64" />
      </a-form-item>

      <a-form-item label="CFG Scale" name="cfg_scale">
        <a-input-number v-model:value="payload.cfg_scale" :min="1" :max="30" />
      </a-form-item>

      <a-form-item>
        <a-button type="primary" @click="generate">{{ $t('generate') }}</a-button>
      </a-form-item>

      <a-form-item>
        <a-button type="primary" @click="captureMask">capture mask</a-button>
      </a-form-item>

      <a-form-item>
        <a-button type="primary" @click="captureImage">capture image</a-button>
      </a-form-item>

      <a-image v-model:src="imgSrc" />
    </a-form>
  </a-space>
</template>