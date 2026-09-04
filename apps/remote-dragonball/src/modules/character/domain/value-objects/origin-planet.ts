// Structural value object embedded in the Character aggregate: no behaviour,
// so it is a plain interface without the ValueObject suffix.
export interface OriginPlanet {
  name: string
  isDestroyed: boolean
  imageUrl: string
}
