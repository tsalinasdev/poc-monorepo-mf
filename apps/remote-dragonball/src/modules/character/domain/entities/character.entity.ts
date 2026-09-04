import type { OriginPlanet } from '../value-objects/origin-planet'
import type { CharacterTransformation } from '../value-objects/character-transformation'

// External read-only catalog: the Dragon Ball API exposes no timestamps, so the
// createdAt/updatedAt entity rule does not apply here.
export class Character {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly imageUrl: string,
    public readonly race: string,
    public readonly gender: string,
    public readonly affiliation: string,
    public readonly ki: string,
    public readonly maxKi: string,
    public readonly description: string,
    public readonly originPlanet: OriginPlanet | null,
    public readonly transformations: CharacterTransformation[],
  ) {}
}
