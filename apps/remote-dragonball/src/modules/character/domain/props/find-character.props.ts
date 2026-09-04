import { Props } from '@/base/lib/domain/props.base'

export class FindCharacterProps extends Props {
  constructor(public readonly id: number) {
    super()
  }
}
