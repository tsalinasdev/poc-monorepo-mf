export interface CharacterCard {
  id: number
  name: string
  imageUrl: string
  race: string
  affiliation: string
}

export interface CharacterOriginPlanet {
  name: string
  statusLabel: string // "Destroyed" / "Intact"
  imageUrl: string
}

export interface CharacterTransformation {
  id: number
  name: string
  imageUrl: string
  kiLabel: string
}

export interface CharacterDetail {
  name: string
  imageUrl: string
  description: string
  race: string
  gender: string
  affiliation: string
  kiLabel: string
  maxKiLabel: string
  originPlanet: CharacterOriginPlanet | null
  transformations: CharacterTransformation[]
}
