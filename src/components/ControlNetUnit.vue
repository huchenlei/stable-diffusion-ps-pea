<script lang="ts">
import { ResizeMode } from '@/Automatic1111';
import { ControlMode, ControlNetUnit, modelNoPreview, type ModuleDetail } from '@/ControlNet';
import PayloadRadio from '@/components/PayloadRadio.vue';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import { CloseOutlined, CheckOutlined, StopOutlined, CaretRightOutlined, UploadOutlined, LinkOutlined } from '@ant-design/icons-vue';
import { computed, getCurrentInstance, ref, nextTick } from 'vue';
import { photopeaContext, type PhotopeaBound, boundWidth, boundHeight } from '@/Photopea';
import { PayloadImage, cropImage, resizeImage } from '@/ImageUtil';
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
        UploadOutlined,
        LinkOutlined,
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
            const context = useA1111ContextStore().controlnetContext;
            const controlTypes = context.control_types;
            const typeDetail = controlTypes[controlType];
            props.unit.module = typeDetail.default_option;
            props.unit.model = typeDetail.default_model;
            modulesAllowed.value = typeDetail.module_list;
            modelsAllowed.value = typeDetail.model_list;

            onModuleChange(props.unit.module, {
                label: props.unit.module,
                value: props.unit.module,
                detail: context.module_details[props.unit.module],
            });
        }
        nextTick(() => {
            // Restore existing module/model if they are already set before
            // control type selection.
            const module = props.unit.module;
            const model = props.unit.model;

            controlType.value = 'All';
            onControlTypeChange(controlType.value);

            if (model) props.unit.model = model;
            if (module) props.unit.module = module;
        });

        const moduleDetail = ref({
            model_free: false,
            sliders: [],
        } as ModuleDetail);

        const attrNames = ['processor_res', 'threshold_a', 'threshold_b'];
        const sliders = [1, 2].map(index => computed(() => {
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

        async function generateHash(value: string): Promise<string> {
            const msgUint8 = new TextEncoder().encode(value); // encode as (utf-8) Uint8Array
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8); // hash the message    
            const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
            return hashHex;
        }

        const preprocessorInProgress = ref<boolean>(false);
        /**
         * Run preprocessor on current selection area or current active layer.
         * This will generate a controlnet layer on Photopea canvas.
         * 
         * When hitting generate button, the corresponding area of the controlnet
         * layer will be cropped out and send to A1111 as payload.
         */
        async function runPreprocessor() {
            preprocessorInProgress.value = true;
            try {
                const context = useA1111ContextStore().controlnetContext;
                const [imageBuffer, bounds] = await photopeaContext.executeTask(async () => {
                    const imageBuffer = await photopeaContext.invoke('exportControlNetInputImage', 'PNG') as ArrayBuffer;
                    const bounds = JSON.parse(await photopeaContext.invoke('getActiveBound')) as PhotopeaBound;
                    return [imageBuffer, bounds];
                });
                const image = await cropImage(imageBuffer, bounds);

                preprocessorInput.value = image;
                const processorResolution = Math.min(image.width, image.height);

                const response = await fetch(context.detectURL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        controlnet_module: props.unit.module,
                        controlnet_input_images: [image.dataURL],
                        controlnet_processor_res: processorResolution,
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
                    await photopeaContext.pasteImageOnPhotopea(
                        await resizeImage(detectedMap, boundWidth(bounds), boundHeight(bounds)),
                        bounds
                    );
                });
                await linkActiveLayer();
            } catch (e) {
                console.error(e);
                $notify(`ControlNet: ${e}`);
            } finally {
                preprocessorInProgress.value = false;
            }
        }

        const isReferenceModel = computed(() => {
            return props.unit.module.toLowerCase().includes('reference');
        });

        function beforeUploadImage(file: Blob) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const url = e.target!.result! as string;
                props.unit.image = {
                    image: url,
                    mask: null,
                };
                // Auto-enable after upload.
                emit("enable:unit", props.unit);
            };
            reader.readAsDataURL(file);
            // Return false to prevent the default upload behavior
            return false;
        }

        function linkActiveLayer() {
            if (!props.unit.enabled)
                props.unit.enabled = true;

            return photopeaContext.executeTask(async () => {
                const timestamp = new Date().getTime().toString();
                const hash = await generateHash(timestamp + props.unit.module);
                const previousLayerName = props.unit.linkedLayerName;
                props.unit.linkedLayerName = `CN:${props.unit.module}:${hash}`;
                await photopeaContext.invoke('controlNetDetectedMapPostProcess', props.unit.linkedLayerName, previousLayerName);
            });
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
            preprocessorInProgress,
            runPreprocessor,
            isReferenceModel,
            beforeUploadImage,
            linkActiveLayer,
            ControlMode,
            ResizeMode,
        };
    },
};
</script>

<template>
    <a-collapse-panel :key="index">
        <template #header>
            <a-row class="header-content">
                <a-space>
                    <a-button type="dashed" :danger="!unit.enabled" size="small" @click.stop="toggleUnitEnabled"
                        :title="$t(unit.enabled ? 'cnet.unitEnabled' : 'cnet.unitDisabled')">
                        <CheckOutlined v-if="unit.enabled"></CheckOutlined>
                        <StopOutlined v-if="!unit.enabled"></StopOutlined>
                    </a-button>
                    <span class="layer-name">{{ unitTitle }}</span>
                </a-space>
                <CloseOutlined @click.stop="removeUnit(index)"></CloseOutlined>
            </a-row>
        </template>

        <a-space direction="vertical" class="cnet-form">
            <a-space>
                <div v-if="preprocessorInput">
                    <a-tag>{{ $t('cnet.preprocessorInput') }}</a-tag>
                    <a-image :src="preprocessorInput.dataURL" :preview=false></a-image>
                </div>
                <a-upload list-type="picture" accept="image/*" :beforeUpload="beforeUploadImage" :max-count="1"
                    :disabled="!isReferenceModel">
                    <!-- Disable item rendering -->
                    <template #itemRender="{ file, actions }"></template>
                    <div v-if="unit.image">
                        <a-tag>{{ $t('cnet.preprocessorResult') }}</a-tag>
                        <a-image :src="unit.image.image" :preview="false"></a-image>
                    </div>
                    <div v-if="!unit.image && isReferenceModel">
                        <a-button>
                            <UploadOutlined></UploadOutlined>
                            {{ $t('cnet.uploadImage') }}
                        </a-button>
                    </div>
                </a-upload>
            </a-space>

            <a-space>
                <a-button @click="runPreprocessor" size="small" :disabled="!previewRunnable"
                    :loading="preprocessorInProgress">
                    <CaretRightOutlined></CaretRightOutlined>
                </a-button>
                <a-button @click="linkActiveLayer" size="small" :title="$t('cnet.linkActiveLayer')">
                    <LinkOutlined></LinkOutlined>
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
            <PayloadRadio :label="$t('cnet.controlMode')" v-model:value="unit.control_mode" :enum-type="ControlMode">
            </PayloadRadio>
            <PayloadRadio :label="$t('gen.resizeMode')" v-model:value="unit.resize_mode" :enum-type="ResizeMode">
            </PayloadRadio>
        </a-space>
    </a-collapse-panel>
</template>

<style scoped>
.cnet-form {
    width: 100%;
}

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

.ant-collapse-header .header-content {
    flex: 1 1 auto;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
</style>