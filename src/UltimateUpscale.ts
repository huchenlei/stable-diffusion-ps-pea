enum RedrawMode {
    Linear = 0,
    Chess = 1,
    None = 2,
};

enum SeamFixType {
    None = 0,
    BandPass = 1,
    HalfTile = 2,
    HalfTilePlusIntersections = 3,
};

enum TargetSizeType {
    FromImg2ImgSettings,
    CustomSize,
    ScaleFromImageSize,
};

interface IUltimateUpscaleScript {
    enabled: boolean;
    info: string;
    tile_width: number;
    tile_height: number;
    mask_blur: number;
    padding: number;
    seams_fix_width: number;
    seams_fix_denoise: number;
    seams_fix_padding: number;
    upscaler_index: number;
    save_upscaled_image: boolean;
    redraw_mode: RedrawMode;
    save_seams_fix_image: boolean;
    seams_fix_mask_blur: number;
    seams_fix_type: SeamFixType;
    target_size_type: TargetSizeType;
    custom_width: number;
    custom_height: number;
    custom_scale: number;
};

class UltimateUpscaleScript implements IUltimateUpscaleScript {
    static readonly script_name: string = "ultimate sd upscale";
    static script_args(self: IUltimateUpscaleScript) {
        return [
            self.info, self.tile_width, self.tile_height, self.mask_blur,
            self.padding, self.seams_fix_width, self.seams_fix_denoise, self.seams_fix_padding,
            self.upscaler_index, self.save_upscaled_image, self.redraw_mode, self.save_seams_fix_image,
            self.seams_fix_mask_blur, self.seams_fix_type, self.target_size_type, self.custom_width,
            self.custom_height, self.custom_scale
        ];
    }

    enabled: boolean = false;

    info: string = "Will upscale the image depending on the selected target size type";
    tile_width: number = 512;
    tile_height: number = 512;
    mask_blur: number = 8;
    padding: number = 32;
    seams_fix_width: number = 64;
    seams_fix_denoise: number = 0.35;
    seams_fix_padding: number = 32;
    upscaler_index: number = 0;
    save_upscaled_image: boolean = true;
    redraw_mode: RedrawMode = RedrawMode.Linear;
    save_seams_fix_image: boolean = false;
    seams_fix_mask_blur: number = 8;
    seams_fix_type: SeamFixType = SeamFixType.None;
    target_size_type: TargetSizeType = TargetSizeType.ScaleFromImageSize;
    custom_width: number = 2048;
    custom_height: number = 2048;
    custom_scale: number = 2;
};

export {
    RedrawMode,
    SeamFixType,
    TargetSizeType,
    type IUltimateUpscaleScript,
    UltimateUpscaleScript,
};