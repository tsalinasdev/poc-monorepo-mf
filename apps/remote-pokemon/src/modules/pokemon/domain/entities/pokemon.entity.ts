import type { PokemonStat } from '../value-objects/pokemon-stat'

// External read-only catalog: PokeAPI exposes no timestamps, so the
// createdAt/updatedAt entity rule does not apply here.
export class Pokemon {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly imageUrl: string,
    public readonly heightDm: number, // decimetres, as provided by the API
    public readonly weightHg: number, // hectograms, as provided by the API
    public readonly types: string[],
    public readonly stats: PokemonStat[],
  ) {}
}
