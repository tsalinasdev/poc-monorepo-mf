import { env } from '@/base/config/env/env.config'

export const API_BASE_URL = env.VITE_API_BASE_URL
export const HTTP_TIMEOUT_MS = 10000
export const HTTP_RETRY_ATTEMPTS = 2
export const DEFAULT_PAGE_SIZE = 20
