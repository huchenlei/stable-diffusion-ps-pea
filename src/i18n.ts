import { createI18n } from 'vue-i18n'

const messages = {
    en: {
        nav: {
            connection: 'Connection',
            about: 'About',
            generation: 'Generation',
        },
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
