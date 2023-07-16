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

function hasActiveLayer() {
    const bounds = app.activeDocument.activeLayer.bounds;
    for (let i = 0; i < bounds.length; i++) {
        if (bounds[i] !== 0)
            return true;
    }
    return false;
}

/**
 * Paste the given image to Photopea as a new Image layer.
 * @param base64image base64 string representing an image.
 */
function pasteImageAsNewLayer(base64image) {
    const layerNumBeforePaste = app.activeDocument.layers.length;
    app.open(base64image, null, /* asSmart */ true);
    app.echoToOE(layerNumBeforePaste.toString());
}

// Translate the newly added layer if the new layer has been added.
function translateIfNewLayerAdded(layerCount, leftOffset, topOffset, width, height) {
    if (app.activeDocument.layers.length === layerCount) {
        app.echoToOE("fail");
        return;
    }

    // Deselect first, otherwise we are going to translate the selected area,
    // intead of the whole layer.
    if (hasSelection()) {
        app.activeDocument.selection.deselect();
    }

    const layer = app.activeDocument.activeLayer;
    if (width && height) {
        const bounds = layer.bounds;
        const currentWidth = bounds[2].value - bounds[0].value;
        const currentHeight = bounds[3].value - bounds[1].value;

        layer.resize(
            (width / currentWidth) * 100,
            (height / currentHeight) * 100,
            AnchorPosition.MIDDLECENTER
        );
    }
    layer.translate(
        leftOffset - layer.bounds[0].value,
        topOffset - layer.bounds[1].value
    );
    app.echoToOE("success");
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

function boundsToString(bounds) {
    return JSON.stringify([
        bounds[0].value,
        bounds[1].value,
        bounds[2].value,
        bounds[3].value,
    ]);
}

function getSelectionBound() {
    // Note: app.activeDocument.selection seems always exists. Checking bounds
    // to see if the selection is actually there.
    const bounds = app.activeDocument.selection.bounds;
    if (!hasSelection()) {
        app.echoToOE("");
    } else {
        app.echoToOE(boundsToString(bounds));
    }
}

/**
 * Export current selection to controlnet for preprocessing.
 * If selection does not exist, export current layer instead.
 */
function exportControlNetInputImage(format) {
    if (hasSelection()) {
        exportAllLayers(format);
    } else if (hasActiveLayer()) {
        exportSelectedLayerOnly(format);
    } else {
        alert('No selection / active layer.');
        app.echoToOE('');
    }
}

function getControlNetSelectionBound() {
    if (hasSelection()) {
        app.echoToOE(boundsToString(
            app.activeDocument.selection.bounds
        ));
    } else if (hasActiveLayer()) {
        app.echoToOE(boundsToString(
            app.activeDocument.activeLayer.bounds
        ));
    } else {
        app.echoToOE('');
    }
}

function fillLayerWithBlack(layer) {
    // Save the current active layer
    var originalActiveLayer = app.activeDocument.activeLayer;

    // Save the current foreground color
    var originalForegroundColor = app.foregroundColor;

    // Make the layer passed to the function the active layer
    app.activeDocument.activeLayer = layer;

    // Change the foreground color to black
    app.foregroundColor.rgb.red = 0;
    app.foregroundColor.rgb.green = 0;
    app.foregroundColor.rgb.blue = 0;

    // Select all and fill with the foreground color
    app.activeDocument.selection.selectAll();
    app.activeDocument.selection.fill(app.foregroundColor);
    app.activeDocument.selection.deselect();

    // Restore the original active layer
    app.activeDocument.activeLayer = originalActiveLayer;

    // Restore the original foreground color
    app.foregroundColor = originalForegroundColor;
}

function createControlNetFolderIfNotExist() {
    const document = app.activeDocument;
    for (let i = 0; i < document.layers.length; i++) {
        const currentLayer = document.layers[i];
        if (currentLayer.typename === "LayerSet") {
            if (currentLayer.name === "ControlNet") {
                return currentLayer;
            }
        }
    }

    const newFolder = document.layerSets.add();
    newFolder.name = "ControlNet";

    const backgroundLayer = newFolder.artLayers.add();
    backgroundLayer.name = "Background";
    fillLayerWithBlack(backgroundLayer);
    return newFolder;
}

function controlNetDetectedMapPostProcess(layerName) {
    const layer = app.activeDocument.activeLayer;
    layer.name = layerName;
    const folder = createControlNetFolderIfNotExist();
    layer.move(folder, ElementPlacement.INSIDE);
    layer.opacity = 50;
    layer.blendMode = BlendMode.DIFFERENCE;
    app.echoToOE("success");
}