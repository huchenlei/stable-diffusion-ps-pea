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

async function fetchJSON(url: string): Promise<any> {
    const response = await fetch(url);
    return await response.json();
}

class A1111Context {
    baseURL: string = '';

    samplers: ISampler[] = [];
    upscalers: IUpscaler[] = [];
    embeddings: IEmbeddings | undefined;
    hypernetworks: IHypernetwork[] = [];
    sdModels: IStableDiffusionModel[] = [];
    sdVAEs: IStableDiffusionVAE[] = [];
    loras: ILoRA[] = [];

    public async initialize(baseURL: string): Promise<boolean> {
        this.baseURL = baseURL;
        const fetchPromises = [
            fetchJSON(`${this.apiURL}/samplers`),
            fetchJSON(`${this.apiURL}/sd-models`),
            fetchJSON(`${this.apiURL}/loras`),
            fetchJSON(`${this.apiURL}/upscalers`),
            fetchJSON(`${this.apiURL}/sd-vae`),
            fetchJSON(`${this.apiURL}/embeddings`),
            fetchJSON(`${this.apiURL}/hypernetworks`)
        ];

        try {
            const [
                samplers,
                sdModels,
                loras,
                upscalers,
                sdVAEs,
                embeddings,
                hypernetworks
            ] = await Promise.all(fetchPromises);

            this.samplers = samplers as ISampler[];
            this.sdModels = sdModels as IStableDiffusionModel[];
            this.loras = loras as ILoRA[];
            this.upscalers = upscalers as IUpscaler[];
            this.sdVAEs = sdVAEs as IStableDiffusionVAE[];
            this.embeddings = embeddings as IEmbeddings;
            this.hypernetworks = hypernetworks as IHypernetwork[];
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

export {
    A1111Context,
    CommonPayload,
    type ISampler,
};
