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
import _ from 'lodash';

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

const inputImageBuffer = ref<ArrayBuffer | undefined>(undefined);
const inputMaskBuffer = ref<ArrayBuffer | undefined>(undefined);

const inputImage = ref<PayloadImage | undefined>(undefined);
const inputMask = ref<PayloadImage | undefined>(undefined);

/**
 * Overall workflow:
 * Option1:
 * - Do a selection on canvas.
 * - Click generate. 
 * Most common usage. Equivalent to hit prepare + generate.
 * 
 * Option2:
 * - Do a selection on canvas.
 * - Click prepare.
 * - Click generate.
 * This will let user preview all the inputs before sending them to A1111. User
 * can make necessary changes to the payload if they undesirable params.
 * 
 * Option3:
 * - Do a selection on canvas.
 * - Click select ref area.
 * - Do another selection on canvas.
 * - [Optional] Click prepare.
 * - Click generate.
 * On previous 2 options, the ref area is automatically determined by the app.
 * This option lets the user to manually specify the reference area.
 */
enum GenerationState {
  kInitialState = 0,
  kSelectRefAreaState = 1,
  kPayloadPreparedState = 2,
  kFinishedState = 3,
}

const generationState = computed(() => {
  if (_.every([inputImageBuffer, inputMaskBuffer, inputImage, inputMask], r => r.value === undefined)) {
    return GenerationState.kInitialState;
  } else if (_.every([inputImageBuffer, inputMaskBuffer], r => r.value !== undefined) &&
    _.every([inputImage, inputMask], r => r.value === undefined)) {
    return GenerationState.kSelectRefAreaState;
  } else if (_.every([inputImageBuffer, inputMaskBuffer, inputImage, inputMask], r => r.value !== undefined)) {
    return GenerationState.kPayloadPreparedState;
  }

  throw `UNREACHED! ${[inputImageBuffer, inputMaskBuffer, inputImage, inputMask]}`;
});

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
    if (generationState.value === GenerationState.kSelectRefAreaState) {
      // Remove the temp layer on canvas.
      await photopeaContext.invoke('removeTopLevelLayer', /* layerName= */"TempMaskLayer");
    }

    const imageBuffer = inputImageBuffer.value ? inputImageBuffer.value : (await photopeaContext.invoke('exportAllLayers', /* format= */'PNG') as ArrayBuffer);
    const maskBuffer = inputMaskBuffer.value ? inputMaskBuffer.value : (await photopeaContext.invoke('exportMaskFromSelection', /* format= */'PNG') as ArrayBuffer);

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

    left.value = image.left;
    top.value = image.top;
    width.value = image.width;
    height.value = image.height;
  } catch (e) {
    console.error(e);
    $notify(`${e}`);
  }
}

async function sendPayload() {
  try {
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

    inputImageBuffer.value = undefined;
    inputMaskBuffer.value = undefined;
    inputImage.value = undefined;
    inputMask.value = undefined;
  } catch (e) {
    console.error(e);
    $notify(`${e}`);
  }
}

async function generate() {
  await preparePayload();
  await sendPayload();
}

/**
 * Two-stage selection on Photoshop/Photopea canvas.
 * The first stage selects the area to workon (inpaint area).
 * The second stage selects the reference area, bounding box of the image actually
 * send to A1111.
 * 
 * In normal generation, the bounding box is automatically determined. Here we let
 * user manually determine the bounding box of reference area.
 * 
 * Triggering this function will make the app going into a intemediant state,
 * where the current selection(mask) is persisted, and user need to do another 
 * selection on canvas to continue.
 */
async function startSelectRefArea() {
  inputImageBuffer.value = await photopeaContext.invoke('exportAllLayers', /* format= */'PNG') as ArrayBuffer;
  inputMaskBuffer.value = await photopeaContext.invoke('exportMaskFromSelection', /* format= */'PNG') as ArrayBuffer;
  await photopeaContext.invoke('fillSelectionWithBlackInNewLayer', /* layerName= */"TempMaskLayer");
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
          <a-progress class="generation-step" :percent="generationState * 33.33" :steps="3" :showInfo="false" />
          <a-button class="ref-area-button" :disabled="generationState >= GenerationState.kSelectRefAreaState"
            @click="startSelectRefArea">{{
              $t('gen.selectRefArea') }}</a-button>
          <a-button class="prepare-button" :disabled="generationState >= GenerationState.kPayloadPreparedState"
            @click="preparePayload">{{
              $t('gen.prepare')
            }}</a-button>
          <a-button class="generate" type="primary" @click="generate">{{ $t('generate') }}</a-button>
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
        <a-space v-if="generationMode === GenerationMode.Img2Img">
          <div v-if="inputImage">
            <a-tag>Input image</a-tag>
            <a-image :src="inputImage.dataURL"></a-image>
          </div>
          <div v-if="inputMask">
            <a-tag>Input mask</a-tag>
            <a-image :src="inputMask.dataURL"></a-image>
          </div>
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
.generate,
.generation-step {
  width: 100%;
}

.prepare-button,
.ref-area-button {
  width: 50%;
}
</style>