<script lang="ts">
import { ControlNetUnit } from '@/ControlNet';
import PayloadRadio from '@/components/PayloadRadio.vue';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import { PlusOutlined } from '@ant-design/icons-vue';
import ControlNetUnitComponent from '@/components/ControlNetUnit.vue';

export default {
    name: 'ControlNet',
    props: {
        units: {
            type: Array<ControlNetUnit>,
            required: true,
        },
    },
    components: {
        PayloadRadio,
        PlusOutlined,
        ControlNetUnitComponent,
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
                <ControlNetUnitComponent v-for="(unit, index) in $props.units" :unit="unit" :index="index"
                    @remove:unit="removeUnit">
                </ControlNetUnitComponent>
            </a-collapse>
        </a-collapse-panel>
    </a-collapse>
</template>
