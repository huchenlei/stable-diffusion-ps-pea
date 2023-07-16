<script lang="ts">
import { ResizeMode } from '@/Automatic1111';
import { ControlMode, ControlNetUnit } from '@/ControlNet';
import PayloadRadio from '@/components/PayloadRadio.vue';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import { CloseOutlined, CheckOutlined, StopOutlined } from '@ant-design/icons-vue';
import { computed } from 'vue';

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
    },
    emits: ['remove:unit'],
    setup(props, { emit }) {
        const modelOptions = computed(() => {
            const context = useA1111ContextStore().controlnetContext;
            return context.models.map(modelName => {
                return {
                    label: modelName,
                    value: modelName,
                };
            });
        });

        const moduleOptions = computed(() => {
            const context = useA1111ContextStore().controlnetContext;
            return context.modules.map(moduleName => {
                return {
                    label: moduleName,
                    value: moduleName,
                    detail: context.module_details[moduleName],
                };
            });
        });

        function removeUnit(index: number) {
            emit('remove:unit', index);
        }

        return {
            modelOptions,
            moduleOptions,
            removeUnit,
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
                <a-button type="dashed" :danger="!unit.enabled" size="small"
                    @click.stop="() => unit.enabled = !unit.enabled">
                    <CheckOutlined v-if="unit.enabled"></CheckOutlined>
                    <StopOutlined v-if="!unit.enabled"></StopOutlined>
                </a-button>
                <span>Unit {{ index }}</span>
                <CloseOutlined @click.stop="removeUnit(index)"></CloseOutlined>
            </a-space>
        </template>

        <a-space direction="vertical">
            <a-checkbox v-model:checked="unit.low_vram">{{ $t('cnet.lowvram') }}</a-checkbox>
            <div>
                <a-tag>{{ $t('cnet.module') }}</a-tag>
                <a-select class="module-select" v-model:value="unit.module" :options="moduleOptions"></a-select>
            </div>
            <div>
                <a-tag>{{ $t('cnet.model') }}</a-tag>
                <a-select class="model-select" v-model:value="unit.model" :options="modelOptions"></a-select>
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
.ant-tag {
    border: none !important;
}

.model-select,
.module-select {
    width: 100%;
}
</style>