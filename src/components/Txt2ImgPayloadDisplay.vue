<script lang="ts">
import { Txt2ImgPayload } from '@/Automatic1111';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';

export default {
    name: 'Txt2ImgPayloadDisplay',
    props: {
        payload: {
            type: Txt2ImgPayload,
            required: true,
        },
    },
    setup(props) {
        const context = useA1111ContextStore().a1111Context;
        const upscalerOptions = context.upscalers.map(upscaler => {
            return {
                value: upscaler.name,
                label: upscaler.name,
            };
        });
        upscalerOptions.push({
            value: 'Latent',
            label: 'Latent',
        });

        return {
            upscalerOptions,
        };
    },
};
</script>

<template>
    <a-space direction="vertical">
        <a-checkbox v-model:checked="payload.restore_faces">Restore faces</a-checkbox>
        <a-checkbox v-model:checked="payload.tiling">Tiling</a-checkbox>
        <a-checkbox v-model:checked="payload.enable_hr">Hires. fix</a-checkbox>
        <a-space v-if="payload.enable_hr" direction="vertical">
            <a-select ref="select" v-model:value="payload.hr_upscaler" :options="upscalerOptions"></a-select>
            <a-input-number addonBefore="Upscale by" v-model:value="payload.hr_scale" :min="1" :max="4" />
            <a-input-number addonBefore="Denosing strength" v-model:value="payload.denoising_strength" :min="0" :max="1" />
        </a-space>
    </a-space>
</template>
