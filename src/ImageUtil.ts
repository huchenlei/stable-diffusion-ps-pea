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


    get bound(): PhotopeaBound {
        return [
            this.left, this.top, this.left + this.width, this.top + this.height,
        ];
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
        left: boundingBox[0],
        top: boundingBox[1],
        width: boundingBox[2] - boundingBox[0],
        height: boundingBox[3] - boundingBox[1],
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

function clampBound(bound: PhotopeaBound, canvasBound: PhotopeaBound): PhotopeaBound {
    return [
        bound[0] > canvasBound[0] ? bound[0] : canvasBound[0],
        bound[1] > canvasBound[1] ? bound[1] : canvasBound[1],
        bound[2] < canvasBound[2] ? bound[2] : canvasBound[2],
        bound[3] < canvasBound[3] ? bound[3] : canvasBound[3],
    ];
}

// Note: `boundingBox` might overflow, i.e. There can be negative left/top, and width/height might exceed original
// image's height width.
async function cropImage(imageBuffer: ArrayBuffer, boundingBox: PhotopeaBound): Promise<PayloadImage> {
    const imageObj = await loadImage(imageBuffer);

    const clampedBound = clampBound(boundingBox, [0, 0, imageObj.width!, imageObj.height!]);
    // Create clipping rectangle
    const clippingRect = {
        left: clampedBound[0],
        top: clampedBound[1],
        width: clampedBound[2] - clampedBound[0],
        height: clampedBound[3] - clampedBound[1],
    };

    // Create a new fabric canvas
    const canvas = new fabric.StaticCanvas(null, {
        width: clippingRect.width,
        height: clippingRect.height,
    });

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

/*
MIT LICENSE
Copyright 2011 Jon Leighton
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute, 
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software. 

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
// From: https://gist.github.com/jonleighton/958841
function base64ArrayBuffer(arrayBuffer: ArrayBuffer): string {
    var base64 = ''
    var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

    var bytes = new Uint8Array(arrayBuffer)
    var byteLength = bytes.byteLength
    var byteRemainder = byteLength % 3
    var mainLength = byteLength - byteRemainder

    var a, b, c, d
    var chunk

    // Main loop deals with bytes in chunks of 3
    for (var i = 0; i < mainLength; i = i + 3) {
        // Combine the three bytes into a single integer
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

        // Use bitmasks to extract 6-bit segments from the triplet
        a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
        b = (chunk & 258048) >> 12 // 258048   = (2^6 - 1) << 12
        c = (chunk & 4032) >> 6 // 4032     = (2^6 - 1) << 6
        d = chunk & 63               // 63       = 2^6 - 1

        // Convert the raw binary segments to the appropriate ASCII encoding
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
    }

    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
        chunk = bytes[mainLength]

        a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

        // Set the 4 least significant bits to zero
        b = (chunk & 3) << 4 // 3   = 2^2 - 1

        base64 += encodings[a] + encodings[b] + '=='
    } else if (byteRemainder == 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

        a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
        b = (chunk & 1008) >> 4 // 1008  = (2^6 - 1) << 4

        // Set the 2 least significant bits to zero
        c = (chunk & 15) << 2 // 15    = 2^4 - 1

        base64 += encodings[a] + encodings[b] + encodings[c] + '='
    }

    return base64
}

function getImageDimensions(imageURL: string): Promise<{ width: number; height: number; }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => { // using arrow function to keep 'this' context as 'img'
            resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };
        img.src = imageURL;
    });
}

export {
    PayloadImage,
    applyMask,
    cropImage,
    getImageDimensions,
    base64ArrayBuffer,
}