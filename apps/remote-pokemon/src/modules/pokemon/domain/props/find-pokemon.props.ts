import { Props } from '@/base/lib/domain/props.base'

export class FindPokemonProps extends Props {
  constructor(public readonly name: string) {
    super()
  }
}
