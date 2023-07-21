<script lang="ts">
import { ResizeMode } from '@/Automatic1111';
import { ControlMode, ControlNetUnit, modelNoPreview, type ModuleDetail } from '@/ControlNet';
import PayloadRadio from '@/components/PayloadRadio.vue';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import { CloseOutlined, CheckOutlined, StopOutlined, CaretRightOutlined } from '@ant-design/icons-vue';
import { computed, getCurrentInstance, ref, nextTick } from 'vue';
import { photopeaContext, type PhotopeaBound } from '@/Photopea';
import { PayloadImage, cropImage } from '@/ImageUtil';
import { useI18n } from 'vue-i18n';

interface ModuleOption {
    label: string;
    value: string;
    detail: ModuleDetail,
};

type SliderAttr = 'processor_res' | 'threshold_a' | 'threshold_b';

interface ControlNetError {
    detail: string;
    error: string;
}

export default {
    name: 'ControlNetUnit',
    props: {
        unit: {
            type: ControlNetUnit,
            required: true,
        },
        index: {
            type: Number,
            required: true,
        },
    },
    components: {
        PayloadRadio,
        CloseOutlined,
        CheckOutlined,
        StopOutlined,
        CaretRightOutlined,
    },
    emits: ['remove:unit', 'enable:unit'],
    setup(props, { emit }) {
        const { $notify } = getCurrentInstance()!.appContext.config.globalProperties;
        const { t } = useI18n();
        const preprocessorInput = ref<PayloadImage | undefined>(undefined);
        const controlType = ref<string>('');
        const controlTypes = computed(() => {
            return Object.keys(useA1111ContextStore().controlnetContext.control_types).map(k => {
                return { value: k, label: k };
            });
        });
        const modulesAllowed = ref<string[]>([]);
        const modelsAllowed = ref<string[]>([]);
        function onControlTypeChange(controlType: string) {
            const controlTypes = useA1111ContextStore().controlnetContext.control_types;
            const typeDetail = controlTypes[controlType];
            props.unit.module = typeDetail.default_option;
            props.unit.model = typeDetail.default_model;
            modulesAllowed.value = typeDetail.module_list;
            modelsAllowed.value = typeDetail.model_list;
        }
        nextTick(() => {
            controlType.value = 'All';
            onControlTypeChange(controlType.value);
        });

        const moduleDetail = ref({
            model_free: false,
            sliders: [],
        } as ModuleDetail);

        const attrNames = ['processor_res', 'threshold_a', 'threshold_b'];
        const sliders = [0, 1, 2].map(index => computed(() => {
            if (moduleDetail.value.sliders.length < index + 1 || moduleDetail.value.sliders[index] === null) {
                return null;
            }
            return {
                attrName: attrNames[index],
                ...moduleDetail.value.sliders[index]!,
            };
        }));

        const modelOptions = computed(() => {
            const context = useA1111ContextStore().controlnetContext;
            return context.models
                .filter(modelName => modelsAllowed.value.includes(modelName))
                .map(modelName => {
                    return {
                        label: modelName,
                        value: modelName,
                    };
                });
        });

        const moduleOptions = computed(() => {
            const context = useA1111ContextStore().controlnetContext;
            return context.modules
                .filter(moduleName => modulesAllowed.value.includes(moduleName))
                .map(moduleName => {
                    return {
                        label: moduleName,
                        value: moduleName,
                        detail: context.module_details[moduleName],
                    };
                });
        });

        const previewRunnable = computed(() => {
            return !modelNoPreview(props.unit.model);
        });

        const unitTitle = computed(() => {
            if (previewRunnable.value)
                return props.unit.linkedLayerName || t('cnet.unlinked');
            else
                return `CN:${props.unit.module}`;
        });

        function removeUnit(index: number) {
            emit('remove:unit', index);
        }

        function toggleUnitEnabled() {
            if (props.unit.enabled) {
                props.unit.enabled = false;
            } else {
                // Enable unit goes through `ControlNet` component as there is
                // a cap of enabled unit count.
                emit('enable:unit', props.unit);
            }
        }

        function onModuleChange(moduleName: string, option: ModuleOption) {
            moduleDetail.value = option.detail;
            attrNames.forEach((attrName, index) => {
                if (option.detail.sliders.length < index + 1 || option.detail.sliders[index] === null) {
                    return;
                }
                props.unit[attrName as SliderAttr] = option.detail.sliders[index]!.value;
            });
        }

        /**
         * Run preprocessor on current selection area or current active layer.
         * This will generate a controlnet layer on Photopea canvas.
         * 
         * When hitting generate button, the corresponding area of the controlnet
         * layer will be cropped out and send to A1111 as payload.
         */
        async function runPreprocessor() {
            async function generateHash(value: string): Promise<string> {
                const msgUint8 = new TextEncoder().encode(value); // encode as (utf-8) Uint8Array
                const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8); // hash the message    
                const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
                return hashHex;
            }

            try {
                const context = useA1111ContextStore().controlnetContext;
                const timestamp = new Date().getTime().toString();
                const hash = await generateHash(timestamp + props.unit.module);

                const [imageBuffer, bounds] = await photopeaContext.executeTask(async () => {
                    const imageBuffer = await photopeaContext.invoke('exportControlNetInputImage', 'PNG') as ArrayBuffer;
                    const bounds = JSON.parse(await photopeaContext.invoke('getControlNetSelectionBound')) as PhotopeaBound;
                    return [imageBuffer, bounds];
                });
                const image = await cropImage(imageBuffer, bounds);

                preprocessorInput.value = image;

                const response = await fetch(context.detectURL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        controlnet_module: props.unit.module,
                        controlnet_input_images: [image.dataURL],
                        controlnet_processor_res: props.unit.processor_res,
                        controlnet_threshold_a: props.unit.threshold_a,
                        controlnet_threshold_b: props.unit.threshold_b,
                    }),
                });
                const data = await response.json();
                // There can be various reasons why ControlNet rejects the payload.
                if (response.status !== 200)
                    throw (data as ControlNetError).detail;

                const detectedMap = `data:image/png;base64,${data['images'][0]}`;

                await photopeaContext.executeTask(async () => {
                    await photopeaContext.pasteImageOnPhotopea(detectedMap, image.left, image.top, image.width, image.height);
                    const previousLayerName = props.unit.linkedLayerName;
                    props.unit.linkedLayerName = `CN:${props.unit.module}:${hash}`;
                    await photopeaContext.invoke('controlNetDetectedMapPostProcess', props.unit.linkedLayerName, previousLayerName);
                });

                if (!props.unit.enabled)
                    props.unit.enabled = true;
            } catch (e) {
                console.error(e);
                $notify(`ControlNet: ${e}`);
            }
        }

        return {
            preprocessorInput,
            controlType,
            controlTypes,
            onControlTypeChange,
            moduleDetail,
            sliders,
            modelOptions,
            moduleOptions,
            previewRunnable,
            unitTitle,
            removeUnit,
            toggleUnitEnabled,
            onModuleChange,
            runPreprocessor,
            ControlMode,
            ResizeMode,
        };
    },
};
</script>

<template>
    <a-collapse-panel :key="index">
        <template #header>
            <a-space>
                <a-button type="dashed" :danger="!unit.enabled" size="small" @click.stop="toggleUnitEnabled"
                    :title="$t(unit.enabled ? 'cnet.unitEnabled' : 'cnet.unitDisabled')">
                    <CheckOutlined v-if="unit.enabled"></CheckOutlined>
                    <StopOutlined v-if="!unit.enabled"></StopOutlined>
                </a-button>
                <span class="layer-name">{{ unitTitle }}</span>
                <CloseOutlined @click.stop="removeUnit(index)"></CloseOutlined>
            </a-space>
        </template>

        <a-space direction="vertical" class="cnet-form">
            <a-space>
                <div v-if="preprocessorInput">
                    <a-tag>Preprocessor Input</a-tag>
                    <a-image :src="preprocessorInput.dataURL"></a-image>
                </div>
                <div v-if="unit.image">
                    <a-tag>Preprocessor Result</a-tag>
                    <a-image :src="unit.image.image"></a-image>
                </div>
            </a-space>

            <a-space>
                <a-button @click="runPreprocessor" size="small" :disabled="!previewRunnable">
                    <CaretRightOutlined></CaretRightOutlined>
                </a-button>
                <a-checkbox v-model:checked="unit.low_vram">{{ $t('cnet.lowvram') }}</a-checkbox>
            </a-space>
            <a-select v-model:value="controlType" @change="onControlTypeChange" :options="controlTypes"
                class="control-type-select"></a-select>
            <div>
                <a-tag>{{ $t('cnet.module') }}</a-tag>
                <a-select class="module-select" v-model:value="unit.module" :options="moduleOptions"
                    @change="onModuleChange"></a-select>
            </div>
            <div :hidden="moduleDetail.model_free">
                <a-tag>{{ $t('cnet.model') }}</a-tag>
                <a-select class="model-select" v-model:value="unit.model" :options="modelOptions"></a-select>
            </div>
            <div v-for="slider in sliders">
                <div v-if="slider.value !== null">
                    <a-tag>{{ slider.value.name }}</a-tag>
                    <a-slider v-model:value="unit[slider.value.attrName as SliderAttr]" :min="slider.value.min"
                        :max="slider.value.max" :step="slider.value.step" />
                </div>
            </div>
            <div>
                <a-tag>{{ $t('weight') }}</a-tag>
                <a-slider v-model:value="unit.weight" :min="0" :max="2" :step="0.05" />
            </div>
            <div>
                <a-tag>{{ $t('cnet.guidanceRange') }}</a-tag>
                <a-slider :value="[unit.guidance_start, unit.guidance_end]" range :min="0" :max="1" :step="0.05" @change="(values: [number, number]) => {
                    [unit.guidance_start, unit.guidance_end] = values;
                }" />
            </div>
            <PayloadRadio v-model:value="unit.control_mode" :enum-type="ControlMode"></PayloadRadio>
            <PayloadRadio v-model:value="unit.resize_mode" :enum-type="ResizeMode"></PayloadRadio>
        </a-space>
    </a-collapse-panel>
</template>

<style scoped>
.cnet-form .ant-tag {
    border: none !important;
}

.model-select,
.module-select,
.control-type-select {
    width: 100%;
}

.ant-space-item {
    display: flex;
}

.layer-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
    width: 20ch;
}
</style>