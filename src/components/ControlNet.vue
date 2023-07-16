<script lang="ts">
import { ResizeMode } from '@/Automatic1111';
import { ControlMode, ControlNetUnit, type IControlNetUnit } from '@/ControlNet';
import PayloadRadio from '@/components/PayloadRadio.vue';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import { PlusOutlined, CloseOutlined, CheckOutlined, StopOutlined } from '@ant-design/icons-vue';
import { computed } from 'vue';

export default {
    name: 'ControlNet',
    props: {
        units: {
            type: Array<IControlNetUnit>,
            required: true,
        },
    },
    components: {
        PayloadRadio,
        PlusOutlined,
        CloseOutlined,
        CheckOutlined,
        StopOutlined,
    },
    setup(props) {
        function addNewUnit() {
            const context = useA1111ContextStore().controlnetContext;
            if (props.units.length < context.setting.control_net_max_models_num) {
                props.units.push(new ControlNetUnit());
            } else {
                // TODO: make this a notification.
                console.error(`Max number of ControlNet unit reached!`);
            }
        }

        function removeUnit(index: number) {
            props.units.splice(index, 1);
        }

        return {
            addNewUnit,
            removeUnit,
            ControlMode,
            ResizeMode,
        };
    },
};
</script>

<template>
    <!-- Controlnet extension panel -->
    <a-collapse :bordered="false">
        <a-collapse-panel key="controlnet">
            <template #header>
                <a-space>
                    <span>ControlNet</span>
                    <a-button @click.stop="addNewUnit" type="primary" size="small">
                        <PlusOutlined></PlusOutlined>
                    </a-button>
                </a-space>
            </template>
            <a-collapse :bordered="false">
                <a-collapse-panel v-for="(unit, index) in $props.units" :key="index">
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
                        <PayloadRadio v-model:value="unit.control_mode" :enum-type="ControlMode"></PayloadRadio>
                        <PayloadRadio v-model:value="unit.resize_mode" :enum-type="ResizeMode"></PayloadRadio>
                        <div>
                            <a-tag>{{ $t('cnet.guidanceRange') }}</a-tag>
                            <a-slider :value="[unit.guidance_start, unit.guidance_end]" range :min="0" :max="1" :step="0.05"
                                @change="(values: [number, number]) => {
                                    [unit.guidance_start, unit.guidance_end] = values;
                                }" />
                        </div>
                    </a-space>
                </a-collapse-panel>
            </a-collapse>
        </a-collapse-panel>
    </a-collapse>
</template>
