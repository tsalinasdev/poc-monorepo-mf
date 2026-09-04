// External read-only catalog: the Dragon Ball API exposes no timestamps, so the
// createdAt/updatedAt entity rule does not apply here.
export class CharacterSummary {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly imageUrl: string,
    public readonly race: string,
    public readonly affiliation: string,
  ) {}
}
