// tracing: off

import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema"
import { brand } from "./brand"
import type { NonEmptyBrand } from "./nonEmpty"
import { nonEmpty } from "./nonEmpty"
import { fromString, string } from "./string"
import type { SchemaWithDefaults } from "./withDefaults"

export type NonEmptyString = string & NonEmptyBrand

export const nonEmptyStringFromStringIdentifier = S.makeAnnotation<{}>()

export const nonEmptyStringFromString: SchemaWithDefaults<
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

export const nonEmptyString: SchemaWithDefaults<
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
