<script lang="ts">
import { ref } from 'vue';
import { type IStableDiffusionModel } from '../Automatic1111';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';

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
  emits: ['change'],
  setup(props, { emit }) {
    const options = props.models.map(model => {
      return {
        value: model.title,
        label: model.model_name,
      };
    });

    const loading = ref(false);
    async function onModelChange(value: string) {
      const context = useA1111ContextStore().a1111Context;

      loading.value = true;
      // Update checkpoint.
      const response = await fetch(`${context.apiURL}/options`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sd_model_checkpoint: value
        })
      });

      console.debug(await response.json());
      emit('change', value);
      loading.value = false;
    }

    return {
      options,
      loading,
      onModelChange,
    };
  },
};
</script>

<template>
  <a-select ref="select" :value="$props.activeModelName" :options="options" class="select" @change="onModelChange"
    :loading="loading"></a-select>
</template>

<style scoped>
.select {
  min-width: 100px;
}
</style>