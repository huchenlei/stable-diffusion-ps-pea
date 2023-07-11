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

interface IOptions {
    samples_save: boolean;
    samples_format: string;
    samples_filename_pattern: string;
    save_images_add_number: boolean;
    grid_save: boolean;
    grid_format: string;
    grid_extended_filename: boolean;
    grid_only_if_multiple: boolean;
    grid_prevent_empty_spots: boolean;
    grid_zip_filename_pattern: string;
    n_rows: number;
    enable_pnginfo: boolean;
    save_txt: boolean;
    save_images_before_face_restoration: boolean;
    save_images_before_highres_fix: boolean;
    save_images_before_color_correction: boolean;
    save_mask: boolean;
    save_mask_composite: boolean;
    jpeg_quality: number;
    webp_lossless: boolean;
    export_for_4chan: boolean;
    img_downscale_threshold: number;
    target_side_length: number;
    img_max_size_mp: number;
    use_original_name_batch: boolean;
    use_upscaler_name_as_suffix: boolean;
    save_selected_only: boolean;
    save_init_img: boolean;
    temp_dir: string;
    clean_temp_dir_at_start: boolean;
    outdir_samples: string;
    outdir_txt2img_samples: string;
    outdir_img2img_samples: string;
    outdir_extras_samples: string;
    outdir_grids: string;
    outdir_txt2img_grids: string;
    outdir_img2img_grids: string;
    outdir_save: string;
    outdir_init_images: string;
    save_to_dirs: boolean;
    grid_save_to_dirs: boolean;
    use_save_to_dirs_for_ui: boolean;
    directories_filename_pattern: string;
    directories_max_prompt_words: number;
    ESRGAN_tile: number;
    ESRGAN_tile_overlap: number;
    realesrgan_enabled_models: string[];
    upscaler_for_img2img: any;
    face_restoration_model: string;
    code_former_weight: number;
    face_restoration_unload: boolean;
    show_warnings: boolean;
    memmon_poll_rate: number;
    samples_log_stdout: boolean;
    multiple_tqdm: boolean;
    print_hypernet_extra: boolean;
    list_hidden_files: boolean;
    unload_models_when_training: boolean;
    pin_memory: boolean;
    save_optimizer_state: boolean;
    save_training_settings_to_txt: boolean;
    dataset_filename_word_regex: string;
    dataset_filename_join_string: string;
    training_image_repeats_per_epoch: number;
    training_write_csv_every: number;
    training_xattention_optimizations: boolean;
    training_enable_tensorboard: boolean;
    training_tensorboard_save_images: boolean;
    training_tensorboard_flush_every: number;
    sd_model_checkpoint: string;
    sd_checkpoint_cache: number;
    sd_vae_checkpoint_cache: number;
    sd_vae: string;
    sd_vae_as_default: boolean;
    sd_unet: string;
    inpainting_mask_weight: number;
    initial_noise_multiplier: number;
    img2img_color_correction: boolean;
    img2img_fix_steps: boolean;
    img2img_background_color: string;
    enable_quantization: boolean;
    enable_emphasis: boolean;
    enable_batch_seeds: boolean;
    comma_padding_backtrack: number;
    CLIP_stop_at_last_layers: number;
    upcast_attn: boolean;
    randn_source: string;
    cross_attention_optimization: string;
    s_min_uncond: number;
    token_merging_ratio: number;
    token_merging_ratio_img2img: number;
    token_merging_ratio_hr: number;
    pad_cond_uncond: boolean;
    experimental_persistent_cond_cache: boolean;
    use_old_emphasis_implementation: boolean;
    use_old_karras_scheduler_sigmas: boolean;
    no_dpmpp_sde_batch_determinism: boolean;
    use_old_hires_fix_width_height: boolean;
    dont_fix_second_order_samplers_schedule: boolean;
    hires_fix_use_firstpass_conds: boolean;
    interrogate_keep_models_in_memory: boolean;
    interrogate_return_ranks: boolean;
    interrogate_clip_num_beams: number;
    interrogate_clip_min_length: number;
    interrogate_clip_max_length: number;
    interrogate_clip_dict_limit: number;
    interrogate_clip_skip_categories: any[];
    interrogate_deepbooru_score_threshold: number;
    deepbooru_sort_alpha: boolean;
    deepbooru_use_spaces: boolean;
    deepbooru_escape: boolean;
    deepbooru_filter_tags: string;
    extra_networks_show_hidden_directories: boolean;
    extra_networks_hidden_models: string;
    extra_networks_default_view: string;
    extra_networks_default_multiplier: number;
    extra_networks_card_width: number;
    extra_networks_card_height: number;
    extra_networks_add_text_separator: string;
    ui_extra_networks_tab_reorder: string;
    sd_hypernetwork: string;
    localization: string;
    gradio_theme: string;
    img2img_editor_height: number;
    return_grid: boolean;
    return_mask: boolean;
    return_mask_composite: boolean;
    do_not_show_images: boolean;
    send_seed: boolean;
    send_size: boolean;
    font: string;
    js_modal_lightbox: boolean;
    js_modal_lightbox_initially_zoomed: boolean;
    js_modal_lightbox_gamepad: boolean;
    js_modal_lightbox_gamepad_repeat: number;
    show_progress_in_title: boolean;
    samplers_in_dropdown: boolean;
    dimensions_and_batch_together: boolean;
    keyedit_precision_attention: number;
    keyedit_precision_extra: number;
    keyedit_delimiters: string;
    quicksettings_list: string[];
    ui_tab_order: any[];
    hidden_tabs: any[];
    ui_reorder_list: string[];
    hires_fix_show_sampler: boolean;
    hires_fix_show_prompts: boolean;
    disable_token_counters: boolean;
    add_model_hash_to_info: boolean;
}

async function fetchJSON(url: string): Promise<any> {
    const response = await fetch(url);
    return await response.json();
}

class A1111Context {
    baseURL: string = '';

    samplers: ISampler[] = [];
    upscalers: IUpscaler[] = [];
    embeddings: IEmbeddings = {} as IEmbeddings;
    hypernetworks: IHypernetwork[] = [];
    sdModels: IStableDiffusionModel[] = [];
    sdVAEs: IStableDiffusionVAE[] = [];
    loras: ILoRA[] = [];
    options: IOptions = {} as IOptions;

    public async initialize(baseURL: string): Promise<boolean> {
        this.baseURL = baseURL;
        const fetchPromises = [
            fetchJSON(`${this.apiURL}/samplers`),
            fetchJSON(`${this.apiURL}/sd-models`),
            fetchJSON(`${this.apiURL}/loras`),
            fetchJSON(`${this.apiURL}/upscalers`),
            fetchJSON(`${this.apiURL}/sd-vae`),
            fetchJSON(`${this.apiURL}/embeddings`),
            fetchJSON(`${this.apiURL}/hypernetworks`),
            fetchJSON(`${this.apiURL}/options`),
        ];

        try {
            const [
                samplers,
                sdModels,
                loras,
                upscalers,
                sdVAEs,
                embeddings,
                hypernetworks,
                options,
            ] = await Promise.all(fetchPromises);

            this.samplers = samplers as ISampler[];
            this.sdModels = sdModels as IStableDiffusionModel[];
            this.loras = loras as ILoRA[];
            this.upscalers = upscalers as IUpscaler[];
            this.sdVAEs = sdVAEs as IStableDiffusionVAE[];
            this.embeddings = embeddings as IEmbeddings;
            this.hypernetworks = hypernetworks as IHypernetwork[];
            this.options = options as IOptions;            
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    get apiURL(): string {
        return `${this.baseURL}/sdapi/v1`;
    }

    get txt2imgURL(): string {
        return `${this.apiURL}/txt2img`;
    }

    get img2imgURL(): string {
        return `${this.apiURL}/img2img`;
    }
};

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

// Payload params specific to txt2img.
interface ITxt2ImgPayload {
    restore_faces: boolean;
    enable_hr: boolean;
    hr_negative_prompt: string;
    hr_prompt: string;
    hr_resize_x: number;
    hr_resize_y: number;
    hr_scale: number;
    hr_second_pass_steps: number;
    hr_upscaler: string;
    denoising_strength: number;
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

// Payload params specific to img2img.
interface IImg2ImgPayload {
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

class Img2ImgPayload implements IImg2ImgPayload {
    init_images: string[] = [];
    denoising_strength: number = 0.75;
    initial_noise_multiplier: number = 1.0;
    inpaint_full_res: InpaintArea = InpaintArea.OnlyMasked;
    inpaint_full_res_padding: number = 32;
    inpainting_fill: InpaintFill = InpaintFill.Original;
    inpainting_mask_invert: MaskMode = MaskMode.InpaintMasked;
    mask_blur_x: number = 4;
    mask_blur_y: number = 4;
    resize_mode: ResizeMode = ResizeMode.Resize;
};

class Txt2ImgPayload implements ITxt2ImgPayload {
    restore_faces: boolean = false;
    enable_hr: boolean = false;
    hr_negative_prompt: string = "";
    hr_prompt: string = "";
    hr_resize_x: number = 0;
    hr_resize_y: number = 0;
    hr_scale: number = 2.0;
    hr_second_pass_steps: number = 0;
    hr_upscaler: string = "Latent";
    denoising_strength: number = 0.75;
    tiling: boolean = false;
};

enum GenerationMode {
    Txt2Img,
    Img2Img,
};

export {
    A1111Context,
    CommonPayload,
    Img2ImgPayload,
    Txt2ImgPayload,
    InpaintArea,
    InpaintFill,
    MaskMode,
    ResizeMode,
    GenerationMode,
    type ISampler,
    type IStableDiffusionModel,
};
