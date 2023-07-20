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
import ImagePicker from '@/components/ImagePicker.vue';
import GenerationProgress from '@/components/GenerationProgress.vue';
import PromptInput from '@/components/PromptInput.vue';
import ControlNet from '@/components/ControlNet.vue';
import { ControlNetUnit, type IControlNetUnit } from '@/ControlNet';
import { getCurrentInstance } from 'vue';
import { CloseOutlined, CheckOutlined } from '@ant-design/icons-vue';
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

const generationState = ref(GenerationState.kInitialState);

// Extension payloads.
const controlnetUnits = reactive([new ControlNetUnit()]);

// Image URLs of generated images.
const resultImages: string[] = reactive([]);
const selectedResultImageNames = computed(() => {
  return selectedResultImages.map(image => image.name);
});

interface ImageItem {
  imageURL: string;
  name: string;
};
const resultImageItems = computed(() => {
  return resultImages.map((url, index) => {
    return {
      imageURL: url,
      name: `result-${index}`,
    };
  });
});
const selectedResultImages: ImageItem[] = reactive([]);

async function switchResultImage(imageItem: ImageItem) {
  await photopeaContext.executeTask(async () => {
    await deselectResultImage();
    await selectResultImage(imageItem);
  });

  if (!ctrlPressed.value) {
    selectedResultImages.length = 0;
  }
  selectedResultImages.push(imageItem);
}
// Thead unsafe. Need to be called within task.
async function deselectResultImage() {
  // Remove ResultTempLayer (Deselect previous item).
  await photopeaContext.invoke('removeTopLevelLayer', 'ResultTempLayer');
}
// Thead unsafe. Need to be called within task.
async function selectResultImage(imageItem: ImageItem) {
  await photopeaContext.pasteImageOnPhotopea(
    imageItem.imageURL, left.value, top.value, width.value, height.value, 'ResultTempLayer');
}
function finalizeSelection() {
  resultImages.length = 0;
  selectedResultImages.length = 0;
  generationState.value = GenerationState.kInitialState;
}
async function pickSelectedResultImages() {
  await photopeaContext.executeTask(async () => {
    await deselectResultImage();
    for (const image of selectedResultImages) {
      await selectResultImage(image);
    }
  });
  finalizeSelection();
}

async function discardResultImages() {
  await photopeaContext.executeTask(async () => {
    await deselectResultImage();
  });
  finalizeSelection();
}

const ctrlPressed = ref(false);
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Control') {
    ctrlPressed.value = true;
  }
}
function onKeyup(e: KeyboardEvent) {
  if (e.key === 'Control') {
    ctrlPressed.value = false;
  }
}
window.addEventListener('keydown', onKeydown);
window.addEventListener('keyup', onKeyup);

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
    const mapBuffer = await photopeaContext.invokeAsTask('exportLayersWithName', unit.linkedLayerName, 'PNG') as ArrayBuffer;
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
  try {
    await photopeaContext.executeTask(async () => {
      inputImageBuffer.value = await photopeaContext.invoke('exportAllLayers', /* format= */'PNG') as ArrayBuffer;
      inputMaskBuffer.value = await photopeaContext.invoke('exportMaskFromSelection', /* format= */'PNG') as ArrayBuffer;
      await photopeaContext.invoke('fillSelectionWithBlackInNewLayer', /* layerName= */"TempMaskLayer");
      generationState.value = GenerationState.kSelectRefAreaState;
    });
    return true;
  } catch (e) {
    console.error(e);
    $notify(`${e}`);
    return false;
  }
}

async function preparePayload() {
  try {
    const [image, mask, maskBound] = await photopeaContext.executeTask(async () => {
      if (generationState.value === GenerationState.kSelectRefAreaState) {
        // Remove the temp layer on canvas.
        await photopeaContext.invoke('removeTopLevelLayer', /* layerName= */"TempMaskLayer");
      } else {
        inputImageBuffer.value = await photopeaContext.invoke('exportAllLayers', /* format= */'PNG') as ArrayBuffer;
        inputMaskBuffer.value = await photopeaContext.invoke('exportMaskFromSelection', /* format= */'PNG') as ArrayBuffer;
      }

      const maskBound = JSON.parse(await photopeaContext.invoke('getSelectionBound') as string) as PhotopeaBound;
      const [image, mask] = await Promise.all([
        cropImage(inputImageBuffer.value!, maskBound),
        cropImage(inputMaskBuffer.value!, maskBound),
      ]);
      return [image, mask, maskBound];
    });

    await setControlNetInputs(maskBound!);
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

    const isImg2Img = generationMode.value === GenerationMode.Img2Img;
    if (isImg2Img) {
      img2imgPayload.init_images = [image.dataURL];
      img2imgPayload.mask = mask.dataURL;
    }

    generationState.value = GenerationState.kPayloadPreparedState;
    return true;
  } catch (e) {
    console.error(e);
    $notify(`${e}`);
    return false;
  }
}

async function sendPayload() {
  try {
    // Start progress bar.
    generationActive.value = true;

    const isImg2Img = generationMode.value === GenerationMode.Img2Img;
    const url = isImg2Img ? context.img2imgURL : context.txt2imgURL;
    const extraPayload = isImg2Img ? img2imgPayload : txt2imgPayload;
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

    resultImages.length = 0; // Clear array content.
    resultImages.push(...data['images'].map((image: string) => `data:image/png;base64,${image}`));
    const imageItem = resultImageItems.value[0];
    await photopeaContext.executeTask(async () => {
      await selectResultImage(imageItem);
    });
    selectedResultImages.push(imageItem);

    inputImageBuffer.value = undefined;
    inputMaskBuffer.value = undefined;
    inputImage.value = undefined;
    inputMask.value = undefined;

    generationState.value = GenerationState.kFinishedState;
  } catch (e) {
    console.error(e);
    $notify(`${e}`);
  }
}

async function generate() {
  if (generationState.value !== GenerationState.kPayloadPreparedState) {
    const success = await preparePayload();
    if (!success) {
      return false;
    }
  }
  await sendPayload();
}

const hoveredStep = ref<GenerationState | undefined>(undefined);
function highlightGenerationStep(state: GenerationState) {
  hoveredStep.value = state;
}

function removeGenerationStepHighlight() {
  hoveredStep.value = undefined;
}

const stepProgress = computed(() => {
  if (hoveredStep.value !== undefined) {
    return hoveredStep.value;
  } else {
    return generationState.value;
  }
});

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
          <a-space>
            <a-progress :class="{ 'generation-step': true, 'blink': hoveredStep !== undefined }"
              :percent="stepProgress * 33.33" :steps="3" :showInfo="false" />
            <a-tag class="next-step-tag">
              {{ $t(`gen.steps.${hoveredStep === undefined ? '' : 'To'}${GenerationState[stepProgress]}`) }}
            </a-tag>
          </a-space>
          <a-row>
            <a-button class="ref-area-button" :disabled="generationState >= GenerationState.kSelectRefAreaState"
              @click="startSelectRefArea" @mouseover="highlightGenerationStep(GenerationState.kSelectRefAreaState)"
              @mouseout="removeGenerationStepHighlight">{{
                $t('gen.selectRefArea') }}</a-button>
            <a-button class="prepare-button" :disabled="generationState >= GenerationState.kPayloadPreparedState"
              @click="preparePayload" @mouseover="highlightGenerationStep(GenerationState.kPayloadPreparedState)"
              @mouseout="removeGenerationStepHighlight">{{
                $t('gen.prepare')
              }}</a-button>
          </a-row>
          <a-button class="generate" type="primary" @click="generate"
            :disabled="generationState >= GenerationState.kFinishedState"
            @mouseover="highlightGenerationStep(GenerationState.kFinishedState)"
            @mouseout="removeGenerationStepHighlight">{{ $t('generate') }}</a-button>
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
        <ImagePicker :images="resultImageItems" :selectedImages="selectedResultImageNames"
          @item-clicked="switchResultImage" :displayNames="false"></ImagePicker>
        <a-row v-if="resultImageItems.length > 0">
          <a-button :danger="true" class="discard-result" @click="discardResultImages">
            <CloseOutlined></CloseOutlined>
          </a-button>
          <a-button type="primary" class="pick-result" @click="pickSelectedResultImages">
            <CheckOutlined></CheckOutlined>
          </a-button>
        </a-row>
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
.ref-area-button,
.pick-result,
.discard-result {
  width: 50%;
}

/* Define the blinking animation */
@keyframes blink {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}

/* This class will be added to start the blinking */
.blink {
  animation: blink 2s ease-in-out infinite !important;
}

.next-step-tag {
  border: none;
}
</style>