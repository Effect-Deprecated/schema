// ets_tracing: off

import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema/index.js"
import { brand } from "./brand.js"
import type { NonEmptyBrand } from "./nonEmpty.js"
import { nonEmpty } from "./nonEmpty.js"
import { fromString, string } from "./string.js"
import type { DefaultSchema } from "./withDefaults.js"

export type NonEmptyString = string & NonEmptyBrand

export const nonEmptyStringFromStringIdentifier = S.makeAnnotation<{}>()

export const nonEmptyStringFromString: DefaultSchema<
  string,
  S.RefinementE<S.LeafE<S.NonEmptyE<string>>>,
  NonEmptyString,
  string,
  S.RefinementE<S.LeafE<S.NonEmptyE<string>>>,
  string,
  {}
> = pipe(
  fromString,
  S.arbitrary((FC) => FC.string({ minLength: 1 })),
  nonEmpty,
  S.mapParserError((_) => Chunk.unsafeHead(_.errors).error),
  S.mapConstructorError((_) => Chunk.unsafeHead(_.errors).error),
  brand<NonEmptyString>(),
  S.annotate(nonEmptyStringFromStringIdentifier, {})
)

export const nonEmptyStringIdentifier = S.makeAnnotation<{}>()

export const nonEmptyString: DefaultSchema<
  unknown,
  S.CompositionE<
    | S.NextE<S.RefinementE<S.LeafE<S.NonEmptyE<string>>>>
    | S.PrevE<S.RefinementE<S.LeafE<S.ParseStringE>>>
  >,
  NonEmptyString,
  string,
  S.RefinementE<S.LeafE<S.NonEmptyE<string>>>,
  string,
  S.ApiSelfType<NonEmptyString>
> = pipe(
  string[">>>"](nonEmptyStringFromString),
  brand<NonEmptyString>(),
  S.annotate(nonEmptyStringIdentifier, {})
)
