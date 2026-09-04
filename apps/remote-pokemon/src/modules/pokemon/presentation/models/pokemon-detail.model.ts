export interface PokemonStatBarModel {
  label: string
  value: number
  percent: number // 0–100, drives the stat bar width
}

export interface PokemonDetailModel {
  name: string
  numberLabel: string
  imageUrl: string
  heightLabel: string // e.g. "0.4 m"
  weightLabel: string // e.g. "6.0 kg"
  types: string[]
  stats: PokemonStatBarModel[]
}
