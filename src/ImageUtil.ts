import { fabric } from 'fabric';
import type { PhotopeaBound } from './Photopea';

/**
 * Image that contains all the necessary information pieces needed by A1111 API.
 */
class PayloadImage {
    top: number;
    left: number;
    width: number;
    height: number;
    // base64 Data URL.
    dataURL: string;
    // Whether all pixels on the image is the same color.
    // If isSolidColor, we should probably use txt2img instead of img2img.
    isSolidColor: boolean;

    constructor(top: number, left: number, width: number, height: number, dataURL: string, isSolidColor: boolean) {
        this.top = top;
        this.left = left;
        this.width = width;
        this.height = height;
        this.dataURL = dataURL;
        this.isSolidColor = isSolidColor;
    }
}

async function loadImage(buffer: ArrayBuffer): Promise<fabric.Image> {
    return new Promise((resolve, reject) => {
        const dataUrl = URL.createObjectURL(new Blob([buffer]));
        fabric.Image.fromURL(dataUrl, (img) => {
            if (img) {
                resolve(img);
            } else {
                reject(new Error('Could not load image from buffer'));
            }
        });
    });
}

function applyMaskInternal(imageObj: fabric.Image, maskObj: fabric.Image, boundingBox: PhotopeaBound): string {
    if (imageObj.width !== maskObj.width || imageObj.height !== maskObj.height) {
        throw new Error('Image and mask have different dimensions!');
    }

    // Create clipping rectangle
    const clippingRect = new fabric.Rect({
        left: boundingBox[0].b,
        top: boundingBox[1].b,
        width: boundingBox[2].b - boundingBox[0].b,
        height: boundingBox[3].b - boundingBox[1].b,
        absolutePositioned: true // This option will make sure the rect stays at its absolute position.
    });

    [imageObj, maskObj].forEach(obj => {
        obj.set({
            left: -clippingRect.left!,
            top: -clippingRect.top!,
        });
    });

    // Create a new fabric canvas
    const canvas = new fabric.StaticCanvas(null, {
        width: clippingRect.width,
        height: clippingRect.height,
    });

    // Add the image to the canvas
    canvas.add(imageObj);

    // Apply 'multiply' blend mode to the mask
    maskObj.globalCompositeOperation = 'multiply';

    // Add the mask to the canvas
    canvas.add(maskObj);

    // Render the canvas
    canvas.renderAll();

    const base64Image = canvas.toDataURL({
        format: 'png',   // Specify the format of the image
        quality: 1,      // Specify the quality of the image (0 to 1)
    });
    return base64Image;
}

async function applyMask(imageBuffer: ArrayBuffer, maskBuffer: ArrayBuffer, boundingBox: PhotopeaBound): Promise<string> {
    const [imageObj, maskObj] = await Promise.all([loadImage(imageBuffer), loadImage(maskBuffer)]);
    return applyMaskInternal(imageObj, maskObj, boundingBox);
}

async function cropImage(imageBuffer: ArrayBuffer, boundingBox: PhotopeaBound): Promise<PayloadImage> {
    // Create clipping rectangle
    const clippingRect = {
        left: boundingBox[0].b,
        top: boundingBox[1].b,
        width: boundingBox[2].b - boundingBox[0].b,
        height: boundingBox[3].b - boundingBox[1].b,
    };

    // Create a new fabric canvas
    const canvas = new fabric.StaticCanvas(null, {
        width: clippingRect.width,
        height: clippingRect.height,
    });

    const imageObj = await loadImage(imageBuffer);
    imageObj.set({
        left: -clippingRect.left,
        top: -clippingRect.top,
    });
    // Add the image to the canvas
    canvas.add(imageObj);

    // Render the canvas
    canvas.renderAll();

    const dataURL = canvas.toDataURL({
        format: 'png',   // Specify the format of the image
        quality: 1,      // Specify the quality of the image (0 to 1)
    });
    return new PayloadImage(
        clippingRect.top,
        clippingRect.left,
        clippingRect.width,
        clippingRect.height,
        dataURL,
        isSolidColor(canvas),
    );
}

function isSolidColor(canvas: fabric.StaticCanvas): boolean {
    // Get the context of the canvas
    const ctx = canvas.getContext();

    // Get the image data from the canvas
    const imageData = ctx.getImageData(0, 0, canvas.getWidth(), canvas.getHeight());

    // Get the color of the first pixel
    const firstPixelColor = imageData.data.slice(0, 4);

    // Check each pixel
    for (let i = 0; i < imageData.data.length; i += 4) {
        const pixelColor = imageData.data.slice(i, i + 4);
        if (!areColorsEqual(firstPixelColor, pixelColor)) {
            return false;
        }
    }

    // If we've gotten through the loop without returning, all pixels are the same color
    return true;
}

function areColorsEqual(color1: Uint8ClampedArray, color2: Uint8ClampedArray): boolean {
    for (let i = 0; i < 4; i++) {
        if (color1[i] !== color2[i]) {
            return false;
        }
    }
    return true;
}

export {
    applyMask,
    cropImage,
}