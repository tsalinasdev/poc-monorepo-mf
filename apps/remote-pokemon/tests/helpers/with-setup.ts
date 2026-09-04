import { createApp, type App } from 'vue'
import { createPinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'

export function withSetup<T>(composable: () => T): { result: T; app: App } {
  let result!: T
  const app = createApp({
    setup() {
      result = composable()
      return () => null
    },
  })
  // Pinia Colada needs a live Pinia instance — this is the extra test setup
  // the library adds to ViewModel tests (vs. the plain manual-state VM).
  app.use(createPinia())
  app.use(PiniaColada)
  app.mount(document.createElement('div'))
  return { result, app }
}
