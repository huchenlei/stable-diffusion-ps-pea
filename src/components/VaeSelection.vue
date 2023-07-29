<script lang="ts">
import { computed, ref } from 'vue';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';

export default {
    name: 'VaeSelection',
    emits: ['change'],
    setup(props, { emit }) {
        const context = useA1111ContextStore().a1111Context;
        const activeVaeName = ref<string>(context.options.sd_vae);
        const loading = ref(false);
        async function onVaeChange(value: string) {
            loading.value = true;
            // Update checkpoint.
            const response = await fetch(`${context.apiURL}/options`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sd_vae: value
                })
            });

            console.debug('VAE updated: ' + JSON.stringify(await response.json()));
            emit('change', value);
            activeVaeName.value = value;
            loading.value = false;
        }

        const options = computed(() => {
            return context.sdVAEs.map(vae => {
                return {
                    label: vae.model_name,
                    value: vae.model_name,
                };
            });
        });

        return {
            loading,
            activeVaeName,
            options,
            onVaeChange,
        };
    },
};
</script>

<template>
    <a-row style="display: flex; align-items: center;">
        <a-tag style="border: none; flex: 0 0 auto;">{{ $t('gen.vae') }}</a-tag>
        <a-select :value="activeVaeName" style="flex: 1 1 auto;" :loading="loading" :options="options"
            @change="onVaeChange">
        </a-select>
    </a-row>
</template>
