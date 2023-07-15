<script lang="ts">
import { computed, } from 'vue';
import { CommonPayload } from '../Automatic1111';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import ExtraNetworks from './ExtraNetworks.vue';

export default {
    name: 'PromptInput',
    props: {
        payload: {
            type: CommonPayload,
            required: true,
        },
    },
    components: {
        ExtraNetworks
    },
    emits: ['update:promptValue'],
    setup(props, { emit }) {
        const loras = computed(() => useA1111ContextStore().a1111Context.loras);
        const embeddings = computed(() => {
            return Object.entries(useA1111ContextStore().a1111Context.embeddings.loaded);
        });

        function addPrompt(prompt: string) {
            props.payload.prompt += prompt;
        }

        return {
            loras,
            embeddings,
            addPrompt,
        };
    },
};
</script>

<template>
    <a-space direction="vertical" class="input-container">
        <a-textarea v-model:value="payload.prompt" :placeholder="$t('gen.enterPrompt') + '...'"
            :autoSize="{ minRows: 1, maxRows: 6 }" />
        <a-textarea v-model:value="payload.negative_prompt" :placeholder="$t('gen.enterNegativePrompt') + '...'"
            :autoSize="{ minRows: 1, maxRows: 6 }" />

        <ExtraNetworks :loras="loras" :embeddings="embeddings" @add:prompt="addPrompt"></ExtraNetworks>
    </a-space>
</template>

<style scoped>
.input-container {
    width: 100%;
}
</style>
