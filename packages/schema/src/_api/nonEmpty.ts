// ets_tracing: off

import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema/index.js"
import type { DefaultSchema } from "./withDefaults.js"
import { withDefaults } from "./withDefaults.js"

export interface NonEmptyBrand {
  readonly NonEmpty: unique symbol
}

export const nonEmptyIdentifier = S.makeAnnotation<{ self: S.SchemaAny }>()

export function nonEmpty<
  ParserInput,
  ParserError extends S.AnyError,
  ParsedShape extends { length: number },
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
  S.CompositionE<
    S.NextE<S.RefinementE<S.LeafE<S.NonEmptyE<ParsedShape>>>> | S.PrevE<ParserError>
  >,
  ParsedShape & NonEmptyBrand,
  ConstructorInput,
  S.CompositionE<
    | S.NextE<S.RefinementE<S.LeafE<S.NonEmptyE<ParsedShape>>>>
    | S.PrevE<ConstructorError>
  >,
  Encoded,
  Api
> {
  return pipe(
    self,
    S.refine(
      (n): n is ParsedShape & NonEmptyBrand => n.length > 0,
      (n) => S.leafE(S.nonEmptyE(n))
    ),
    withDefaults,
    S.annotate(nonEmptyIdentifier, { self })
  )
}
