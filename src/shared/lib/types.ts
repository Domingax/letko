import type { Result as NeverthrowResult } from 'neverthrow'

export type Result<T, E = string> = NeverthrowResult<T, E>
export type AsyncResult<T, E = string> = Promise<NeverthrowResult<T, E>>
