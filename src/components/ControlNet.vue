<script lang="ts">
import { ControlNetUnit } from '@/ControlNet';
import PayloadRadio from '@/components/PayloadRadio.vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import ControlNetUnitComponent from '@/components/ControlNetUnit.vue';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import _ from 'lodash';
import { getCurrentInstance } from 'vue';

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
        const { $notify } = getCurrentInstance()!.appContext.config.globalProperties;

        function addNewUnit() {
            props.units.push(new ControlNetUnit());
        }

        function removeUnit(index: number) {
            props.units.splice(index, 1);
        }

        function enableUnit(unit: ControlNetUnit) {
            if (unit.enabled) {
                return;
            }
            
            const currentEnabledCount = _.sum(props.units.map(unit => unit.enabled ? 1 : 0));
            const maxCount = useA1111ContextStore().controlnetContext.setting.control_net_max_models_num;
            if (currentEnabledCount === maxCount) {
                $notify(`Max number(${maxCount}) of enabled ControlNet unit reached!`);
            } else {
                unit.enabled = true;
            }
        }

        return {
            addNewUnit,
            removeUnit,
            enableUnit,
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
                    @remove:unit="removeUnit" @enable:unit="enableUnit">
                </ControlNetUnitComponent>
            </a-collapse>
        </a-collapse-panel>
    </a-collapse>
</template>
