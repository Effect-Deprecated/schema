// tracing: off

import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema"
import type { Branded } from "./brand"
import { brand } from "./brand"
import { fromNumber, number, stringNumberFromString } from "./number"
import { string } from "./string"

export interface IntBrand {
  readonly Int: unique symbol
}

export type Int = number & IntBrand

export const intFromNumberIdentifier = Symbol.for("@effect-ts/schema/ids/intFromNumber")

export const intFromNumber: Branded<
  number,
  S.RefinementE<S.LeafE<S.InvalidIntegerE>>,
  number,
  S.RefinementE<S.LeafE<S.InvalidIntegerE>>,
  number,
  {},
  Int
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
  brand((_) => _ as Int),
  S.identified(intFromNumberIdentifier, {})
)

export const stringIntFromStringIdentifier = Symbol.for(
  "@effect-ts/schema/ids/stringIntFromString"
)

export const stringIntFromString: Branded<
  string,
  S.CompositionE<
    | S.NextE<S.RefinementE<S.LeafE<S.InvalidIntegerE>>>
    | S.PrevE<S.LeafE<S.ParseNumberE>>
  >,
  number,
  S.RefinementE<S.LeafE<S.InvalidIntegerE>>,
  string,
  S.ApiSelfType<Int>,
  Int
> = pipe(
  stringNumberFromString[">>>"](intFromNumber),
  brand((_) => _ as Int),
  S.identified(stringIntFromStringIdentifier, {})
)

export const stringIntIdentifier = Symbol.for("@effect-ts/schema/ids/stringInt")

export const stringInt: Branded<
  unknown,
  S.CompositionE<
    | S.PrevE<S.RefinementE<S.LeafE<S.ParseStringE>>>
    | S.NextE<
        S.CompositionE<
          | S.NextE<S.RefinementE<S.LeafE<S.InvalidIntegerE>>>
          | S.PrevE<S.LeafE<S.ParseNumberE>>
        >
      >
  >,
  number,
  S.RefinementE<S.LeafE<S.InvalidIntegerE>>,
  string,
  S.ApiSelfType<Int>,
  Int
> = pipe(
  string[">>>"](stringIntFromString),
  brand((_) => _ as Int),
  S.identified(stringIntIdentifier, {})
)

export const intIdentifier = Symbol.for("@effect-ts/schema/ids/int")

export const int: Branded<
  unknown,
  S.CompositionE<
    | S.NextE<S.RefinementE<S.LeafE<S.InvalidIntegerE>>>
    | S.PrevE<S.RefinementE<S.LeafE<S.ParseNumberE>>>
  >,
  number,
  S.RefinementE<S.LeafE<S.InvalidIntegerE>>,
  number,
  S.ApiSelfType<Int>,
  Int
> = pipe(
  number[">>>"](intFromNumber),
  brand((_) => _ as Int),
  S.identified(intIdentifier, {})
)
