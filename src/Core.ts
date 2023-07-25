import {
    CommonPayload,
    GenerationMode,
    Img2ImgPayload,
    type ICommonPayload,
    type IImg2ImgPayload,
    type ITxt2ImgPayload,
    Txt2ImgPayload,
} from './Automatic1111';
import { ControlNetUnit, type IControlNetUnit } from './ControlNet';

enum ReferenceRangeMode {
    kPixel,
    kPercent,
};

/**
 * The application state that can be saved and load to UI later.
 */
interface IApplicationState {
    // Payloads.
    commonPayload: ICommonPayload;
    img2imgPayload: IImg2ImgPayload;
    txt2imgPayload: ITxt2ImgPayload;
    generationMode: GenerationMode;
    autoGenerationMode: boolean;
    // Custom generation mechanism added outside A1111.
    // The scale ratio to upscale generated image.
    imageScale: number;
    // The range around the selection bounding box to reference when doing img2img
    // generation.
    // [Px number, percent number]. Default is 64px and 10 percent.
    referenceRange: [number, number];
    referenceRangeMode: ReferenceRangeMode;

    // Extensions
    // ControlNet
    controlnetUnits: IControlNetUnit[];
};

interface IHistoryItem {
    appState: IApplicationState;
    timestamp: number;
};

class ApplicationState implements IApplicationState {
    commonPayload: ICommonPayload = new CommonPayload();
    img2imgPayload: IImg2ImgPayload = new Img2ImgPayload();
    txt2imgPayload: ITxt2ImgPayload = new Txt2ImgPayload();
    generationMode: GenerationMode = GenerationMode.Img2Img;
    autoGenerationMode: boolean = true;
    imageScale: number = 1.0;
    referenceRange: [number, number] = [64, 10];
    referenceRangeMode: ReferenceRangeMode = ReferenceRangeMode.kPixel;
    controlnetUnits: IControlNetUnit[] = [];
};

export {
    type IApplicationState,
    type IHistoryItem,
    ApplicationState,
    ReferenceRangeMode,
};