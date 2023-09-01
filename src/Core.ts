import {
    CommonPayload,
    GenerationMode,
    Img2ImgPayload,
    type ICommonPayload,
    type IImg2ImgPayload,
    type ITxt2ImgPayload,
    Txt2ImgPayload,
} from './Automatic1111';
import { type IControlNetUnit } from './ControlNet';
import { UltimateUpscaleScript, type IUltimateUpscaleScript } from './UltimateUpscale';

enum ReferenceRangeMode {
    kPixel,
    kPercent,
};

enum ImageResultDestination {
    kCurrentCanvas,
    kNewCanvas,
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
    // Custom generation mechanism added outside A1111.
    // The scale ratio to upscale generated image.
    imageScale: number;
    // The range around the selection bounding box to reference when doing img2img
    // generation.
    // [Px number, percent number]. Default is 64px and 10 percent.
    referenceRange: [number, number];
    referenceRangeMode: ReferenceRangeMode;

    // Subseed strength. The subseed strength used when clicking `generate with more variants`
    subseedStrength: number;

    // Image result destination.
    imageResultDestination: ImageResultDestination;

    // Extensions
    // ControlNet
    controlnetUnits: IControlNetUnit[];
    // UltimateUpscale
    ultimateUpscale: IUltimateUpscaleScript;
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
    imageScale: number = 1.0;
    referenceRange: [number, number] = [64, 10];
    referenceRangeMode: ReferenceRangeMode = ReferenceRangeMode.kPixel;
    subseedStrength: number = 0.15;
    imageResultDestination: ImageResultDestination = ImageResultDestination.kCurrentCanvas;
    controlnetUnits: IControlNetUnit[] = [];
    ultimateUpscale: IUltimateUpscaleScript = new UltimateUpscaleScript();
};

export {
    type IApplicationState,
    type IHistoryItem,
    ApplicationState,
    ReferenceRangeMode,
    ImageResultDestination,
};