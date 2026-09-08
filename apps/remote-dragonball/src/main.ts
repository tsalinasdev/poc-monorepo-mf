import './assets/main.css'
import '@/modules/shared/config/env' // must be first — crashes early if vars are missing

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'

import App from './App.vue'
import router from './router'
import { coladaOptions } from '@/modules/shared/config/colada'

// Standalone entry point: mirrors what the host does for us in federated mode,
// so the remote stays independently runnable and debuggable.
const app = createApp(App)

app.use(createPinia())
app.use(PiniaColada, coladaOptions)
app.use(router)

app.mount('#app')
