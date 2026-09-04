import type { Result } from '../domain/result'
import type { Command } from '../domain/command.base'
import type { Query } from '../domain/query.base'
import type { Props } from '../domain/props.base'

type Input = Command | Query | Props

export abstract class UseCase<I extends Input, O> {
  abstract execute(input: I): Result<O> | Promise<Result<O>>
}
