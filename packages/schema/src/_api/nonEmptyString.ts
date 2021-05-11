// tracing: off

import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema"
import { brand } from "./brand"
import type { NonEmptyBrand } from "./nonEmpty"
import { nonEmpty } from "./nonEmpty"
import { fromString, string } from "./string"

export type NonEmptyString = string & NonEmptyBrand

export const nonEmptyStringFromStringIdentifier = Symbol.for(
  "@effect-ts/schema/ids/nonEmptyString"
)

export const nonEmptyStringFromString: S.Schema<
  string,
  S.RefinementE<S.LeafE<S.NonEmptyE<string>>>,
  NonEmptyString,
  string,
  S.RefinementE<S.LeafE<S.NonEmptyE<string>>>,
  string,
  S.ApiSelfType<NonEmptyString>
> = pipe(
  fromString,
  S.arbitrary((FC) => FC.string({ minLength: 1 })),
  nonEmpty,
  S.mapParserError((_) => Chunk.unsafeHead(_.errors).error),
  S.mapConstructorError((_) => Chunk.unsafeHead(_.errors).error),
  brand((_) => _ as NonEmptyString),
  S.identified(nonEmptyStringFromStringIdentifier, {})
)

export const nonEmptyString: S.Schema<
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
> = string[">>>"](nonEmptyStringFromString)
