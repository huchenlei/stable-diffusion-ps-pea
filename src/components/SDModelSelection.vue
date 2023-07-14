<script lang="ts">
import { computed, ref } from 'vue';
import { type IStableDiffusionModel } from '../Automatic1111';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';

interface sdModelItem {
  previewURL: string;
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

    const imageUrls = computed(() => {
      const context = useA1111ContextStore().a1111Context;
      return props.models.map(model => {
        return {
          previewURL: context.checkpointPreviewURL(model.model_name),
          name: model.model_name,
        } as sdModelItem;
      });
    });

    const selectedIndex = ref(0);
    function selectModel(image: string, index: number) {
      console.log(index);
    }

    return {
      options,
      loading,
      onModelChange,

      selectedIndex,
      selectModel,
      imageUrls,

    };
  },
};
</script>

<template>
  <a-select ref="select" :value="$props.activeModelName" :options="options" class="select" @change="onModelChange"
    :loading="loading"></a-select>

  <div class="image-grid">
    <div :class="{ 'card': true, 'selected': index === selectedIndex }" v-for="(item, index) in imageUrls" :key="index">
      <a-image :src="item.previewURL" fallback="image_alt.png" :preview="false" />
      <div class="actions">
        <span class="name">{{ item.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.select {
  min-width: 100px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  grid-gap: 8px;
  overflow: unset;
}

.card {
  overflow: hidden;
  background-size: cover;
  width: 100%;
  height: 0;
  padding-bottom: 100%;
  position: relative;

  border: 1px solid rgb(45, 45, 45);
  border-radius: 3px;
  outline: none;
  transition: box-shadow 200ms cubic-bezier(0.215, 0.61, 0.355, 1) 0s, scale 400ms cubic-bezier(0.215, 0.61, 0.355, 1) 0s;
  margin: 0px;
}

.card:hover {
  border-color: rgb(238, 238, 238);
  border-width: 1px;
  box-shadow: rgb(238, 238, 238) 0px 0px 0px 1px;
}

.card img {
  position: absolute;
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.5em;
  background: rgba(0, 0, 0, 0.5);
  box-shadow: 0 0 0.25em 0.25em rgba(0, 0, 0, 0.5);
  text-shadow: 0 0 0.2em black;
}

.actions * {
  color: white;
}

.actions .name {
  font-weight: bold;
  line-break: anywhere;
  overflow: hidden;
  display: block;
  text-overflow: ellipsis;
  text-shadow: rgba(0, 0, 0, 0.9) 0px 1px 1px;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.8), transparent);
  white-space: nowrap;
}

.card:hover .actions .name {
  overflow: visible;
  text-overflow: unset;
  white-space: normal;
}
</style>