import { createI18n } from 'vue-i18n'

const messages = {
    en: {
        nav: {
            connection: 'Connection',
            about: 'About',
            generation: 'Generation',
            history: 'History',
            config: 'Config',
        },
        gen: {
            autoGenerationModeHint: 'Automatically select generation mode based on selected area.',
            skip: 'Skip',
            interrupt: 'Interrupt',
            addLoRA: 'Add LoRA',
            enterPrompt: 'Enter prompt',
            enterNegativePrompt: 'Enter negative prompt',
            extraNetworks: 'Extra networks',
            clearPrompt: 'Clear current prompt',
            samplingSteps: 'Sampling Steps',
            cfg: 'CFG Scale',
            batchSize: 'Batch Size',
            sampler: 'Sampler',
            advancedSettings: 'Advanced settings',
            prepare: 'Preview Payload',
            selectRefArea: 'Select Ref Area',
            scaleRatio: 'Scale Ratio',
            referenceRange: 'Reference Range',

            inpaintArea: 'Inpaint Area',
            resizeMode: 'Resize Mode',
            inpaintFill: 'Inpaint Fill',
            maskMode: 'Mask Mode',
            denoisingStrength: 'Denoising Strength',
            steps: {
                kInitialState: '',
                kSelectRefAreaState: 'Select reference area on canvas',
                kPayloadPreparedState: 'Click generate when satisfied with payload',
                kFinishedState: 'Pick the result image(s) to keep',

                TokSelectRefAreaState: 'Manually select reference area',
                TokPayloadPreparedState: 'Preview payload before sending it',
                TokFinishedState: 'Generate image based on current setting',
            },
        },
        cnet: {
            guidanceRange: 'Guidance Range',
            lowvram: 'Low VRAM',
            model: 'Model',
            module: 'Preprocessor',
            unlinked: 'Unlinked',
            unitDisabled: 'ControlNet unit disabled',
            unitEnabled: 'ControlNet unit enabled',
            controlMode: 'Control Mode',
            uploadImage: 'Upload Image',
        },

        weight: 'Weight',
        width: 'Width',
        height: 'Height',

        con: {
            connect: 'Connect',
            connected: 'Connected',
            newConnection: 'New Connection',
        },
        generate: 'Generate',

        config: {
            newConfig: 'Enter new config name',
            downloadConfig: 'Download config as .json5 file',
            deleteConfig: 'Delete the selected config',
            saveConfig: 'Save config',
        },
    },
};

export default createI18n({
    locale: navigator.language.split('-')[0] || 'en',
    fallbackLocale: 'en',
    legacy: false,
    messages,
});
