// Subset of GET /characters/{id} — only the fields this app consumes.
export interface OriginPlanetDto {
  id: number
  name: string
  isDestroyed: boolean
  image: string
}

export interface TransformationDto {
  id: number
  name: string
  image: string
  ki: string
}

export interface CharacterResponseDto {
  id: number
  name: string
  image: string
  race: string | null
  gender: string | null
  affiliation: string | null
  ki: string | null
  maxKi: string | null
  description: string
  originPlanet?: OriginPlanetDto | null
  transformations?: TransformationDto[]
}
