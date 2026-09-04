import { DomainException } from '@/base/lib/domain/domain-exception.base'
import axios from 'axios'

export class HttpServiceException extends DomainException {
  readonly code = 'HTTP_SERVICE_ERROR'

  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly downstreamCode?: string,
  ) {
    super(message)
  }

  static fromAxiosError(error: unknown): HttpServiceException {
    if (axios.isAxiosError(error)) {
      return new HttpServiceException(
        error.response?.status ?? 500,
        error.response?.data?.message ?? error.message,
        error.code,
      )
    }
    return new HttpServiceException(500, 'Unexpected error')
  }
}
