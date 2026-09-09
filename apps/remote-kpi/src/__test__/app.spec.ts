import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'

import App from '../App.vue'
import router from '../router'

/**
 * Smoke del remote standalone: monta la app REAL (router + Pinia + mock api)
 * igual que lo hace `src/main.ts`. Los mocks viven en localStorage (jsdom lo
 * provee), así que sin sembrar datos la vista renderiza su empty state — y eso
 * es justo lo que se assertea: el layout interno con sus tabs y su SecondNavbar.
 */
describe('remote-kpi standalone', () => {
  it('monta el layout interno con las tabs de configuración', async () => {
    await router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [createPinia(), router] },
    })
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Ciclos KPI')
    expect(text).toContain('Asignación')
    expect(text).toContain('Resultados')
    // SecondNavbar: navegación interna que quedó en el remote, no en el shell.
    expect(text).toContain('Configuración')

    wrapper.unmount()
  })
})
