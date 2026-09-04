export interface PokemonListItemDto {
  name: string
  url: string
}

export interface PokemonListResponseDto {
  count: number
  results: PokemonListItemDto[]
}
