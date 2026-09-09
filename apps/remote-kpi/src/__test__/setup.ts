/**
 * Restauración del localStorage de jsdom bajo Node >= 22.4.
 *
 * Node trae un `localStorage` global experimental que, sin `--localstorage-file`,
 * devuelve `undefined` (con un warning). El `populateGlobal` de vitest NO
 * sobrescribe globals preexistentes que no estén en su lista de KEYS del
 * navegador, así que el accessor de Node sombrea al Storage de jsdom y los
 * mocks del módulo KPI (que persisten en localStorage) se rompen.
 *
 * El accessor de Node es configurable: lo quitamos y exponemos el Storage del
 * propio jsdom window (`_localStorage`, poblado por el environment).
 */
const broken = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')

if (broken && broken.get && (broken.get as () => unknown).call(globalThis) === undefined) {
  delete (globalThis as { localStorage?: unknown }).localStorage
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get: () => (globalThis as { _localStorage?: unknown })._localStorage,
  })
}

/**
 * jsdom sin el paquete `canvas` nativo: getContext('2d') devuelve null y
 * FormDrawer (que mide el ancho del sufijo '%' con canvas) crashea en su
 * setup. Stub mínimo con la superficie que el módulo usa: `font` y
 * `measureText().width`.
 */
HTMLCanvasElement.prototype.getContext = function getContext() {
  return {
    font: '',
    measureText: (text: string) => ({ width: text.length * 8 }),
  }
} as unknown as typeof HTMLCanvasElement.prototype.getContext

export {}
