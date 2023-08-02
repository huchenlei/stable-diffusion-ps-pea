// Note: Many ES6+ features are not available in photopea environment. 

const MAX_NESTING = 10;
function makeLayerVisible(layer) {
    let currentLayer = layer;
    let nest = 0;

    while (currentLayer != app.activeDocument && nest < MAX_NESTING) {
        nest++;
        currentLayer.visible = true;
        if (currentLayer.parent.typename != 'Document') {
            currentLayer = currentLayer.parent;
        } else {
            break;
        }
    }
}

// Hides all layers except the current one, outputs the whole image, then restores the previous
// layers state.
function exportSelectedLayerOnly(format, layerSelector) {
    // Gets all layers recursively, including the ones inside folders.
    function getAllArtLayers(document) {
        let allArtLayers = [];

        for (let i = 0; i < document.layers.length; i++) {
            const currentLayer = document.layers[i];
            allArtLayers.push(currentLayer);
            if (currentLayer.typename === "LayerSet") {
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
        console.debug('sd-debug: Record Layer(' + layer.name + ') visible: ' + layer.visible);
    }
    // Hide all layers to begin with
    for (let i = 0; i < allLayers.length; i++) {
        const layer = allLayers[i];
        layer.visible = false;
    }
    for (let i = 0; i < allLayers.length; i++) {
        const layer = allLayers[i];
        const selected = layerSelector ? layerSelector(layer) : layer.selected;
        if (selected) {
            makeLayerVisible(layer);
            console.debug('sd-pea: capture ' + layer.name);
        }
    }
    app.activeDocument.saveToOE(format);

    for (let i = 0; i < allLayers.length; i++) {
        const layer = allLayers[i];
        layer.visible = layerStates[i];
        console.debug('sd-debug: Set layer(' + layer.name + ') visible: ' + layer.visible);
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
    const doc = app.activeDocument;
    // Select a top level non-folder layer so that the image is not pasted in
    // folder.
    for (let i = 0; i < doc.layers.length; i++) {
        const layer = doc.layers[i];
        if (layer.typename !== "LayerSet") {
            app.activeDocument.activeLayer = layer;
            break;
        }
    }
    const layerNumBeforePaste = doc.layers.length;
    app.open(base64image, null, /* asSmart */ true);
    app.echoToOE(layerNumBeforePaste.toString());
}

// Translate the newly added layer if the new layer has been added.
// Note: we cannot get layer bounds when a selection is active. So the resize and
// translation are all based on payload calculations.
function translateIfNewLayerAdded(layerCount, bounds, scaleX, scaleY, layerName) {
    if (app.activeDocument.layers.length === layerCount) {
        app.echoToOE("fail");
        return;
    }

    const doc = app.activeDocument;
    const layer = doc.activeLayer;
    layer.resize(
        (1 / scaleX) * 100,
        (1 / scaleY) * 100,
        AnchorPosition.MIDDLECENTER
    );

    const width = bounds[2] - bounds[0];
    const height = bounds[3] - bounds[1];
    const centerX = doc.width / 2;
    const centerY = doc.height / 2;

    const imageLeft = centerX - width / 2;
    const imageTop = centerY - height / 2;

    layer.translate(
        bounds[0] - imageLeft,
        bounds[1] - imageTop
    );

    layer.name = layerName;
    app.echoToOE("success");
}

// Delete everything outside the selected region.
function cropSelectedRegion(maskBlur) {
    const doc = app.activeDocument;
    const layer = doc.activeLayer;

    layer.rasterize(RasterizeType.ENTIRELAYER);
    if (maskBlur) {
        doc.selection.expand(maskBlur);
        doc.selection.feather(maskBlur);
    }
    // Clear everything outside selection.
    doc.selection.invert();
    doc.selection.clear();
    doc.selection.invert();
    app.echoToOE("success");
}

function deselect() {
    app.activeDocument.selection.deselect();
    app.echoToOE("success");
}

// Creates a black and white mask based on the current selection in the active document.
function exportMaskFromSelection(format) {
    // Note: app.activeDocument.selection seems always exists. Checking bounds
    // to see if the selection is actually there.
    if (!hasSelection()) {
        alert("No selection!");
        app.echoToOE("error");
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
    const result = JSON.stringify([
        bounds[0].value,
        bounds[1].value,
        bounds[2].value,
        bounds[3].value,
    ]);
    console.debug('sd-pea: capture bound ' + result);
    return result;
}

function getSelectionBound() {
    // Note: app.activeDocument.selection seems always exists. Checking bounds
    // to see if the selection is actually there.
    if (!hasSelection()) {
        alert("No selection!");
        app.echoToOE("error");
    } else {
        const bounds = app.activeDocument.selection.bounds;
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
        const activeLayer = app.activeDocument.activeLayer;
        function layerSelector(layer) {
            return layer == activeLayer;
        }
        exportSelectedLayerOnly(format, layerSelector);
        // After the ControlNet processing, make ref layer invisible.
        activeLayer.visible = false;
    } else {
        alert('No selection / active layer.');
        app.echoToOE("error");
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
        app.echoToOE("error");
    }
}

function fillLayerWithBlack(layer) {
    // Save the current active layer
    var originalActiveLayer = app.activeDocument.activeLayer;

    // Make the layer passed to the function the active layer
    app.activeDocument.activeLayer = layer;

    const blackColor = new SolidColor();
    blackColor.rgb.red = 0;
    blackColor.rgb.green = 0;
    blackColor.rgb.blue = 0;

    // Select all and fill with black.
    app.activeDocument.selection.selectAll();
    app.activeDocument.selection.fill(blackColor);
    app.activeDocument.selection.deselect();

    // Restore the original active layer
    app.activeDocument.activeLayer = originalActiveLayer;
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
    backgroundLayer.name = "CN:Background";
    fillLayerWithBlack(backgroundLayer);
    return newFolder;
}

/**
 * After the detected map has been pasted on Photopea as a new layer,
 * do some post process house keeping.
 * @param {string} layerName The name to assign to the new layer.
 * @param {string} previousLayerName The name of previously linked layer.
 */
function controlNetDetectedMapPostProcess(layerName, previousLayerName) {
    // Handle new layer.
    const layer = app.activeDocument.activeLayer;
    layer.name = layerName;
    const folder = createControlNetFolderIfNotExist();
    folder.visible = true; // Make folder visible if not.
    layer.move(folder, ElementPlacement.INSIDE);
    layer.opacity = 100;
    layer.blendMode = BlendMode.DIFFERENCE;

    // Rename and hides the previous linked layer.
    for (let i = 0; i < folder.layers.length; i++) {
        const layer = folder.layers[i];
        if (layer.typename === 'ArtLayer' && layer.name === previousLayerName) {
            layer.name = 'unlinked';
            layer.visible = false;
        }
    }

    app.echoToOE("success");
}

function exportLayersWithNames(layerNames, format) {
    function layerSelector(layer) {
        return layerNames.includes(layer.name);
    }
    exportSelectedLayerOnly(format, layerSelector);
}

function selectBound(bound) {
    const doc = app.activeDocument;
    const bounds = [
        [bound[0], bound[1]],
        [bound[2], bound[1]],
        [bound[2], bound[3]],
        [bound[0], bound[3]],
    ];
    doc.selection.select(bounds, SelectionType.REPLACE, 0, false);
}

function createRefRangePlaceholder(bound, layerName) {
    if (!hasSelection()) {
        alert("No selection!");
        app.echoToOE("error");
        return;
    }
    // Save the current active layer
    var originalActiveLayer = app.activeDocument.activeLayer;

    // Create a temp layer.
    const newLayer = app.activeDocument.artLayers.add();
    newLayer.name = layerName;
    newLayer.opacity = 30;

    const blackColor = new SolidColor();
    blackColor.rgb.red = 0;
    blackColor.rgb.green = 0;
    blackColor.rgb.blue = 0;

    // Fill with the foreground color
    selectBound(bound);
    app.activeDocument.selection.fill(blackColor);
    app.activeDocument.selection.deselect();

    // Restore the original active layer
    app.activeDocument.activeLayer = originalActiveLayer;

    app.echoToOE('success');
}

function removeTopLevelLayer(layerName) {
    let layerRemoved = false;
    const doc = app.activeDocument;
    for (let i = 0; i < doc.layers.length; i++) {
        const layer = doc.layers[i];
        if (layer.name === layerName) {
            layer.remove();
            layerRemoved = true;
        }
    }
    app.echoToOE(layerRemoved ? 'success' : 'fail');
}
