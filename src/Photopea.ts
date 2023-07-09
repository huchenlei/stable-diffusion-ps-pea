// Posts a message and receives back a promise that will eventually return a 2-element array. One of
// them will be Photopea's "done" message, and the other the actual payload.

const photopeaWindow = window.parent;
const MESSAGE_END_ACK = "done";

function postMessageToPhotopea(message: string) {
    if (window === window.top) {
        throw Error("Not running in Photopea environment!");
    }

    return new Promise(function (resolve) {
        const responseDataPieces: any[] = [];
        function photopeaMessageHandle(event: MessageEvent) {
            if (event.data == MESSAGE_END_ACK) {
                window.removeEventListener("message", photopeaMessageHandle);
                resolve(responseDataPieces.length === 1 ? responseDataPieces[0] : responseDataPieces);
            } else {
                responseDataPieces.push(event.data);
            }
        };

        window.addEventListener("message", photopeaMessageHandle);
        photopeaWindow.postMessage(message, "*");
    });
}

function getPhotopeaScriptString(func: Function, ...args: any[]) {
    return func.toString() + `${func.name}(${args.map(arg => JSON.stringify(arg)).join(',')});`
}

function executeInPhotopea(func: Function, ...args: any[]) {
    const message = getPhotopeaScriptString(func, ...args)
    console.debug(`ps-pea: sending to photopea\n` + message);
    return postMessageToPhotopea(message);
}

interface PhotopeaLayer {
    typename: string;
    visible: boolean;
};

interface PhotopeaDocument {
    typename: string;
    layers: (PhotopeaLayer | PhotopeaDocument)[];
    activeLayer: (PhotopeaLayer | PhotopeaDocument);
    saveToOE: (format: string) => void;
};

interface PhotopeaApp {
    activeDocument: PhotopeaDocument;
    open: (url: string, as: string | null, asSmart: boolean) => void;
};

const app = {} as PhotopeaApp;

// Hides all layers except the current one, outputs the whole image, then restores the previous
// layers state.
// This function is expected to execute in Photopea.
function exportSelectedLayerOnly(format: string) {
    // Gets all layers recursively, including the ones inside folders.
    function getAllArtLayers(document: PhotopeaDocument) {
        const allArtLayers: PhotopeaLayer[] = [];

        for (var i = 0; i < document.layers.length; i++) {
            var currentLayer = document.layers[i];
            if (currentLayer.typename === "ArtLayer") {
                allArtLayers.push(currentLayer as PhotopeaLayer);
            } else {
                allArtLayers.push(...getAllArtLayers(currentLayer as PhotopeaDocument));
            }
        }
        return allArtLayers;
    }

    const allLayers = getAllArtLayers(app.activeDocument);
    // Make all layers except the currently selected one invisible, and store
    // their initial state.
    const layerStates = allLayers.map(layer => layer.visible);
    allLayers.forEach(layer => layer.visible = layer === app.activeDocument.activeLayer);

    app.activeDocument.saveToOE(format);

    layerStates.forEach((visible, i) => {
        allLayers[i].visible = visible;
    });
}

/**
 * This function is expected to execute in Photopea.
 * @param format image format string. e.g. "PNG".
 */
function exportAllLayers(format: string) {
    app.activeDocument.saveToOE(format);
}

/**
 * This function is expected to execute in Photopea.
 * @param base64image base64 string representing an image.
 */
function pasteImageAsNewLayer(base64image: string) {
    app.open(base64image, null, /* asSmart */ true);
}

export {
    executeInPhotopea,
    getPhotopeaScriptString,
    postMessageToPhotopea,
    exportSelectedLayerOnly,
    exportAllLayers,
    pasteImageAsNewLayer,
};