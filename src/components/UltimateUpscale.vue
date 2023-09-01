<script lang="ts">
import { computed } from 'vue';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import SliderGroup from './SliderGroup.vue';
import { UltimateUpscaleScript, SeamFixType, RedrawMode } from '@/UltimateUpscale';
import { CheckOutlined, StopOutlined } from '@ant-design/icons-vue';
import PayloadRadio from './PayloadRadio.vue';

export default {
    name: 'UltimateUpscale',
    props: {
        script: {
            type: UltimateUpscaleScript,
            required: true,
        },
    },
    components: {
        SliderGroup,
        PayloadRadio,
        CheckOutlined,
        StopOutlined,
    },
    emits: ['update:prompt', 'append:prompt'],
    setup(props, { emit }) {
        const context = useA1111ContextStore().a1111Context;
        const upscalers = computed(() => {
            return context.upscalers.map(u => u.name);
        });

        function toggleScriptEnabled() {
            // TODO: inform GenerationView about enable change if we are adding
            // more supported script later.
            props.script.enabled = !props.script.enabled;
        }

        return {
            upscalers,
            SeamFixType,
            RedrawMode,
            toggleScriptEnabled,
        };
    },
};
</script>

<template>
    <a-collapse :bordered="false">
        <a-collapse-panel>
            <template #header>
                <a-space>
                    <a-button type="dashed" :danger="!$props.script.enabled" size="small" @click.stop="toggleScriptEnabled">
                        <CheckOutlined v-if="$props.script.enabled"></CheckOutlined>
                        <StopOutlined v-else></StopOutlined>
                    </a-button>
                    <span>Ultimate Upscale</span>
                </a-space>
            </template>
            <a-space direction="vertical">
                <SliderGroup :label="$t('gen.scaleRatio')" v-model:value="$props.script.custom_scale" :min="1" :max="16"
                    :log-scale="true"></SliderGroup>

                <a-row>
                    <a-tag class="label">{{ $t('upscale.upscaler') }}:</a-tag>
                    <a-radio-group v-model:value="$props.script.upscaler_index" size="small">
                        <a-radio-button v-for="(upscaler, i) in upscalers" :key="i" :value="i">
                            {{ upscaler }}
                        </a-radio-button>
                    </a-radio-group>
                </a-row>

                <PayloadRadio v-model:value="$props.script.redraw_mode" :enum-type="RedrawMode"
                    :label="$t('upscale.redrawMode')">
                </PayloadRadio>
                <SliderGroup :label="$t('upscale.tileWidth')" v-model:value="$props.script.tile_width" :min="0" :max="2048"
                    :log-scale="true"></SliderGroup>
                <SliderGroup :label="$t('upscale.tileHeight')" v-model:value="$props.script.tile_height" :min="0"
                    :max="2048" :log-scale="true"></SliderGroup>
                <SliderGroup :label="$t('upscale.maskBlur')" v-model:value="$props.script.mask_blur" :min="0" :max="64"
                    :log-scale="true"></SliderGroup>
                <SliderGroup :label="$t('upscale.padding')" v-model:value="$props.script.padding" :min="0" :max="128"
                    :log-scale="true"></SliderGroup>

                <PayloadRadio v-model:value="$props.script.seams_fix_type" :enum-type="SeamFixType"
                    :label="$t('upscale.seamFixType')">
                </PayloadRadio>
                <SliderGroup v-if="$props.script.seams_fix_type !== SeamFixType.kNone"
                    :label="$t('upscale.seamfix.denoise')" v-model:value="$props.script.seams_fix_denoise" :min="0" :max="1"
                    :step="0.05"></SliderGroup>
                <SliderGroup v-if="$props.script.seams_fix_type !== SeamFixType.kNone" :label="$t('upscale.seamfix.width')"
                    v-model:value="$props.script.seams_fix_width" :min="0" :max="128" :log-scale="true"></SliderGroup>
                <SliderGroup v-if="$props.script.seams_fix_type !== SeamFixType.kNone"
                    :label="$t('upscale.seamfix.padding')" v-model:value="$props.script.seams_fix_padding" :min="0"
                    :max="128" :log-scale="true"></SliderGroup>
                <SliderGroup v-if="$props.script.seams_fix_type !== SeamFixType.kNone"
                    :label="$t('upscale.seamfix.mask_blur')" v-model:value="$props.script.seams_fix_mask_blur" :min="0"
                    :max="64" :log-scale="true"></SliderGroup>
            </a-space>
        </a-collapse-panel>
    </a-collapse>
</template>

<style scoped>
.label {
    border: none;
}
</style>

