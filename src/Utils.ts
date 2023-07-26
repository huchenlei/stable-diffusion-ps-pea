import _ from "lodash";


function isBlob(threshold: number = 1000) {
    function _isBlob(obj: any) {
        if (_.isString(obj) && (obj.length > threshold || obj.startsWith('data:image'))) {
            return true;
        }
        if (_.isArrayBuffer(obj) && obj.byteLength > threshold) {
            return true;
        }
        if (obj instanceof Uint8Array && obj.length > threshold) {
            return true;
        }
        if (obj instanceof Blob && obj.length > threshold) {
            return true;
        }
        return false;
    }
    return _isBlob;
}

// Deep clone an object without base64 image fields.
function cloneNoBlob(obj: any, checkBlob: (obj: any) => boolean = isBlob()) {
    return _.transform(obj, (result: any, value, key) => {
        if (checkBlob(value)) {
            // Skip this field.
        } else if (_.isObject(value)) {
            // Recurse into the object.
            result[key] = cloneNoBlob(value, checkBlob);
        } else {
            // Copy the field as is.
            result[key] = value;
        }
    });
}

export {
    cloneNoBlob
};