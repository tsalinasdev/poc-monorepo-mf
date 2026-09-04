#!/usr/bin/env node
/**
 * Smoke test de la composición federada, a nivel de ARTEFACTO.
 *
 * No reemplaza al E2E (`pnpm test:e2e:preview`), que es el único que carga los
 * remotes en un navegador real. Este script cubre la capa de abajo: que los
 * artefactos construidos sean coherentes entre sí y sirvibles con los headers
 * correctos. Corre sin navegador, así que sirve en cualquier runner.
 *
 * Es también el smoke test post-deploy que pide el riesgo R17: apuntándolo a
 * las URLs reales del bucket en vez de a localhost, verifica CORS y
 * Cache-Control antes de dar por bueno un despliegue.
 *
 *   node scripts/smoke-federation.mjs                     # contra los dist/ locales
 *   node scripts/smoke-federation.mjs --remote https://cdn…/remote-pokemon/
 *
 * Qué comprueba:
 *   1. Cada remoteEntry.js y mf-manifest.json responde 200.
 *   2. El manifest expone el contrato esperado (`./routes`).
 *   3. El manifest declara los cuatro singletons con el requiredVersion del
 *      contrato de @pokedex/mf-shared — si el build negoció otro rango, acá se ve.
 *   4. Los cuatro singletons vienen como `singleton: true`. Uno en false es dos
 *      instancias en producción y un `inject()` que no encuentra nada.
 *   5. Contra un origen remoto: Access-Control-Allow-Origin presente, y
 *      Cache-Control del entry SIN max-age largo (si no, se despliega una
 *      versión nueva y el host sigue viendo la vieja, indefinidamente).
 */

import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))

const EXPECTED_SINGLETONS = {
  vue: '^3.5.0',
  'vue-router': '^5.0.0',
  pinia: '^3.0.0',
  '@pinia/colada': '^1.3.0',
}

const REMOTES = [
  { name: 'remotePokemon', dir: 'apps/remote-pokemon/dist', port: 5174, expose: './routes' },
  { name: 'remoteDragonball', dir: 'apps/remote-dragonball/dist', port: 5175, expose: './routes' },
]

const MIME = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
}

const failures = []
const notes = []

function check(ok, message, detail = '') {
  if (ok) {
    console.log(`  ✓ ${message}`)
  } else {
    console.log(`  ✗ ${message}${detail ? ` — ${detail}` : ''}`)
    failures.push(`${message}${detail ? ` — ${detail}` : ''}`)
  }
}

/** Sirve un dist/ con CORS abierto, igual que `vite preview`. */
function serveDist(dir, port) {
  const base = join(ROOT, dir)
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    const file = join(base, path === '/' ? 'index.html' : path)
    // El host pide remoteEntry.js cross-origin: sin CORS no carga nunca.
    res.setHeader('Access-Control-Allow-Origin', '*')
    try {
      if (!(await stat(file)).isFile()) throw new Error('not a file')
      res.setHeader('Content-Type', MIME[extname(file)] ?? 'application/octet-stream')
      // TTL corto en el entry y el manifest; inmutable en los chunks con hash.
      const shortTtl = /remoteEntry\.js$|mf-manifest\.json$|index\.html$/.test(file)
      res.setHeader('Cache-Control', shortTtl ? 'no-cache' : 'public, max-age=31536000, immutable')
      res.end(await readFile(file))
    } catch {
      res.statusCode = 404
      res.end('not found')
    }
  })
  return new Promise((ok) => server.listen(port, () => ok(server)))
}

async function fetchOk(url) {
  const res = await fetch(url)
  return { res, body: res.ok ? await res.text() : '' }
}

async function verifyRemote({ name, port, expose, origin }) {
  const base = origin ?? `http://localhost:${port}/`
  console.log(`\n${name} — ${base}`)

  const entry = await fetchOk(new URL('remoteEntry.js', base))
  check(entry.res.ok, 'remoteEntry.js responde 200', `HTTP ${entry.res.status}`)

  const cors = entry.res.headers.get('access-control-allow-origin')
  check(!!cors, 'remoteEntry.js trae Access-Control-Allow-Origin', 'ausente')

  const cache = entry.res.headers.get('cache-control') ?? ''
  const maxAge = Number(/max-age=(\d+)/.exec(cache)?.[1] ?? 0)
  check(
    !cache || cache.includes('no-cache') || maxAge <= 300,
    'remoteEntry.js NO está cacheado de forma agresiva',
    `Cache-Control: ${cache || '(ausente)'}`,
  )

  const manifest = await fetchOk(new URL('mf-manifest.json', base))
  check(manifest.res.ok, 'mf-manifest.json responde 200', `HTTP ${manifest.res.status}`)
  if (!manifest.res.ok) return null

  const m = JSON.parse(manifest.body)

  const exposes = (m.exposes ?? []).map((e) => `./${String(e.name).replace(/^\.\//, '')}`)
  check(exposes.includes(expose), `expone el contrato ${expose}`, `expone: ${exposes.join(', ')}`)

  const shared = Object.fromEntries((m.shared ?? []).map((s) => [s.name, s]))
  for (const [dep, range] of Object.entries(EXPECTED_SINGLETONS)) {
    const s = shared[dep]
    if (!s) {
      check(false, `declara ${dep} en shared`, 'ausente del manifest')
      continue
    }
    check(s.singleton === true, `${dep} es singleton`, `singleton: ${s.singleton}`)
    check(
      s.requiredVersion === range,
      `${dep} pide ${range}`,
      `el build negoció ${s.requiredVersion}`,
    )
  }
  return m
}

async function verifyHost() {
  console.log('\nhost — http://localhost:5173/')
  const index = await fetchOk('http://localhost:5173/')
  check(index.res.ok, 'index.html responde 200', `HTTP ${index.res.status}`)

  // R20: un #app vacío es una pantalla en blanco mientras la red tarda.
  const hasSkeleton = /id="app"[^>]*>\s*\S/.test(index.body)
  if (!hasSkeleton) {
    notes.push(
      'El index.html del host no trae skeleton inline: el primer paint es blanco ' +
        'hasta que resuelve el bundle. Riesgo R20 — pendiente, no bloqueante.',
    )
  }

  // El host tiene la URL de cada remote horneada en el build (riesgo R6).
  // Verificarlo es la forma de detectar un dist/ construido para otro ambiente.
  const assets = await fetchOk('http://localhost:5173/mf-manifest.json')
  if (assets.res.ok) {
    const m = JSON.parse(assets.body)
    const declared = (m.remotes ?? []).map((r) => r.entry ?? r.federationContainerName)
    console.log(`  · remotes declarados en el manifest: ${declared.join(', ') || '(ninguno)'}`)
  }
  return index
}

const argOrigin = (name) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : undefined
}

const servers = []
try {
  const useLocal = !argOrigin('remote-pokemon') && !argOrigin('remote-dragonball')

  if (useLocal) {
    console.log('Sirviendo los dist/ locales (5173/5174/5175)…')
    servers.push(await serveDist('apps/host/dist', 5173))
    for (const r of REMOTES) servers.push(await serveDist(r.dir, r.port))
    await verifyHost()
  }

  for (const r of REMOTES) {
    const kebab = r.name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
    await verifyRemote({ ...r, origin: argOrigin(kebab) })
  }
} finally {
  for (const s of servers) s.close()
}

console.log()
for (const n of notes) console.log(`NOTA: ${n}`)

if (failures.length) {
  console.log(`\n✗ ${failures.length} comprobación(es) fallida(s)`)
  process.exit(1)
}
console.log('✓ Composición federada coherente')
