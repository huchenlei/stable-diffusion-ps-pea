<script setup lang="ts">
import { ref, reactive, computed, toRaw } from 'vue';
import { GenerationMode, type IGeneratedImage, type IGenerationInfo, type IGenerationResult } from '../Automatic1111';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import { photopeaContext, type PhotopeaBound } from '../Photopea';
import { PayloadImage, cropImage } from '../ImageUtil';
import SDModelSelection from '@/components/SDModelSelection.vue';
import VaeSelection from '@/components/VaeSelection.vue';
import PayloadRadio from '@/components/PayloadRadio.vue';
import Img2ImgPayloadDisplay from '@/components/Img2ImgPayloadDisplay.vue';
import Txt2ImgPayloadDisplay from '@/components/Txt2ImgPayloadDisplay.vue';
import GenerationProgress from '@/components/GenerationProgress.vue';
import PromptInput from '@/components/PromptInput.vue';
import ControlNet from '@/components/ControlNet.vue';
import UltimateUpscale from '@/components/UltimateUpscale.vue';
import { type IControlNetUnit } from '@/ControlNet';
import SliderGroup from '@/components/SliderGroup.vue';
import GenerationResultPicker from '@/components/GenerationResultPicker.vue';
import { getCurrentInstance } from 'vue';
import _ from 'lodash';
import { ApplicationState, ImageResultDestination, ReferenceRangeMode } from '@/Core';
import { ReloadOutlined } from '@ant-design/icons-vue';
import { useHistoryStore } from '@/stores/historyStore';
import { useAppStateStore } from '@/stores/appStateStore';
import { cloneNoBlob } from '@/Utils';
import { DEFAULT_CONFIG, applyStateDiff, appStateToStateDiff, type StateDiff } from '@/Config';
import { useConfigStore } from '@/stores/configStore';
import { CloseOutlined } from '@ant-design/icons-vue';
import { UltimateUpscaleScript } from '@/UltimateUpscale';

const context = useA1111ContextStore().a1111Context;
const appStateStore = useAppStateStore();
const appState = appStateStore.appState;
const configStore = useConfigStore();

// Whether the generation is in progress.
const generationActive = ref(false);
// The generation config used for the generation. This is used when the user
// clicks `generate more` buttons to make sure that the same final payload
// are sent to A1111.
const generationConfig = ref<string | null>(null);

// The bounding box to put the result image in.
const resultImageBound = ref<PhotopeaBound | undefined>(undefined);
const resultImageMaskBlur = ref<number | undefined>(undefined);

const inputImageBuffer = ref<ArrayBuffer | undefined>(undefined);
const inputMaskBuffer = ref<ArrayBuffer | undefined>(undefined);

const inputImage = ref<PayloadImage | undefined>(undefined);
const inputMask = ref<PayloadImage | undefined>(undefined);

function expandSelectionBound(bound: PhotopeaBound): void {
  // Note `ImageUtil.cropImage` will handle out of image bound issue.
  if (appState.referenceRangeMode === ReferenceRangeMode.kPercent) {
    const width = bound[2] - bound[0];
    const height = bound[3] - bound[1];
    const [_, percent] = appState.referenceRange;
    bound[0] = bound[0] - width * percent / 100;
    bound[1] = bound[1] - height * percent / 100;
    bound[2] = bound[2] + width * percent / 100;
    bound[3] = bound[3] + height * percent / 100;
  } else if (appState.referenceRangeMode === ReferenceRangeMode.kPixel) {
    const [px, _] = appState.referenceRange;
    bound[0] = bound[0] - px;
    bound[1] = bound[1] - px;
    bound[2] = bound[2] + px;
    bound[3] = bound[3] + px;
  } else {
    throw `NOTREACHED! ${appState.referenceRangeMode}`;
  }
}

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

const resultImages: IGeneratedImage[] = reactive([]);

const samplerOptions = computed(() => {
  return context.samplers.map(sampler => {
    return {
      value: sampler.name,
      label: sampler.name,
    };
  });
});

async function setControlNetInputs(maskBound: PhotopeaBound): Promise<void> {
  for (const unit of appState.controlnetUnits) {
    if (!unit.linkedLayerName) {
      continue;
    }
    const mapBuffer = await photopeaContext.invokeAsTask(
      'exportLayersWithNames', [unit.linkedLayerName, 'CN:Background'], 'PNG'
    ) as ArrayBuffer;
    const map = await cropImage(mapBuffer, maskBound);
    unit.image = {
      image: map.dataURL,
      mask: null,
    };
  }
}

function fillExtensionsArgs() {
  if (useA1111ContextStore().controlnetContext.initialized) {
    appState.commonPayload.alwayson_scripts['ControlNet'] = {
      args: toRaw(appState.controlnetUnits)
        .filter(unit => unit.enabled)
        .map(unit => {
          const linkedWithLayer = !!unit.linkedLayerName;
          const payloadUnit = Object.fromEntries(
            Object.entries(unit)
              .filter(([key]) => key !== 'linkedLayerName')
          ) as any as IControlNetUnit;

          if (linkedWithLayer) {
            payloadUnit.module = 'none';
          } else {
            // Use pixel perfect when using img2img input as ControlNet input.
            payloadUnit.pixel_perfect = true;
          }

          return payloadUnit;
        })
    };
  }

  if (ultimateUpscaleAvailable.value && appState.ultimateUpscale.enabled) {
    appState.commonPayload.script_name = UltimateUpscaleScript.script_name;
    appState.commonPayload.script_args = UltimateUpscaleScript.script_args(appState.ultimateUpscale);
    appState.imageResultDestination = ImageResultDestination.kNewCanvas;
  }
}

const ultimateUpscaleAvailable = computed(() => {
  return context.scripts.img2img.includes(UltimateUpscaleScript.script_name);
})

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
const selectRefAreaInProgress = ref<boolean>(false);
async function selectRefArea() {
  if (selectRefAreaInProgress.value) return;
  selectRefAreaInProgress.value = true;
  try {
    await photopeaContext.executeTask(async () => {
      const maskBound = JSON.parse(await photopeaContext.invoke('getSelectionBound') as string) as PhotopeaBound;
      resultImageBound.value = maskBound;
      await photopeaContext.invoke('createRefRangePlaceholder', maskBound,  /* layerName= */"TempMaskLayer");
      generationState.value = GenerationState.kSelectRefAreaState;
    });
    return true;
  } catch (e) {
    console.error(e);
    $notify(`${e}`);
    return false;
  } finally {
    selectRefAreaInProgress.value = false;
  }
}

const preparePayloadInProgress = ref<boolean>(false);
async function preparePayload() {
  if (preparePayloadInProgress.value) return;
  preparePayloadInProgress.value = true;

  if (generationState.value < GenerationState.kPayloadPreparedState) {
    useHistoryStore().addHistoryItem({
      timestamp: Date.now(),
      appState: cloneNoBlob(appState),
    });
  }

  try {
    const [image, mask] = await photopeaContext.executeTask(async () => {
      let bound: PhotopeaBound;
      if (generationState.value === GenerationState.kSelectRefAreaState) {
        // Remove the temp layer on canvas.
        await photopeaContext.invoke('removeTopLevelLayer', /* layerName= */"TempMaskLayer");
        bound = resultImageBound.value!;
      } else {
        bound = JSON.parse(await photopeaContext.invoke('getSelectionBound') as string) as PhotopeaBound;
        // Note: After expansion, there might be selection on region outside canvas.
        // We should use `image.bound` which is clampped against canvas to for the real
        // selection bound.
        if (appState.generationMode === GenerationMode.Img2Img)
          expandSelectionBound(bound);
      }

      inputImageBuffer.value = await photopeaContext.invoke('exportAllLayers', /* format= */'PNG') as ArrayBuffer;
      inputMaskBuffer.value = await photopeaContext.invoke('exportMaskFromSelection', /* format= */'PNG') as ArrayBuffer;
      const [image, mask] = await Promise.all([
        cropImage(inputImageBuffer.value, bound),
        cropImage(inputMaskBuffer.value, bound),
      ]);
      return [image, mask];
    });

    await setControlNetInputs(image.bound);
    // Handling extension
    fillExtensionsArgs();

    appState.commonPayload.width = image.width * appState.imageScale;
    appState.commonPayload.height = image.height * appState.imageScale;

    inputImage.value = image;
    inputMask.value = mask;

    const isImg2Img = appState.generationMode === GenerationMode.Img2Img;
    const isInpaint = isImg2Img && !mask.isSolidColor;
    if (isImg2Img) {
      appState.img2imgPayload.init_images = [image.dataURL];
      appState.img2imgPayload.mask = isInpaint ? mask.dataURL : undefined;
    }

    resultImageBound.value = image.bound;
    if (isInpaint) {
      resultImageMaskBlur.value = appState.img2imgPayload.mask_blur;
    }

    generationState.value = GenerationState.kPayloadPreparedState;
    return true;
  } catch (e) {
    console.error(e);
    $notify(`${e}`);
    return false;
  } finally {
    preparePayloadInProgress.value = false;
  }
}

async function sendPayload() {
  try {
    // Start progress bar.
    generationActive.value = true;

    const isImg2Img = appState.generationMode === GenerationMode.Img2Img;
    const url = isImg2Img ? context.img2imgURL : context.txt2imgURL;
    const extraPayload = isImg2Img ? appState.img2imgPayload : appState.txt2imgPayload;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...appState.commonPayload,
        ...extraPayload,
      }),
    });
    const result = await response.json() as IGenerationResult;

    // Expected number of images from generation.
    // ControlNet maps appending at the end will be dropped.
    const numImages = appState.ultimateUpscale.enabled ? 1 :
      appState.commonPayload.batch_size * appState.commonPayload.n_iter;
    const imageURLs = result.images.slice(0, numImages)
      .map((image: string) => `data:image/png;base64,${image}`);

    const info = JSON.parse(result.info) as IGenerationInfo;

    resultImages.push(
      ..._.zip(
        imageURLs, info.all_prompts, info.all_negative_prompts,
        info.all_seeds, info.all_subseeds,
      ).map(([url, prompt, negative_prompt, seed, subseed]) => {
        return { url, prompt, negative_prompt, seed, subseed } as IGeneratedImage
      })
    );
    generationState.value = GenerationState.kFinishedState;
  } catch (e) {
    console.error(e);
    $notify(`${e}`);
  }
}

// Reset intermediant values stores in the payload and in the generation view.
function resetPayload() {
  inputImageBuffer.value = undefined;
  inputMaskBuffer.value = undefined;
  inputImage.value = undefined;
  inputMask.value = undefined;

  resultImageBound.value = undefined;
  resultImageMaskBlur.value = undefined;

  for (const unit of appState.controlnetUnits) {
    // Only clear image when layer is linked.
    if (unit.linkedLayerName)
      unit.image = undefined;
  }
  appState.commonPayload.height = DEFAULT_CONFIG.commonPayload.height;
  appState.commonPayload.width = DEFAULT_CONFIG.commonPayload.width;
  delete appState.commonPayload.alwayson_scripts['ControlNet'];

  appState.commonPayload.script_name = null;
  appState.commonPayload.script_args = [];
  appState.imageResultDestination = ImageResultDestination.kCurrentCanvas;
}

// Reset generation state to kInitial. Abandon current intermediant values.
function resetGenerationState() {
  resetPayload();
  generationConfig.value = null;
  generationState.value = GenerationState.kInitialState;
}

async function generate() {
  if (generationState.value < GenerationState.kPayloadPreparedState) {
    const success = await preparePayload();
    if (!success) {
      return;
    }
  }
  await sendPayload();
  // Remove hightlight as progress layer display will unfocus the current layer.
  // Leaving incorrect text display.
  removeGenerationStepHighlight();
}

// Run generation with specified config.
async function generateWithConfig(configName: string) {
  generationConfig.value = configName;
  await _generateWithStateDiff(_getConfigStateDiff(configName));
}

function _getConfigStateDiff(configName: string | null): StateDiff {
  return configName ? configStore.configEntries[configName] : [];
}

async function _generateWithStateDiff(stateDiff: StateDiff) {
  const originalState = _.cloneDeep(appState);
  applyStateDiff(appState, stateDiff);
  const undoDiff = appStateToStateDiff(/* toState */ originalState, /* fromState */ appState);
  await generate();
  applyStateDiff(appState, undoDiff);
}

async function generateMore() {
  await _generateWithStateDiff(_getConfigStateDiff(generationConfig.value));
}

async function generateMoreVariants(image: IGeneratedImage) {
  const varState = new ApplicationState();
  varState.commonPayload.seed = image.seed;
  varState.commonPayload.seed_enable_extras = true;
  varState.commonPayload.subseed = -1;
  varState.commonPayload.subseed_strength = appState.subseedStrength;
  const stateDiff = appStateToStateDiff(varState);

  await _generateWithStateDiff(_getConfigStateDiff(generationConfig.value).concat(stateDiff));
}

function onResultImagePicked() {
  resultImages.length = 0;
  resetGenerationState();
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
    <a-button shape="circle" class="floating-button" type="primary" @click="appStateStore.resetToDefault" size="large"
      :title="$t('gen.resetToDefault')">
      <template #icon>
        <ReloadOutlined></ReloadOutlined>
      </template>
    </a-button>

    <GenerationProgress v-model:active="generationActive"></GenerationProgress>

    <a-space direction="vertical" class="root">
      <SDModelSelection :models="context.sdModels" :activeModelName="context.options.sd_model_checkpoint"
        @change="(value: string) => context.options.sd_model_checkpoint = value">
      </SDModelSelection>

      <a-space>
        <PayloadRadio :value="appState.generationMode" @update:value="mode => appState.generationMode = mode"
          :enum-type="GenerationMode">
        </PayloadRadio>
      </a-space>

      <a-form :model="appState.commonPayload" class="payload" :labelWrap="true" layout="vertical" size="small">
        <a-form-item>
          <PromptInput v-model:payload="appState.commonPayload"></PromptInput>
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-progress :class="{ 'generation-step': true, 'blink': hoveredStep !== undefined }"
              :percent="stepProgress * 33.33" :steps="3" :showInfo="false" />
            <a-tag class="next-step-tag">
              {{ $t(`gen.steps.${hoveredStep === undefined ? '' : 'To'}${GenerationState[stepProgress]}`) }}
            </a-tag>
          </a-space>
          <a-button type="danger" :ghost="true" size="small"
            v-if="generationState > GenerationState.kInitialState && generationState < GenerationState.kFinishedState"
            @click="resetGenerationState">
            <CloseOutlined></CloseOutlined>
          </a-button>
          <a-row>
            <a-col :span="12">
              <a-spin :spinning="selectRefAreaInProgress">
                <a-button class="ref-area-button"
                  :disabled="generationState >= GenerationState.kSelectRefAreaState || appState.generationMode === GenerationMode.Txt2Img"
                  @click="selectRefArea" @mouseover="highlightGenerationStep(GenerationState.kSelectRefAreaState)"
                  @mouseout="removeGenerationStepHighlight">{{
                    $t('gen.selectRefArea') }}</a-button>
              </a-spin>
            </a-col>
            <a-col :span="12">
              <a-spin :spinning="preparePayloadInProgress">
                <a-button class="prepare-button" :disabled="generationState >= GenerationState.kPayloadPreparedState"
                  @click="preparePayload" @mouseover="highlightGenerationStep(GenerationState.kPayloadPreparedState)"
                  @mouseout="removeGenerationStepHighlight">{{
                    $t('gen.prepare')
                  }}</a-button>
              </a-spin>
            </a-col>
          </a-row>
          <a-button class="generate" type="primary" @click="generate"
            :disabled="generationState >= GenerationState.kFinishedState"
            @mouseover="highlightGenerationStep(GenerationState.kFinishedState)"
            @mouseout="removeGenerationStepHighlight">{{ $t('generate') }}</a-button>

          <a-space size="small" style="flex-wrap: wrap; margin-top: 5px;">
            <a-button v-for="configName in configStore.toolboxConfigNames" @click="generateWithConfig(configName)"
              type="dashed" :disabled="generationState >= GenerationState.kPayloadPreparedState">{{ configName
              }}</a-button>
          </a-space>
        </a-form-item>
        <GenerationResultPicker :images="resultImages" :bound="resultImageBound" :maskBlur="resultImageMaskBlur"
          :result-destination="appState.imageResultDestination" @result-finalized="onResultImagePicked"
          @generate-more="generateMore" @generate-more-variants="generateMoreVariants">
        </GenerationResultPicker>
        <a-form-item>
          <SliderGroup :label="$t('gen.scaleRatio')" v-model:value="appState.imageScale" :min="1" :max="16"
            :log-scale="true">
          </SliderGroup>
        </a-form-item>
        <a-form-item v-if="appState.generationMode === GenerationMode.Img2Img">
          <div v-if="appState.referenceRangeMode === ReferenceRangeMode.kPixel"
            style="display:flex; align-items: center; width: 100%">
            <a-button @click="appState.referenceRangeMode = ReferenceRangeMode.kPercent">px</a-button>
            <SliderGroup :label="$t('gen.referenceRange')" v-model:value="appState.referenceRange[0]" :min="0" :max="256">
            </SliderGroup>
          </div>
          <div v-else style="display:flex; align-items: center; width:100%">
            <a-button @click="appState.referenceRangeMode = ReferenceRangeMode.kPixel">%</a-button>
            <SliderGroup :label="$t('gen.referenceRange')" v-model:value="appState.referenceRange[1]" :min="0" :max="100">
            </SliderGroup>
          </div>
        </a-form-item>
        <a-form-item>
          <SliderGroup :label="$t('gen.batchCount')" v-model:value="appState.commonPayload.n_iter" :min="1" :max="64"
            :log-scale="true">
          </SliderGroup>
        </a-form-item>
        <a-form-item>
          <SliderGroup :label="$t('gen.cfg')" v-model:value="appState.commonPayload.cfg_scale" :min="1" :max="30"
            :step="0.5">
          </SliderGroup>
        </a-form-item>
        <a-form-item>
          <SliderGroup :label="$t('gen.samplingSteps')" v-model:value="appState.commonPayload.steps" :min="1" :max="150"
            :step="1">
          </SliderGroup>
        </a-form-item>
        <SliderGroup v-if="appState.generationMode === GenerationMode.Img2Img" :label="$t('gen.denoisingStrength')"
          v-model:value="appState.img2imgPayload.denoising_strength" :min="0" :max="1" :step="0.05"></SliderGroup>
        <a-space v-if="appState.generationMode === GenerationMode.Img2Img">
          <div v-if="inputImage">
            <a-tag>{{ $t('inputImage') }}</a-tag>
            <a-image :src="inputImage.dataURL"></a-image>
          </div>
          <div v-if="inputMask">
            <a-tag>{{ $t('inputMask') }}</a-tag>
            <a-image :src="inputMask.dataURL"></a-image>
          </div>
        </a-space>
      </a-form>

      <div>
        <a-collapse :bordered="false">
          <a-collapse-panel :header="$t('gen.advancedSettings')">
            <a-space direction="vertical">
              <VaeSelection></VaeSelection>
              <a-row style="display: flex; align-items: center;">
                <a-tag style="border: none; flex: 0 0 auto;">{{ $t('gen.sampler') }}</a-tag>
                <a-select style="flex: 1 1 auto;" ref="select" v-model:value="appState.commonPayload.sampler_name"
                  :options="samplerOptions"></a-select>
              </a-row>
              <SliderGroup :label="$t('gen.batchSize')" v-model:value="appState.commonPayload.batch_size" :min="1"
                :max="8" :log-scale="true">
              </SliderGroup>
              <a-input-number :addonBefore="$t('width')" addonAfter="px" v-model:value="appState.commonPayload.width"
                :min="64" :max="2048" />
              <a-input-number :addonBefore="$t('height')" addonAfter="px" v-model:value="appState.commonPayload.height"
                :min="64" :max="2048" />

              <div :hidden="appState.generationMode !== GenerationMode.Img2Img">
                <Img2ImgPayloadDisplay :payload="appState.img2imgPayload">
                </Img2ImgPayloadDisplay>
              </div>
              <div :hidden="appState.generationMode !== GenerationMode.Txt2Img">
                <Txt2ImgPayloadDisplay :payload="appState.txt2imgPayload">
                </Txt2ImgPayloadDisplay>
              </div>
            </a-space>
          </a-collapse-panel>
        </a-collapse>
        <ControlNet :units="appState.controlnetUnits"></ControlNet>
        <UltimateUpscale v-if="ultimateUpscaleAvailable && appState.generationMode == GenerationMode.Img2Img"
          :script="appState.ultimateUpscale"></UltimateUpscale>
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
  width: 100%;
  text-overflow: ellipsis;
  overflow: hidden;
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

.floating-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;
  /* optional: to ensure button remains on top */
}
</style>