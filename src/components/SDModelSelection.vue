<script lang="ts">
import { computed, ref } from 'vue';
import { type IStableDiffusionModel } from '../Automatic1111';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import ImagePicker from './ImagePicker.vue';

interface sdModelItem {
  imageURL: string;
  name: string;
};

export default {
  name: 'SDModelSelection',
  props: {
    models: {
      type: Array<IStableDiffusionModel>,
      required: true,
    },
    activeModelName: {
      type: String,
      required: true,
    },
  },
  components: {
    ImagePicker,
  },
  emits: ['change'],
  setup(props, { emit }) {
    const loading = ref(false);
    async function onModelChange(item: sdModelItem) {
      const context = useA1111ContextStore().a1111Context;

      loading.value = true;
      // Update checkpoint.
      const response = await fetch(`${context.apiURL}/options`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sd_model_checkpoint: item.name
        })
      });

      console.debug('Checkpoint updated: ' + JSON.stringify(await response.json()));
      emit('change', item.name);
      loading.value = false;
    }

    const images = computed(() => {
      const context = useA1111ContextStore().a1111Context;
      return props.models.map(model => {
        return {
          imageURL: context.checkpointPreviewURL(model.model_name),
          name: model.model_name,
        } as sdModelItem;
      });
    });

    return {
      loading,
      onModelChange,
      images,
    };
  },
};
</script>

<template>
  <a-select ref="select" :value="$props.activeModelName" class="select" :loading="loading">
    <template #dropdownRender="{ menuNode, props }">
      <ImagePicker :images="images" @item-clicked="onModelChange"></ImagePicker>
    </template>
  </a-select>
</template>
