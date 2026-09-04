// Subset of GET /characters?page&limit — only the fields this app consumes.
export interface CharacterListItemDto {
  id: number
  name: string
  image: string
  race: string | null
  affiliation: string | null
}

export interface CharacterListResponseDto {
  items: CharacterListItemDto[]
  meta: {
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  }
}
