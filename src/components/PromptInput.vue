<script lang="ts">
import { computed, ref, } from 'vue';
import { CommonPayload } from '../Automatic1111';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import { DeleteOutlined } from '@ant-design/icons-vue';
import ExtraNetworks from './ExtraNetworks.vue';
import type { Tag } from '@/TagComplete';
import { useTagStore } from '@/stores/tagStore';

export default {
    name: 'PromptInput',
    props: {
        payload: {
            type: CommonPayload,
            required: true,
        },
    },
    components: {
        ExtraNetworks,
        DeleteOutlined,
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

        function clearPrompt() {
            props.payload.prompt = '';
            props.payload.negative_prompt = '';
        }

        const tagStore = useTagStore();
        if (!tagStore.tags.length) {
            tagStore.initStore(); // Non-blocking
        }

        const autoCompleteOptions = ref<{ value: string, tag: Tag }[]>([]);
        const autoCompleteInputElement = ref<any>(null);
        let timeout: number | null = null;
        function handleSearch(value: string) {
            if (!value || !autoCompleteInputElement.value) return;

            // Clear the previous timer if it exists
            if (timeout) clearTimeout(timeout);

            // Start a new timer
            timeout = setTimeout(() => {
                const inputElement = (autoCompleteInputElement.value.resizableTextArea.textArea as HTMLTextAreaElement);
                const cursorPosition = inputElement.selectionStart;
                const inputValue = inputElement.value;
                const words = inputValue.slice(0, cursorPosition).split(/[\s,\)\]\}]+/);
                const wordBeforeCursor = words[words.length - 1];

                const matchingTags = tagStore.tagCompleteManager.completeTag(wordBeforeCursor);
                autoCompleteOptions.value = matchingTags.map(([name, tag]) => {
                    return { value: name, tag };
                });
            }, 200) as any as number;
        }

        return {
            loras,
            embeddings,
            addPrompt,
            clearPrompt,
            autoCompleteOptions,
            handleSearch,
            autoCompleteInputElement,
            tagStore,
        };
    },
};
</script>

<template>
    <a-space direction="vertical" class="input-container">
        <a-spin :spinning="tagStore.loading">
            <a-auto-complete v-model:value="payload.prompt" :options="autoCompleteOptions" @search="handleSearch">
                <a-textarea ref="autoCompleteInputElement" :placeholder="$t('gen.enterPrompt') + '...'"
                    :autoSize="{ minRows: 1, maxRows: 6 }" />
            </a-auto-complete>
        </a-spin>
        <a-textarea v-model:value="payload.negative_prompt" :placeholder="$t('gen.enterNegativePrompt') + '...'"
            :autoSize="{ minRows: 1, maxRows: 6 }" />

        <a-space>
            <ExtraNetworks :loras="loras" :embeddings="embeddings" @add:prompt="addPrompt"></ExtraNetworks>
            <a-button @click="clearPrompt" :danger="true" type="primary" :title="$t('gen.clearPrompt')">
                <DeleteOutlined></DeleteOutlined>
            </a-button>
        </a-space>
    </a-space>
</template>

<style scoped>
.input-container {
    width: 100%;
}
</style>
