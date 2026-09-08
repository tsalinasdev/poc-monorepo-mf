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
  app.use(createPinia())
  app.use(PiniaColada)
  app.mount(document.createElement('div'))
  return { result, app }
}
