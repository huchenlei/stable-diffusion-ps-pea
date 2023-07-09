<script setup lang="ts">
import { ref, reactive } from 'vue';
import { A1111Context, type ISampler, CommonPayload } from '../Automatic1111';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import { executeInPhotopea, pasteImageAsNewLayer } from '../Photopea';

const payload = reactive(new CommonPayload());
const context: A1111Context = useA1111ContextStore().a1111Context;
const imgSrc = ref('');

function samplerOptions(samplers: ISampler[]) {
  return samplers.map(sampler => {
    return {
      value: sampler.name,
      label: sampler.name,
    };
  });
}

async function generate() {
  const response = await fetch(context.txt2imgURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  imgSrc.value = `data:image/png;base64,${data['images'][0] as string}`;

  try {
    await executeInPhotopea(pasteImageAsNewLayer, data['images'][0]);
  } catch (e) {
    console.error(e);
  }
}
</script>

<template>
  <a-form :model="payload">
    <a-form-item label="Prompt">
      <a-textarea v-model:value="payload.prompt" placeholder="Enter prompt here" :autoSize="{ minRows: 2, maxRows: 6 }" />
    </a-form-item>

    <a-form-item label="Negative Prompt">
      <a-textarea v-model:value="payload.negative_prompt" placeholder="Enter negative prompt here"
        :autoSize="{ minRows: 2, maxRows: 6 }" />
    </a-form-item>

    <a-form-item label="sampler" name="sampler">
      <a-select ref="select" v-model="payload.sampler_name" :options="samplerOptions(context.samplers)"></a-select>
    </a-form-item>

    <a-form-item label="Batch Size" name="batch_size">
      <a-input-number v-model:value="payload.batch_size" />
    </a-form-item>

    <a-form-item label="CFG Scale" name="cfg_scale">
      <a-input-number v-model:value="payload.cfg_scale" />
    </a-form-item>

    <a-form-item label="Height" name="height">
      <a-input-number v-model:value="payload.height" />
    </a-form-item>

    <a-form-item label="Width" name="width">
      <a-input-number v-model:value="payload.width" />
    </a-form-item>

    <a-form-item>
      <a-button type="primary" @click="generate">{{ $t('generate') }}</a-button>
    </a-form-item>

    <a-image v-model:src="imgSrc" />
  </a-form>
</template>