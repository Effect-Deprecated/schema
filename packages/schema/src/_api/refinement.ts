// ets_tracing: off

import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import type { Refinement } from "@effect-ts/core/Function"
import { pipe } from "@effect-ts/core/Function"

import type { RefinementE } from "../_schema/error.js"
import * as S from "../_schema/index.js"
import { unknown } from "./unknown.js"
import type { DefaultSchema } from "./withDefaults.js"
import { withDefaults } from "./withDefaults.js"

export const refinementIdentifier = S.makeAnnotation<{
  refinement: Refinement<unknown, unknown>
  error: (value: unknown) => unknown
}>()

export function refinement<E extends S.AnyError, NewParsedShape>(
  refinement: Refinement<unknown, NewParsedShape>,
  error: (value: unknown) => E
): DefaultSchema<
  unknown,
  RefinementE<E>,
  NewParsedShape,
  unknown,
  RefinementE<E>,
  unknown,
  {}
> {
  return pipe(
    unknown,
    S.refine(refinement, error),
    S.mapParserError((e) => Chunk.unsafeHead(e.errors).error),
    S.mapConstructorError((e) => Chunk.unsafeHead(e.errors).error),
    withDefaults,
    S.annotate(refinementIdentifier, { refinement, error })
  )
}
