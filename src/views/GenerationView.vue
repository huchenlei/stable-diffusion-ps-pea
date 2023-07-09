<script setup lang="ts">
import { ref, reactive } from 'vue';
import { A1111Context, type ISampler, CommonPayload } from '../Automatic1111';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import { photopeaContext } from '../Photopea';

/*
MIT LICENSE
Copyright 2011 Jon Leighton
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute, 
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software. 

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
// From: https://gist.github.com/jonleighton/958841
function base64ArrayBuffer(arrayBuffer: ArrayBuffer) {
  var base64 = ''
  var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

  var bytes = new Uint8Array(arrayBuffer)
  var byteLength = bytes.byteLength
  var byteRemainder = byteLength % 3
  var mainLength = byteLength - byteRemainder

  var a, b, c, d
  var chunk

  // Main loop deals with bytes in chunks of 3
  for (var i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048) >> 12 // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032) >> 6 // 4032     = (2^6 - 1) << 6
    d = chunk & 63               // 63       = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength]

    a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3) << 4 // 3   = 2^2 - 1

    base64 += encodings[a] + encodings[b] + '=='
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

    a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008) >> 4 // 1008  = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15) << 2 // 15    = 2^4 - 1

    base64 += encodings[a] + encodings[b] + encodings[c] + '='
  }

  return base64
}

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
    await photopeaContext.invoke('pasteImageAsNewLayer', imgSrc.value);
  } catch (e) {
    console.error(e);
  }
}

async function captureMask() {
  const arrayBuffer = await photopeaContext.invoke('exportMaskFromSelection', /* format= */'PNG') as ArrayBuffer;
  imgSrc.value = `data:image/png;base64,${base64ArrayBuffer(arrayBuffer)}`;
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

    <a-form-item>
      <a-button type="primary" @click="captureMask">capture mask</a-button>
    </a-form-item>

    <a-image v-model:src="imgSrc" />
  </a-form>
</template>