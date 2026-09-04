export interface PokemonCardModel {
  id: number
  slug: string // route param (raw API name)
  name: string
  numberLabel: string // e.g. "#025"
  imageUrl: string
}
