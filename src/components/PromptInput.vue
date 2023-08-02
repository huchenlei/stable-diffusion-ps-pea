<script lang="ts">
import { computed, nextTick, ref, } from 'vue';
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
    setup(props, { emit, }) {
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
            if (!value || !autoCompleteInputElement.value) {
                autoCompleteOptions.value = [];
                return;
            }

            // Clear the previous timer if it exists
            if (timeout) clearTimeout(timeout);

            // Start a new timer
            timeout = setTimeout(() => {
                const inputElement = (autoCompleteInputElement.value.resizableTextArea.textArea as HTMLTextAreaElement);
                const cursorPosition = inputElement.selectionStart;
                const inputValue = inputElement.value;
                const words = inputValue.slice(0, cursorPosition).split(/[\s,\)\]\}]+/);
                const wordBeforeCursor = words[words.length - 1];
                const tagCandidate = wordBeforeCursor
                    .replace(" ", "_")
                    .replace("\\(", "(")
                    .replace("\\)", ")");

                if (tagCandidate.length === 0) {
                    autoCompleteOptions.value = [];
                    return;
                }

                const matchingTags = tagStore.tagCompleteManager.completeTag(tagCandidate);
                autoCompleteOptions.value = matchingTags.map(([name, tag]) => {
                    return { value: name, tag };
                });
            }, 200) as any as number;
        }

        function handleSelect(value: string, option: { value: string, tag: Tag }) {
            // Insert real tag name instead of alias.
            const tagName = option.tag.name;

            // Get reference to the text area
            const inputElement = autoCompleteInputElement.value.resizableTextArea.textArea as HTMLTextAreaElement;

            // Get current cursor position
            const cursorPosition = inputElement.selectionStart;

            // Get the text before and after the cursor
            const textBeforeCursor = inputElement.value.substring(0, cursorPosition);
            const textAfterCursor = inputElement.value.substring(cursorPosition);

            // Get the position of the last space character before the cursor
            const lastSpacePos = textBeforeCursor.lastIndexOf(' ');

            // Construct new text with the selected value inserted
            const newText = textBeforeCursor.substring(0, lastSpacePos + 1) + tagName + ' ' + textAfterCursor;

            // Update the text in the text area and adjust the cursor position
            props.payload.prompt = newText;

            autoCompleteOptions.value = [];
            nextTick(() => {
                inputElement.selectionStart = inputElement.selectionEnd = lastSpacePos + tagName.length + 2;
            });
        }

        function handleTabPress(e: KeyboardEvent) {
            e.preventDefault();

            // Check if there are any autocomplete options
            if (autoCompleteOptions.value.length > 0) {
                // Select the first option
                const option = autoCompleteOptions.value[0];

                // Handle selection of the first option
                handleSelect(option.value, option);
            }
        }

        function formatNumber(num: number): string {
            if (num >= 1e6) {
                return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
            }
            if (num >= 1e3) {
                return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
            }
            return num.toString();
        }

        return {
            loras,
            embeddings,
            addPrompt,
            clearPrompt,
            autoCompleteOptions,
            handleSearch,
            handleSelect,
            handleTabPress,
            autoCompleteInputElement,
            tagStore,
            formatNumber,
        };
    },
};
</script>

<template>
    <a-space direction="vertical" class="input-container">
        <a-spin :spinning="tagStore.loading">
            <a-auto-complete v-model:value="payload.prompt" :options="autoCompleteOptions" @search="handleSearch"
                @select="handleSelect">
                <template #option="{ value, tag }">
                    <div style="display: flex; justify-content: space-between;">
                        <span>{{ value === tag.name ? value : `${value} → ${tag.name}` }}</span>
                        <span>{{ formatNumber(tag.count) }}</span>
                    </div>
                </template>

                <a-textarea ref="autoCompleteInputElement" :placeholder="$t('gen.enterPrompt') + '...'"
                    @keydown.tab.stop="handleTabPress" :autoSize="{ minRows: 1, maxRows: 6 }" />
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
