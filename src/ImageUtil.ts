import { fabric } from 'fabric';
import type { PhotopeaBound } from './Photopea';

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

    // Create a new fabric canvas
    const canvas = new fabric.StaticCanvas(null, {
        width: imageObj.width!,
        height: imageObj.height!,
    });

    // Add the image to the canvas
    canvas.add(imageObj);

    // Apply 'multiply' blend mode to the mask
    maskObj.globalCompositeOperation = 'multiply';

    // Add the mask to the canvas
    canvas.add(maskObj);

    // Create clipping rectangle
    const clippingRect = new fabric.Rect({
        left: boundingBox[0].b,
        top: boundingBox[1].b,
        width: boundingBox[2].b - boundingBox[0].b,
        height: boundingBox[3].b - boundingBox[1].b,
        absolutePositioned: true // This option will make sure the rect stays at its absolute position.
    });

    // Set clipping path
    canvas.clipPath = clippingRect;
    // Render the canvas
    canvas.renderAll();

    const base64Image = canvas.toDataURL({
        format: 'png',   // Specify the format of the image
        quality: 1,      // Specify the quality of the image (0 to 1)
        left: 0,         // Specify the left position of the crop area
        top: 0,          // Specify the top position of the crop area
        width: canvas.getWidth(),    // Specify the width of the crop area
        height: canvas.getHeight(),   // Specify the height of the crop area
    });
    return base64Image;
}

async function applyMask(imageBuffer: ArrayBuffer, maskBuffer: ArrayBuffer, boundingBox: PhotopeaBound): Promise<string> {
    const [imageObj, maskObj] = await Promise.all([loadImage(imageBuffer), loadImage(maskBuffer)]);
    return applyMaskInternal(imageObj, maskObj, boundingBox);
}

export {
    applyMask
}