// tracing: off

import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema"
import { brand } from "./brand"
import { fromNumber, number, stringNumberFromString } from "./number"
import { string } from "./string"
import type { SchemaWithDefaults } from "./withDefaults"

export interface IntBrand {
  readonly Int: unique symbol
}

export type Int = number & IntBrand

export const intFromNumberIdentifier = Symbol.for("@effect-ts/schema/ids/intFromNumber")

export const intFromNumber: SchemaWithDefaults<
  number,
  S.RefinementE<S.LeafE<S.InvalidIntegerE>>,
  Int,
  number,
  S.RefinementE<S.LeafE<S.InvalidIntegerE>>,
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
  brand<Int>(),
  S.identified(intFromNumberIdentifier, {})
)

export const stringIntFromStringIdentifier = Symbol.for(
  "@effect-ts/schema/ids/stringIntFromString"
)

export const stringIntFromString: SchemaWithDefaults<
  string,
  S.CompositionE<
    | S.NextE<S.RefinementE<S.LeafE<S.InvalidIntegerE>>>
    | S.PrevE<S.LeafE<S.ParseNumberE>>
  >,
  Int,
  number,
  S.RefinementE<S.LeafE<S.InvalidIntegerE>>,
  string,
  S.ApiSelfType<Int>
> = pipe(
  stringNumberFromString[">>>"](intFromNumber),
  brand<Int>(),
  S.identified(stringIntFromStringIdentifier, {})
)

export const stringIntIdentifier = Symbol.for("@effect-ts/schema/ids/stringInt")

export const stringInt: SchemaWithDefaults<
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
  Int,
  number,
  S.RefinementE<S.LeafE<S.InvalidIntegerE>>,
  string,
  S.ApiSelfType<Int>
> = pipe(
  string[">>>"](stringIntFromString),
  brand<Int>(),
  S.identified(stringIntIdentifier, {})
)

export const intIdentifier = Symbol.for("@effect-ts/schema/ids/int")

export const int: SchemaWithDefaults<
  unknown,
  S.CompositionE<
    | S.NextE<S.RefinementE<S.LeafE<S.InvalidIntegerE>>>
    | S.PrevE<S.RefinementE<S.LeafE<S.ParseNumberE>>>
  >,
  Int,
  number,
  S.RefinementE<S.LeafE<S.InvalidIntegerE>>,
  number,
  S.ApiSelfType<Int>
> = pipe(number[">>>"](intFromNumber), brand<Int>(), S.identified(intIdentifier, {}))
