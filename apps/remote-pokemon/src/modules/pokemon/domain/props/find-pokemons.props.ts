import { Props } from '@/base/lib/domain/props.base'

export class FindPokemonsProps extends Props {
  constructor(
    public readonly page: number,
    public readonly limit: number,
  ) {
    super()
  }
}
