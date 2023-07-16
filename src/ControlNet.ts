import { ResizeMode } from '@/Automatic1111';

enum ControlMode {
    Balanced,
    Prompt,
    ControlNet,
};

enum InputMode {
    Simple,
    Batch,
};

interface ControlNetImage {
    image: string;
    mask: string | undefined;
};

interface IControlNetUnit {
    batch_images: string;
    control_mode: ControlMode;
    enabled: boolean;
    guidance_end: number;
    guidance_start: number;
    image: ControlNetImage | undefined;
    input_mode: InputMode;
    low_vram: boolean;
    model: string;
    module: string;
    output_dir: string;
    pixel_perfect: boolean;
    processor_res: number;
    resize_mode: ResizeMode;
    threshold_a: number;
    threshold_b: number;
    weight: number;
}

class ControlNetUnit implements IControlNetUnit {
    batch_images: string = '';
    control_mode: ControlMode = ControlMode.Balanced;
    enabled: boolean = false;
    guidance_end: number = 1.0;
    guidance_start: number = 0.0;
    image: ControlNetImage | undefined = undefined;
    input_mode: InputMode = InputMode.Simple;
    low_vram: boolean = false;
    model: string = '';
    module: string = '';
    output_dir: string = '';
    pixel_perfect: boolean = false;
    processor_res: number = 512;
    resize_mode: ResizeMode = ResizeMode.InnerFit;
    threshold_a: number = 64;
    threshold_b: number = 64;
    weight: number = 1.0;

    // The linked photopea/photoshop layer name under ControlNet folder.
    linkedLayerName: string = '';
}

async function fetchJSON(url: string): Promise<any> {
    const response = await fetch(url);
    return await response.json();
}

interface ControlNetSetting {
    control_net_max_models_num: number;
};

interface ModuleSlider {
    name: string;
    value: number;
    min: number;
    max: number;
    step: number;
};

interface ModuleDetail {
    model_free: boolean;
    sliders: Array<ModuleSlider | null>;
};

class ControlNetContext {
    models: string[] = [];
    modules: string[] = []; // Preprocessors
    module_details: Record<string, ModuleDetail> = {};
    version: number = 0; // API version, not the actual ControlNet extension version.
    setting: ControlNetSetting = { control_net_max_models_num: 1 };
    detectURL: string = '';

    initialized: boolean = false;

    public async initialize(baseURL: string): Promise<boolean> {
        const controlNetURL = `${baseURL}/controlnet`;
        this.detectURL = `${controlNetURL}/detect`;

        const fetchPromises = [
            fetchJSON(`${controlNetURL}/model_list`),
            fetchJSON(`${controlNetURL}/module_list`),
            fetchJSON(`${controlNetURL}/version`),
            fetchJSON(`${controlNetURL}/settings`),
        ];

        try {
            const [
                models,
                modules,
                version,
                setting,
            ] = await Promise.all(fetchPromises);

            this.models = models['model_list'] as string[];
            this.modules = modules['module_list'] as string[];
            this.module_details = modules['module_detail'] as Record<string, ModuleDetail>;
            this.version = version['version'] as number;
            this.setting = setting as ControlNetSetting;

            this.initialized = true;
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }
};

export {
    type IControlNetUnit,
    type ModuleDetail,
    ControlNetUnit,
    ControlMode,
    ControlNetContext,
};
