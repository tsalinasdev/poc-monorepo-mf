import './assets/main.css'
import './base/config/env/env.config' // must be first — crashes early if vars are missing

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'

import App from './App.vue'
import router, { registerRemoteRoutes } from './base/config/router'
import { coladaOptions } from './base/config/colada/colada.options'

// The host is the only place an app instance exists, so it installs every plugin
// the remotes rely on. This is the runtime half of the federated contract: a
// remote screen calling useQuery() assumes Pinia + Pinia Colada are already here.
const app = createApp(App)

app.use(createPinia())
app.use(PiniaColada, coladaOptions)

// Remote contracts are fetched before mounting so the navbar — which is derived
// from the mounted routes — is complete on first paint. A remote that fails to
// answer no longer takes the shell down with it: it is reported here and its
// section degrades on its own.
const registrations = await registerRemoteRoutes(router)

registrations
  .filter((registration) => registration.status === 'unavailable')
  .forEach((registration) => {
    console.error(`[shell] remote "${registration.id}" is unavailable`, registration.error)
  })

app.use(router)

app.mount('#app')
