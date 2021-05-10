// tracing: off

import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema"
import { fromNumber, number, stringNumberFromString } from "./number"
import { string } from "./string"

export interface IntBrand {
  readonly Int: unique symbol
}

export type Int = number & IntBrand

export const intFromNumberIdentifier = Symbol.for("@effect-ts/schema/ids/intFromNumber")

export const intFromNumber: S.Schema<
  number,
  S.RefinementE<S.LeafE<S.InvalidIntegerE>>,
  Int,
  number,
  S.RefinementE<S.LeafE<S.InvalidIntegerE>>,
  Int,
  number,
  {}
> = pipe(
  fromNumber,
  S.arbitrary((_) => _.integer()),
  S.refine(
    (n): n is Int => Number.isInteger(n),
    (n) => S.leafE(S.invalidIntegerE(n))
  ),
  S.encoder((_) => _ as number),
  S.mapConstructorError((_) => Chunk.unsafeHead(_.errors).error),
  S.mapParserError((_) => Chunk.unsafeHead(_.errors).error),
  S.mapApi(() => ({})),
  S.identified(intFromNumberIdentifier, {})
)

export const stringIntIdentifier = Symbol.for("@effect-ts/schema/ids/stringInt")

export const stringIntFromString: S.Schema<
  string,
  S.CompositionE<
    | S.NextE<S.RefinementE<S.LeafE<S.InvalidIntegerE>>>
    | S.PrevE<S.LeafE<S.ParseNumberE>>
  >,
  Int,
  number,
  S.RefinementE<S.LeafE<S.InvalidIntegerE>>,
  Int,
  string,
  {}
> = stringNumberFromString[">>>"](intFromNumber).id(stringIntIdentifier, {})

export const stringInt: S.Schema<
  unknown,
  S.CompositionE<
    | S.PrevE<S.RefinementE<S.LeafE<S.ParseStringE>>>
    | S.NextE<
        S.CompositionE<
          | S.PrevE<S.LeafE<S.ParseNumberE>>
          | S.NextE<S.RefinementE<S.LeafE<S.InvalidIntegerE>>>
        >
      >
  >,
  Int,
  number,
  S.RefinementE<S.LeafE<S.InvalidIntegerE>>,
  Int,
  string,
  {}
> = string[">>>"](stringIntFromString)

export const intIdentifier = Symbol.for("@effect-ts/schema/ids/int")

export const int: S.Schema<
  unknown,
  S.CompositionE<
    | S.NextE<S.RefinementE<S.LeafE<S.InvalidIntegerE>>>
    | S.PrevE<S.RefinementE<S.LeafE<S.ParseNumberE>>>
  >,
  Int,
  number,
  S.RefinementE<S.LeafE<S.InvalidIntegerE>>,
  Int,
  number,
  {}
> = number[">>>"](intFromNumber).id(intIdentifier, {})
