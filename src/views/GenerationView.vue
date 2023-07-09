<script setup lang="ts">
import { A1111Context, type ISampler, CommonPayload } from '../Automatic1111';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';

const props = defineProps({
  payload: {
    type: CommonPayload,
    default: new CommonPayload(),
  },
})

const context: A1111Context = useA1111ContextStore().a1111Context;

function samplerOptions(samplers: ISampler[]) {
  return samplers.map(sampler => {
    return {
      value: sampler.name,
      label: sampler.name,
    };
  });
}

function onSubmit(e: Event) {
  e.preventDefault();
  console.log(props.payload);
}
</script>

<template>
  <a-form :model="props.payload" @submit="onSubmit">
    <a-form-item label="Prompt">
      <a-textarea v-model:value="props.payload.prompt" placeholder="Enter prompt here"
        :autoSize="{ minRows: 2, maxRows: 6 }" />
    </a-form-item>

    <a-form-item label="Negative Prompt">
      <a-textarea v-model:value="props.payload.negative_prompt" placeholder="Enter negative prompt here"
        :autoSize="{ minRows: 2, maxRows: 6 }" />
    </a-form-item>

    <a-form-item label="sampler" name="sampler">
      <a-select ref="select" v-model="props.payload.sampler_name" :options="samplerOptions(context.samplers)"></a-select>
    </a-form-item>

    <a-form-item label="Batch Size" name="batch_size">
      <a-input-number v-model:value="props.payload.batch_size" />
    </a-form-item>

    <a-form-item label="CFG Scale" name="cfg_scale">
      <a-input-number v-model:value="props.payload.cfg_scale" />
    </a-form-item>

    <a-form-item label="Height" name="height">
      <a-input-number v-model:value="props.payload.height" />
    </a-form-item>

    <a-form-item label="Width" name="width">
      <a-input-number v-model:value="props.payload.width" />
    </a-form-item>

    <a-form-item>
      <a-button type="primary" html-type="submit">Submit</a-button>
    </a-form-item>
  </a-form>
</template>