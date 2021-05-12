// tracing: off

import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema"
import type { Branded } from "./brand"
import { brand } from "./brand"
import type { NonEmptyBrand } from "./nonEmpty"
import { nonEmpty } from "./nonEmpty"
import { fromString, string } from "./string"

export type NonEmptyString = string & NonEmptyBrand

export const nonEmptyStringFromStringIdentifier = Symbol.for(
  "@effect-ts/schema/ids/nonEmptyStringFromString"
)

export const nonEmptyStringFromString: Branded<
  string,
  S.RefinementE<S.LeafE<S.NonEmptyE<string>>>,
  string,
  S.RefinementE<S.LeafE<S.NonEmptyE<string>>>,
  string,
  {},
  NonEmptyString
> = pipe(
  fromString,
  S.arbitrary((FC) => FC.string({ minLength: 1 })),
  nonEmpty,
  S.mapParserError((_) => Chunk.unsafeHead(_.errors).error),
  S.mapConstructorError((_) => Chunk.unsafeHead(_.errors).error),
  brand((_) => _ as NonEmptyString),
  S.identified(nonEmptyStringFromStringIdentifier, {})
)

export const nonEmptyStringIdentifier = Symbol.for(
  "@effect-ts/schema/ids/nonEmptyString"
)

export const nonEmptyString: Branded<
  unknown,
  S.CompositionE<
    | S.NextE<S.RefinementE<S.LeafE<S.NonEmptyE<string>>>>
    | S.PrevE<S.RefinementE<S.LeafE<S.ParseStringE>>>
  >,
  string,
  S.RefinementE<S.LeafE<S.NonEmptyE<string>>>,
  string,
  S.ApiSelfType<NonEmptyString>,
  NonEmptyString
> = pipe(
  string[">>>"](nonEmptyStringFromString),
  brand((_) => _ as NonEmptyString),
  S.identified(nonEmptyStringIdentifier, {})
)
