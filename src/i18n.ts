import { createI18n } from 'vue-i18n'

const messages = {
    en: {
        nav: {
            connection: 'Connection',
            about: 'About',
            generation: 'Generation',
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
            samplingSteps: 'Sampling steps',
            cfg: 'CFG Scale',
            batchSize: 'Batch Size',
            sampler: 'Sampler',
            advancedSettings: 'Advanced settings',
        },
        cnet: {
            guidanceRange: 'Guidance Range',
            lowvram: 'Low VRAM',
            model: 'Model',
            module: 'Preprocessor',
        },

        weight: 'Weight',
        width: 'Width',
        height: 'Height',

        connect: 'Connect',
        a1111URL: 'A1111 URL:',
        generate: 'Generate',
    },
};

export default createI18n({
    locale: navigator.language.split('-')[0] || 'en',
    fallbackLocale: 'en',
    messages,
});
