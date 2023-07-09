import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue';

import App from './App.vue'
import router from './router'
import 'ant-design-vue/dist/antd.css';

import i18n from './i18n';

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Antd)
app.use(i18n);
app.mount('#app')
