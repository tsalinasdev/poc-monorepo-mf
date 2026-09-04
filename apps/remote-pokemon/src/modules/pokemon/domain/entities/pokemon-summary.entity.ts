// External read-only catalog: PokeAPI exposes no timestamps, so the
// createdAt/updatedAt entity rule does not apply here.
export class PokemonSummary {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly imageUrl: string,
  ) {}
}
