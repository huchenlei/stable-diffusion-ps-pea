<script setup lang="ts">
import { ref } from 'vue';
import { A1111Context, type ISampler } from '../Automatic1111';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';

interface ICommonPayload {
  // Basic generation params.
  batch_size: number;
  cfg_scale: number;
  height: number;
  width: number;
  n_iter: number;
  steps: number;
  sampler_name: string;
  prompt: string;
  negative_prompt: string;

  // Seed params.
  seed: number;
  seed_enable_extras: boolean;
  seed_resize_from_h: number;
  seed_resize_from_w: number;
  subseed: number;

  // Extra advanced params.
  override_settings: Record<string, unknown>;
  override_settings_restore_afterwards: boolean;
  do_not_save_grid: boolean;
  do_not_save_samples: boolean;
  s_churn: number;
  s_min_uncond: number;
  s_noise: number;
  s_tmax: number | null;
  s_tmin: number;
  script_args: string[];
  script_name: string | null;
  styles: string[];
  subseed_strength: number;
};

interface ITxt2ImgPayload extends ICommonPayload {
  restore_faces: boolean;
  enable_hr: boolean;
  hr_negative_prompt: string;
  hr_prompt: string;
  hr_resize_x: number;
  hr_resize_y: number;
  hr_scale: number;
  hr_second_pass_steps: number;
  hr_upscaler: string;
  tiling: boolean;
};

enum ResizeMode {
  Resize,
  InnerFit,
  OuterFit,
};

enum InpaintFill {
  Fill,
  Original,
  LatentNoise,
  LatentNothing,
};

enum MaskMode {
  InpaintMasked,
  InpaintNotMasked,
};

enum InpaintArea {
  WholePicture,
  OnlyMasked,
};

interface IImg2ImgPayload extends ICommonPayload {
  init_images: string[];
  denoising_strength: number;
  initial_noise_multiplier: number;
  inpaint_full_res: InpaintArea;
  inpaint_full_res_padding: number;
  inpainting_fill: InpaintFill;
  inpainting_mask_invert: MaskMode;
  mask_blur_x: number;
  mask_blur_y: number;
  resize_mode: ResizeMode;
};

class CommonPayload implements ICommonPayload {
  batch_size: number = 1;
  cfg_scale: number = 7;
  height: number = 512;
  width: number = 512;
  n_iter: number = 1;
  steps: number = 20;
  sampler_name: string = '';
  prompt: string = '';
  negative_prompt: string = '';
  seed: number = -1;
  seed_enable_extras: boolean = false;
  seed_resize_from_h: number = 0;
  seed_resize_from_w: number = 0;
  subseed: number = -1;
  subseed_strength: number = 0;
  override_settings: Record<string, unknown> = {};
  override_settings_restore_afterwards: boolean = false;
  do_not_save_grid: boolean = false;
  do_not_save_samples: boolean = false;
  s_churn: number = 0;
  s_min_uncond: number = 0;
  s_noise: number = 1.0;
  s_tmax: number | null = null;
  s_tmin: number = 0.0;
  script_args: string[] = [];
  script_name: string | null = null;
  styles: string[] = [];
};

const payload = ref(new CommonPayload());
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
  console.log(payload);
}
</script>

<template>
  <a-form :model="payload" @submit="onSubmit">
    <a-form-item label="sampler" name="sampler">
      <a-select ref="select" v-model="payload.sampler_name" :options="samplerOptions(context.samplers)"></a-select>
    </a-form-item>

    <a-form-item label="Batch Size" name="batch_size">
      <a-input-number v-model="payload.batch_size" />
    </a-form-item>

    <a-form-item label="CFG Scale" name="cfg_scale">
      <a-input-number v-model="payload.cfg_scale" />
    </a-form-item>

    <a-form-item label="Height" name="height">
      <a-input-number v-model="payload.height" />
    </a-form-item>

    <a-form-item>
      <a-button type="primary" html-type="submit">Submit</a-button>
    </a-form-item>
  </a-form>
</template>