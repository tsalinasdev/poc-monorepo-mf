export interface PokemonCard {
  id: number
  slug: string // route param (raw API name)
  name: string
  numberLabel: string // e.g. "#025"
  imageUrl: string
}

export interface PokemonStatBar {
  label: string
  value: number
  percent: number // 0–100, drives the stat bar width
}

export interface PokemonDetail {
  name: string
  numberLabel: string
  imageUrl: string
  heightLabel: string // e.g. "0.4 m"
  weightLabel: string // e.g. "6.0 kg"
  types: string[]
  stats: PokemonStatBar[]
}
