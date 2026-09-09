import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Standalone entry point: mirrors what the host does for us in federated mode,
// so the remote stays independently runnable and debuggable.
const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app-kpi')
