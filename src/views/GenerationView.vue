<script setup lang="ts">
import { ref, reactive } from 'vue';
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

const generationMode = reactive(ref(GenerationMode.Img2Img));

const context = useA1111ContextStore().a1111Context;
const commonPayload = reactive(new CommonPayload());
const img2imgPayload = reactive(new Img2ImgPayload());
const txt2imgPayload = reactive(new Txt2ImgPayload());

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
  try {
    const imageBuffer = await photopeaContext.invoke('exportAllLayers', /* format= */'PNG') as ArrayBuffer;
    const maskBuffer = await photopeaContext.invoke('exportMaskFromSelection', /* format= */'PNG') as ArrayBuffer;
    const maskBound = JSON.parse(await photopeaContext.invoke('getSelectionBound') as string) as PhotopeaBound;

    const [image, mask] = await Promise.all([cropImage(imageBuffer, maskBound), cropImage(maskBuffer, maskBound)]);
    const isImg2Img = !(image.isSolidColor && mask.isSolidColor);
    const url = isImg2Img ? context.img2imgURL : context.txt2imgURL;


  } catch (e) {
    console.error(e);
    return;
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commonPayload),
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
  imgSrc.value = (await cropImage(maskBuffer, maskBound)).dataURL;
}

async function captureImage() {
  const imageBuffer = await photopeaContext.invoke('exportAllLayers', /* format= */'PNG') as ArrayBuffer;
  const maskBound = JSON.parse(await photopeaContext.invoke('getSelectionBound') as string) as PhotopeaBound;
  imgSrc.value = (await cropImage(imageBuffer, maskBound)).dataURL;
}

</script>
<template>
  <a-space direction="vertical">
    <SDModelSelection :models="context.sdModels" :activeModelName="context.options.sd_model_checkpoint"
      @change="(value: string) => context.options.sd_model_checkpoint = value">
    </SDModelSelection>

    <PayloadRadio v-model:value="generationMode" :enum-type="GenerationMode"></PayloadRadio>

    <a-form :model="commonPayload" class="payload">
      <a-form-item>
        <a-textarea v-model:value="commonPayload.prompt" placeholder="Enter prompt here"
          :autoSize="{ minRows: 2, maxRows: 6 }" />
      </a-form-item>

      <a-form-item>
        <a-textarea v-model:value="commonPayload.negative_prompt" placeholder="Enter negative prompt here"
          :autoSize="{ minRows: 2, maxRows: 6 }" />
      </a-form-item>

      <a-form-item label="Batch Size" name="batch_size">
        <a-input-number v-model:value="commonPayload.batch_size" :min="1" :max="64" />
      </a-form-item>

      <a-form-item label="CFG Scale" name="cfg_scale">
        <a-input-number v-model:value="commonPayload.cfg_scale" :min="1" :max="30" />
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

    <a-collapse :bordered="false">
      <a-collapse-panel header="Advanced settings">
        <a-form-item label="sampler" name="sampler">
          <a-select ref="select" v-model:value="commonPayload.sampler_name"
            :options="samplerOptions(context.samplers)"></a-select>
        </a-form-item>
        <Img2ImgPayloadDisplay v-if="generationMode === GenerationMode.Img2Img" :payload="img2imgPayload">
        </Img2ImgPayloadDisplay>
        <Txt2ImgPayloadDisplay v-if="generationMode === GenerationMode.Txt2Img" :payload="txt2imgPayload">
        </Txt2ImgPayloadDisplay>
      </a-collapse-panel>
    </a-collapse>
  </a-space>
</template>

<style scoped>
textarea {
  width: 85vw;
}
</style>