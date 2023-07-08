<script setup lang="ts">
import { ref, provide } from 'vue';

interface ISampler {
  name: string;
  aliases: string[];
  options: Record<string, any>;
};

interface IStableDiffusionModel {
  filename: string;
  hash: string;
  model_name: string;
  sha256: string;
  title: string;
};

interface ILoRA {
  alias: string;
  metadata: Record<string, any>;
  name: string;
  path: string;
};

interface IUpscaler {
  name: string;
  model_name: string | null;
  model_path: string | null;
  model_url: string | null;
  scale: number;
};

interface IStableDiffusionVAE {
  filename: string;
  model_name: string;
};

interface IEmbedding {
  sd_checkpoint: string;
  sd_checkpoint_name: string;
  shape: number;
  step: number;
  vector: number;
};

interface IEmbeddings {
  loaded: Record<string, IEmbedding>;
  skipped: Record<string, IEmbedding>;
}

interface IHypernetwork {
  name: string;
  path: string;
};

function defaultErrorHandler(e: any) {
  console.error(e);
}

async function safeFetchJSON(url: string, errorHandler: (e: any) => void = defaultErrorHandler): Promise<any> {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (e) {
    errorHandler(e);
  }
}

class A1111Context {
  baseURL: string | undefined;
  samplers: ISampler[] = [];
  upscalers: IUpscaler[] = [];
  embeddings: IEmbeddings | undefined;
  hypernetworks: IHypernetwork[] = [];
  sdModels: IStableDiffusionModel[] = [];
  sdVAEs: IStableDiffusionVAE[] = [];
  loras: ILoRA[] = [];

  public async initialize(baseURL: string) {
    this.baseURL = baseURL;
    this.samplers = await safeFetchJSON(`${baseURL}/samplers`) as ISampler[];
    this.sdModels = await safeFetchJSON(`${baseURL}/sd-models`) as IStableDiffusionModel[];
    this.loras = await safeFetchJSON(`${baseURL}/loras`) as ILoRA[];
    this.upscalers = await safeFetchJSON(`${baseURL}/upscalers`) as IUpscaler[];
    this.sdVAEs = await safeFetchJSON(`${baseURL}/sd-vae`) as IStableDiffusionVAE[];
    this.embeddings = await safeFetchJSON(`${baseURL}/embeddings`) as IEmbeddings;
    this.hypernetworks = await safeFetchJSON(`${baseURL}/hypernetworks`) as IHypernetwork[];
  }
};

const a1111URL = ref("http://localhost:7860");
const context = new A1111Context();

const getRemoteConfig = async () => {
  await context.initialize(`${a1111URL.value}/sdapi/v1`);
};

</script>

<template>
  <div>
    <a-input addonBefore="A1111 URL:" :value="a1111URL" @input="(value: string) => a1111URL = value">
    </a-input>
    <a-button @click="getRemoteConfig">Connect</a-button>
  </div>
</template>
