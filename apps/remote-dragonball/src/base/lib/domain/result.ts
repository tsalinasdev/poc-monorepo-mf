import type { DomainException } from './domain-exception.base'

export class Result<T> {
  private constructor(
    private readonly value?: T,
    private readonly error?: DomainException,
  ) {}

  static ok<T>(value: T): Result<T> {
    return new Result<T>(value, undefined)
  }

  static err<T = never>(error: DomainException): Result<T> {
    return new Result<T>(undefined, error)
  }

  isOk(): boolean {
    return this.error === undefined
  }

  isErr(): boolean {
    return this.error !== undefined
  }

  getValue(): T {
    if (this.isErr()) throw new Error('Cannot get value of an error result')
    return this.value as T
  }

  getError(): DomainException {
    if (this.isOk()) throw new Error('Cannot get error of a success result')
    return this.error as DomainException
  }
}
