import axios, { isAxiosError } from 'axios'
import { env } from '@/modules/shared/config/env'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not found') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

const TIMEOUT_MS = 10_000
const RETRY_ATTEMPTS = 2

const client = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: TIMEOUT_MS,
})

function toApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    return new ApiError(
      error.response?.data?.message ?? error.message,
      error.response?.status ?? 500,
    )
  }
  return new ApiError('Unexpected error', 500)
}

function isRetryable(error: unknown): boolean {
  if (!isAxiosError(error)) return false
  if (!error.response) return true // network errors, timeouts
  return error.response.status >= 500
}

// GET with the app's resilience policy: a network failure or a 5xx is retried
// with exponential backoff before surfacing as an ApiError.
export async function httpGet<T>(url: string): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(1000 * 2 ** (attempt - 1), 10_000)),
        )
      }
      const response = await client.get<T>(url)
      return response.data
    } catch (error) {
      lastError = error
      if (!isRetryable(error) || attempt === RETRY_ATTEMPTS) break
    }
  }

  throw toApiError(lastError)
}
