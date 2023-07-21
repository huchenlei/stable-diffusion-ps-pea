import { ResizeMode } from '@/Automatic1111';
import _ from 'lodash';

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
    mask: string | null;
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

interface ControlType {
    module_list: string[];
    model_list: string[];
    default_option: string;
    default_model: string;
}

class ControlNetContext {
    models: string[] = [];
    modules: string[] = []; // Preprocessors
    module_details: Record<string, ModuleDetail> = {};
    version: number = 0; // API version, not the actual ControlNet extension version.
    setting: ControlNetSetting = { control_net_max_models_num: 1 };
    control_types: Record<string, ControlType> = {};
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
            fetchJSON(`${controlNetURL}/control_types`),
        ];

        try {
            const [
                models,
                modules,
                version,
                setting,
                control_types,
            ] = await Promise.all(fetchPromises);

            this.models = models['model_list'] as string[];
            this.modules = modules['module_list'] as string[];
            this.module_details = modules['module_detail'] as Record<string, ModuleDetail>;
            this.version = version['version'] as number;
            this.setting = setting as ControlNetSetting;
            this.control_types = control_types['control_types'] as Record<string, ControlType>;

            this.control_types = _.mapValues(this.control_types, (controlType) => {
                function convertAlias(module: string) {
                    return INVERT_PREPROCESSOR_ALIAS[module] || module;
                }
                return {
                    model_list: controlType.model_list,
                    default_model: controlType.default_model,
                    module_list: controlType.module_list.map(convertAlias),
                    default_option: convertAlias(controlType.default_option),
                } as ControlType;
            });

            this.validateModules();
            this.validateControlTypes();
            this.initialized = true;
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    private validateModules() {
        // Remove modules that don't have corresponding module detail.
        this.modules = this.modules.filter(module => {
            if (!this.module_details[module]) {
                console.warn(`${module} not found in module details`);
                return false;
            } else {
                return true;
            }
        });
    }

    private validateControlTypes() {
        const filteredControlTypes: Record<string, ControlType> = {};
        for (const [name, controlType] of Object.entries(this.control_types)) {
            if (!this.module_details[controlType.default_option]) {
                console.warn(`${controlType.default_option} not recognized.`);
                continue;
            }

            if (_.some(controlType.module_list.map(module => !this.module_details[module]))) {
                console.warn(`${controlType.module_list} not recognized.`);
                continue;
            }
            filteredControlTypes[name] = controlType;
        }
        this.control_types = filteredControlTypes;
    }

    private mapModuleAlias() {

    }
};

// ControlNet Models that preprocessor cannot be run separately.
const NO_PREVIEW_MODELS: string[] = [
    'tile', // Tile by default should take the input from img2img input image.
    'inpaint', // Inpaint by default should take the input and mask from img2img settings.
    'ip2p', // IP2P does not have any preprocessors.
    'none', // Reference's preprocessor need to run in A1111 generation process to take effect.
];

function modelNoPreview(model: string): boolean {
    return _.some(NO_PREVIEW_MODELS, m => model.toLowerCase().includes(m));
}

// This is copied from ControlNet A1111 Extension repository, and subject to 
// change in the future.
// https://github.com/Mikubill/sd-webui-controlnet/blob/main/scripts/global_state.py
const PREPROCESSOR_ALIAS: Record<string, string> = {
    "invert": "invert (from white bg & black line)",
    "lineart_standard": "lineart_standard (from white bg & black line)",
    "lineart": "lineart_realistic",
    "color": "t2ia_color_grid",
    "clip_vision": "t2ia_style_clipvision",
    "pidinet_sketch": "t2ia_sketch_pidi",
    "depth": "depth_midas",
    "normal_map": "normal_midas",
    "hed": "softedge_hed",
    "hed_safe": "softedge_hedsafe",
    "pidinet": "softedge_pidinet",
    "pidinet_safe": "softedge_pidisafe",
    "segmentation": "seg_ufade20k",
    "oneformer_coco": "seg_ofcoco",
    "oneformer_ade20k": "seg_ofade20k",
    "pidinet_scribble": "scribble_pidinet",
    "inpaint": "inpaint_global_harmonious",
}

const INVERT_PREPROCESSOR_ALIAS = _.invert(PREPROCESSOR_ALIAS);

export {
    type IControlNetUnit,
    type ModuleDetail,
    type ControlType,
    ControlNetUnit,
    ControlMode,
    ControlNetContext,
    modelNoPreview,
};
