import { Props } from '@/base/lib/domain/props.base'

export class FindCharactersProps extends Props {
  constructor(
    public readonly page: number,
    public readonly limit: number,
  ) {
    super()
  }
}
