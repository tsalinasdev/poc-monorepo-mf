export interface OriginPlanetModel {
  name: string
  statusLabel: string // e.g. "Destroyed" / "Intact"
  imageUrl: string
}

export interface TransformationModel {
  id: number
  name: string
  imageUrl: string
  kiLabel: string
}

export interface CharacterDetailModel {
  name: string
  imageUrl: string
  description: string
  race: string
  gender: string
  affiliation: string
  kiLabel: string
  maxKiLabel: string
  originPlanet: OriginPlanetModel | null
  transformations: TransformationModel[]
}
