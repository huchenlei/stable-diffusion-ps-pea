<script setup lang="ts">
import { ref, reactive, computed, toRaw } from 'vue';
import {
  CommonPayload,
  Img2ImgPayload,
  Txt2ImgPayload,
  GenerationMode,
} from '../Automatic1111';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import { photopeaContext, type PhotopeaBound } from '../Photopea';
import { PayloadImage, cropImage } from '../ImageUtil';
import SDModelSelection from '@/components/SDModelSelection.vue';
import PayloadRadio from '@/components/PayloadRadio.vue';
import Img2ImgPayloadDisplay from '@/components/Img2ImgPayloadDisplay.vue';
import Txt2ImgPayloadDisplay from '@/components/Txt2ImgPayloadDisplay.vue';
import ResultImagesPicker from '@/components/ResultImagesPicker.vue';
import GenerationProgress from '@/components/GenerationProgress.vue';
import PromptInput from '@/components/PromptInput.vue';
import ControlNet from '@/components/ControlNet.vue';
import { ControlNetUnit, type IControlNetUnit } from '@/ControlNet';
import { getCurrentInstance } from 'vue';

const generationMode = ref(GenerationMode.Img2Img);
const autoGenerationMode = ref(true);
const generationActive = ref(false);
const left = ref(0);
const top = ref(0);
const width = ref(0);
const height = ref(0);

const context = useA1111ContextStore().a1111Context;
const commonPayload = reactive(new CommonPayload());
commonPayload.sampler_name = context.samplers[0].name;
const img2imgPayload = reactive(new Img2ImgPayload());
const txt2imgPayload = reactive(new Txt2ImgPayload());

const inputImage = ref<PayloadImage | undefined>(undefined);
const inputMask = ref<PayloadImage | undefined>(undefined);

// Extension payloads.
const controlnetUnits = reactive([new ControlNetUnit()]);

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

async function setControlNetInputs(maskBound: PhotopeaBound): Promise<void> {
  for (const unit of controlnetUnits) {
    const mapBuffer = await photopeaContext.invoke('exportLayersWithName', unit.linkedLayerName, 'PNG') as ArrayBuffer;
    const map = await cropImage(mapBuffer, maskBound);
    unit.image = {
      image: map.dataURL,
      mask: null,
    };
  }
}

function fillExtensionsArgs() {
  if (useA1111ContextStore().controlnetContext.initialized) {
    commonPayload.alwayson_scripts['ControlNet'] = {
      args: toRaw(controlnetUnits).map(unit => {
        const payloadUnit = Object.fromEntries(
          Object.entries(unit)
            .filter(([key]) => key !== 'linkedLayerName')
        ) as any as IControlNetUnit;
        // TODO: Some modes still need preprocessor, such as Inpaint.
        payloadUnit.module = 'none';
        return payloadUnit;
      })
    };
  }
}

const { $notify } = getCurrentInstance()!.appContext.config.globalProperties;

async function preparePayload() {
  try {
    const imageBuffer = await photopeaContext.invoke('exportAllLayers', /* format= */'PNG') as ArrayBuffer;
    const maskBuffer = await photopeaContext.invoke('exportMaskFromSelection', /* format= */'PNG') as ArrayBuffer;
    const maskBound = JSON.parse(await photopeaContext.invoke('getSelectionBound') as string) as PhotopeaBound;
    const [image, mask] = await Promise.all([cropImage(imageBuffer, maskBound), cropImage(maskBuffer, maskBound)]);
    await setControlNetInputs(maskBound);
    // Handling extension
    fillExtensionsArgs();

    if (autoGenerationMode.value) {
      const isImg2Img = !(image.isSolidColor && mask.isSolidColor);
      generationMode.value = isImg2Img ? GenerationMode.Img2Img : GenerationMode.Txt2Img;
    }

    commonPayload.width = image.width;
    commonPayload.height = image.height;

    inputImage.value = image;
    inputMask.value = mask;
  } catch (e) {
    $notify(`${e}`);
  }
}

async function generate() {
  try {
    await preparePayload();
    const [image, mask] = [inputImage.value, inputMask.value];
    if (!image || !mask) return;

    const isImg2Img = generationMode.value === GenerationMode.Img2Img;
    const url = isImg2Img ? context.img2imgURL : context.txt2imgURL;
    const extraPayload = isImg2Img ? img2imgPayload : txt2imgPayload;
    if (isImg2Img) {
      img2imgPayload.init_images = [image.dataURL];
      img2imgPayload.mask = mask.dataURL;
    }

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
    width.value = image.width;
    height.value = image.height;
  } catch (e) {
    $notify(`${e}`);
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
        <a-form-item>
          <a-button class="generate" type="primary" @click="generate">{{ $t('generate') }}</a-button>
          <a-button @click="preparePayload">prepare</a-button>
        </a-form-item>
        <a-form-item :label="$t('gen.sampler')">
          <a-select ref="select" v-model:value="commonPayload.sampler_name" :options="samplerOptions"></a-select>
        </a-form-item>
        <a-form-item>
          <a-input-number :addonBefore="$t('gen.batchSize')" v-model:value="commonPayload.batch_size" :min="1"
            :max="64" />
        </a-form-item>
        <a-form-item>
          <a-input-number :addonBefore="$t('gen.cfg')" v-model:value="commonPayload.cfg_scale" :min="1" :max="30" />
        </a-form-item>
        <a-form-item>
          <a-input-number :addonBefore="$t('gen.samplingSteps')" v-model:value="commonPayload.steps" :min="1"
            :max="150" />
        </a-form-item>
        <a-space>
          <a-image v-if="inputImage" :src="inputImage.dataURL"></a-image>
          <a-image v-if="inputMask" :src="inputMask.dataURL"></a-image>
        </a-space>
        <ResultImagesPicker :image-urls="resultImages" :left="left" :top="top" :width="width" :height="height">
        </ResultImagesPicker>
      </a-form>

      <div>
        <a-collapse :bordered="false">
          <a-collapse-panel :header="$t('gen.advancedSettings')">
            <a-space direction="vertical">
              <a-input-number :addonBefore="$t('width')" addonAfter="px" v-model:value="commonPayload.width" :min="64"
                :max="2048" />
              <a-input-number :addonBefore="$t('height')" addonAfter="px" v-model:value="commonPayload.height" :min="64"
                :max="2048" />

              <div :hidden="generationMode !== GenerationMode.Img2Img">
                <Img2ImgPayloadDisplay :payload="img2imgPayload">
                </Img2ImgPayloadDisplay>
              </div>
              <div :hidden="generationMode !== GenerationMode.Txt2Img">
                <Txt2ImgPayloadDisplay :payload="txt2imgPayload">
                </Txt2ImgPayloadDisplay>
              </div>
            </a-space>
          </a-collapse-panel>
        </a-collapse>
        <ControlNet :units="controlnetUnits"></ControlNet>
      </div>
    </a-space>
  </div>
</template>

<style scoped>
.root,
.generate {
  width: 100%;
}
</style>