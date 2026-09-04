export class Paginated<T> {
  readonly items: T[]
  readonly total: number
  readonly page: number
  readonly limit: number

  constructor(items: T[], total: number, page: number, limit: number) {
    this.items = items
    this.total = total
    this.page = page
    this.limit = limit
  }
}
