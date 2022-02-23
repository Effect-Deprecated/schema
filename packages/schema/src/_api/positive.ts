// ets_tracing: off

import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema/index.js"
import type { DefaultSchema } from "./withDefaults.js"
import { withDefaults } from "./withDefaults.js"

export interface PositiveBrand {
  readonly Positive: unique symbol
}

export type Positive = number & PositiveBrand

export const positiveIdentifier = S.makeAnnotation<{ self: S.SchemaAny }>()

export function positive<
  ParserInput,
  ParserError extends S.AnyError,
  ParsedShape extends number,
  ConstructorInput,
  ConstructorError extends S.AnyError,
  Encoded,
  Api
>(
  self: S.Schema<
    ParserInput,
    ParserError,
    ParsedShape,
    ConstructorInput,
    ConstructorError,
    Encoded,
    Api
  >
): DefaultSchema<
  ParserInput,
  S.CompositionE<S.PrevE<ParserError> | S.NextE<S.RefinementE<S.LeafE<S.PositiveE>>>>,
  ParsedShape & PositiveBrand,
  ConstructorInput,
  S.CompositionE<
    S.PrevE<ConstructorError> | S.NextE<S.RefinementE<S.LeafE<S.PositiveE>>>
  >,
  Encoded,
  Api
> {
  return pipe(
    self,
    S.refine(
      (n): n is ParsedShape & Positive => n >= 0,
      (n) => S.leafE(S.positiveE(n))
    ),
    withDefaults,
    S.annotate(positiveIdentifier, { self })
  )
}
