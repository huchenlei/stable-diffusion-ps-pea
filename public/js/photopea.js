// Note: Many ES6+ features are not available in photopea environment. 

// Hides all layers except the current one, outputs the whole image, then restores the previous
// layers state.
function exportSelectedLayerOnly(format) {
    // Gets all layers recursively, including the ones inside folders.
    function getAllArtLayers(document) {
        let allArtLayers = [];

        for (let i = 0; i < document.layers.length; i++) {
            const currentLayer = document.layers[i];
            if (currentLayer.typename === "ArtLayer") {
                allArtLayers.push(currentLayer);
            } else {
                allArtLayers = allArtLayers.concat(getAllArtLayers(currentLayer));
            }
        }
        return allArtLayers;
    }

    const allLayers = getAllArtLayers(app.activeDocument);
    // Make all layers except the currently selected one invisible, and store
    // their initial state.
    const layerStates = [];
    for (let i = 0; i < allLayers.length; i++) {
        const layer = allLayers[i];

        layerStates.push(layer.visible);
        // Don't use `===` here as the compare is for the value of the layer,
        // not address.
        layer.visible = layer == app.activeDocument.activeLayer;
    }

    app.activeDocument.saveToOE(format);

    for (let i = 0; i < allLayers.length; i++) {
        const layer = allLayers[i];
        layer.visible = layerStates[i];
    }
}

/**
 * Export all layers merged together as a image file.
 * @param format image format string. e.g. "PNG".
 */
function exportAllLayers(format) {
    app.activeDocument.saveToOE(format);
}

function hasSelection() {
    return !!app.activeDocument.selection.bounds;
}

/**
 * Paste the given image to Photopea as a new Image layer.
 * @param base64image base64 string representing an image.
 */
function pasteImageAsNewLayer(base64image, leftOffset, topOffset) {
    // Deselect first, otherwise we are going to translate the selected area,
    // intead of the whole layer.
    if (hasSelection()) {
        app.activeDocument.selection.deselect();
    }

    app.open(base64image, null, /* asSmart */ true);
    const layer = app.activeDocument.activeLayer;
    layer.translate(
        leftOffset - layer.bounds[0].b,
        topOffset - layer.bounds[1].b
    );
}

// Creates a black and white mask based on the current selection in the active document.
function exportMaskFromSelection(format) {
    // Note: app.activeDocument.selection seems always exists. Checking bounds
    // to see if the selection is actually there.
    if (!hasSelection()) {
        alert("No selection!");
        app.echoToOE("");
        return;
    }

    // Create a temp layer.
    const newLayer = app.activeDocument.artLayers.add();
    newLayer.name = "TempMaskLayer";

    // Fill the inverse of the selection with black.
    app.activeDocument.selection.invert();
    color = new SolidColor();
    color.rgb.red = 0;
    color.rgb.green = 0;
    color.rgb.blue = 0;
    app.activeDocument.selection.fill(color);

    // Fill the selected part with white.n
    color.rgb.red = 255;
    color.rgb.green = 255;
    color.rgb.blue = 255;
    app.activeDocument.selection.invert();
    app.activeDocument.selection.fill(color);

    // Export the mask.
    exportSelectedLayerOnly(format);

    // Remove the temp layer.
    app.activeDocument.activeLayer.remove();
}

function getSelectionBound() {
    // Note: app.activeDocument.selection seems always exists. Checking bounds
    // to see if the selection is actually there.
    const bounds = app.activeDocument.selection.bounds;
    if (!hasSelection()) {
        app.echoToOE("");
    } else {
        app.echoToOE(JSON.stringify(bounds));
    }
}
