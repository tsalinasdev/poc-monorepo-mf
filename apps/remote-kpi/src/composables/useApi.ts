// Stub legacy del wrapper de fetch del módulo: el código portado nunca
// alcanzó a tiparse. Convive con los mocks de `api/` (que tampoco están
// tipados) mientras se hace la migración a TS; ver TODO del tsconfig.app.json.

export function useApi(basePath: string) {
  async function request(method: string, path: string, data?: unknown) {
    const url = `${basePath}${path}`
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    }
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data)
    }
    const res = await fetch(url, options)
    if (!res.ok) throw new Error(`${method} ${url} → ${res.status}`)
    return res.json()
  }

  return {
    get: (path: string, params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return request('GET', path + qs)
    },
    post: (path: string, data: unknown) => request('POST', path, data),
    put: (path: string, data: unknown) => request('PUT', path, data),
    del: (path: string, data: unknown) => request('DELETE', path, data),
  }
}
