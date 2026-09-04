import type { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'
import axios from 'axios'
import type { HttpResponse, HttpHeaders } from './http-response'
import { HttpServiceException } from './exception/http-service.exception'
import { API_BASE_URL, HTTP_TIMEOUT_MS, HTTP_RETRY_ATTEMPTS } from '@/base/constants'

export class AxiosHttpClient {
  private readonly client: AxiosInstance
  private readonly retryAttempts: number = HTTP_RETRY_ATTEMPTS

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: HTTP_TIMEOUT_MS,
    })
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'GET', url, ...config })
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, ...config })
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data, ...config })
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'PATCH', url, data, ...config })
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, ...config })
  }

  private async request<T>(axiosConfig: AxiosRequestConfig): Promise<HttpResponse<T>> {
    let lastError: unknown

    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }

        const response = await this.client.request<T>(axiosConfig)

        return {
          data: response.data,
          status: response.status,
          headers: response.headers as HttpHeaders,
        }
      } catch (error: unknown) {
        lastError = error
        if (!this.isRetryable(error) || attempt === this.retryAttempts) break
      }
    }

    throw HttpServiceException.fromAxiosError(lastError)
  }

  private isRetryable(error: unknown): boolean {
    if (!axios.isAxiosError(error)) return false
    const axiosError = error as AxiosError
    if (!axiosError.response) return true // network errors, timeouts
    return axiosError.response.status >= 500
  }
}
