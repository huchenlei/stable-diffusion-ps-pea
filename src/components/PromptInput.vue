<script lang="ts">
import { reactive, computed, ref } from 'vue';
import { type ILoRA } from '../Automatic1111';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import LoRASelection from './LoRASelection.vue';

export default {
    name: 'PromptInput',
    props: {
        promptValue: {
            type: String,
            required: true,
        },
        // Whether the prompt input should allow selection of LoRAs.
        loraSelection: {
            type: Boolean,
            default: true,
        },
        placeholder: {
            type: String,
            required: true,
        }
    },
    components: {
        LoRASelection
    },
    emits: ['update:promptValue'],
    setup(props, { emit }) {
        // The main body the prompt. proptBody + extra-networks => prompt
        const promptBody = ref('');
        const activeLoRAs: string[] = reactive([]);
        const loras = computed(() => useA1111ContextStore().a1111Context.loras);

        function formatLoRA(lora: string): string {
            return `<lora:${lora}:1>`;
        }

        function updatePrompt() {
            emit('update:promptValue', promptBody.value + activeLoRAs.map(formatLoRA).join(','));
        }

        return {
            addLoRA(item: ILoRA) {
                activeLoRAs.push(item.name);
                updatePrompt();
            },
            removeLoRA(item: ILoRA) {
                const indexToRemove = activeLoRAs.indexOf(item.name);
                activeLoRAs.splice(indexToRemove, 1);
                updatePrompt();
            },
            updatePromptBody(e: InputEvent) {
                updatePrompt();
            },
            activeLoRAs,
            loras,
            promptBody,
        };
    },
};
</script>

<template>
    <a-textarea v-model:value="promptBody" :placeholder="$props.placeholder" :autoSize="{ minRows: 1, maxRows: 6 }"
        @change="updatePromptBody" />

    <LoRASelection v-if="$props.loraSelection" :models="loras" :activeLoRAs="activeLoRAs" @add:activeLoRAs="addLoRA"
        @remove:activeLoRAs="removeLoRA">
    </LoRASelection>
</template>
