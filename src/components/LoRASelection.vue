<script lang="ts">
import { computed } from 'vue';
import { type ILoRA } from '../Automatic1111';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import ImagePicker from './ImagePicker.vue';

interface LoRAItem {
    imageURL: string;
    name: string;
};

export default {
    name: 'SDModelSelection',
    props: {
        models: {
            type: Array<ILoRA>,
            required: true,
        },
        activeLoRAs: {
            type: Array<string>,
            required: true,
        },
    },
    components: {
        ImagePicker,
    },
    emits: ['add:activeLoRAs', 'remove:activeLoRAs'],
    setup(props, { emit }) {
        const images = computed(() => {
            const context = useA1111ContextStore().a1111Context;
            return props.models.map(model => {
                return {
                    imageURL: context.loraPreviewURL(model.name),
                    name: model.name,
                } as LoRAItem;
            });
        });

        function onAddLoRA(item: LoRAItem) {
            emit('add:activeLoRAs', props.models.find(model => model.name === item.name));
        }

        function onRemoveLoRA(loraName: string) {
            emit('remove:activeLoRAs', props.models.find(model => model.name === loraName));
        }

        return {
            onAddLoRA,
            onRemoveLoRA,
            images,
        };
    },
};
</script>

<template>
    <a-select :value="$props.activeLoRAs" mode="multiple" style="width: 100%" :placeholder="$t('gen.addLoRA') + '...'"
        @deselect="onRemoveLoRA">
        <template #dropdownRender="{ menuNode, props }">
            <ImagePicker :images="images" :selected-images="$props.activeLoRAs" @item-clicked="onAddLoRA"></ImagePicker>
        </template>
    </a-select>
</template>
