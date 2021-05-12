// tracing: off

import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema"
import { brand } from "./brand"
import type { Int } from "./int"
import { intFromNumber } from "./int"
import { number } from "./number"
import type { Positive } from "./positive"
import { positive } from "./positive"
import type { SchemaWithDefaults } from "./withDefaults"

export const positiveIntFromNumberIdentifier = Symbol.for(
  "@effect-ts/schema/ids/positiveIntFromNumber"
)

export const positiveIntFromNumber: SchemaWithDefaults<
  number,
  S.CompositionE<
    | S.PrevE<S.RefinementE<S.LeafE<S.InvalidIntegerE>>>
    | S.NextE<S.RefinementE<S.LeafE<S.PositiveE>>>
  >,
  Int & Positive,
  number,
  S.CompositionE<
    | S.PrevE<S.RefinementE<S.LeafE<S.InvalidIntegerE>>>
    | S.NextE<S.RefinementE<S.LeafE<S.PositiveE>>>
  >,
  number,
  S.ApiSelfType<Int & Positive>
> = pipe(
  intFromNumber,
  positive,
  S.arbitrary((FC) => FC.integer({ min: 1 }).map((_) => _ as Int & Positive)),
  brand<Int & Positive>(),
  S.identified(positiveIntFromNumberIdentifier, {})
)

export const positiveIntIdentifier = Symbol.for("@effect-ts/schema/ids/positiveInt")

export const positiveInt: SchemaWithDefaults<
  unknown,
  S.CompositionE<
    | S.PrevE<S.RefinementE<S.LeafE<S.ParseNumberE>>>
    | S.NextE<
        S.CompositionE<
          | S.PrevE<S.RefinementE<S.LeafE<S.InvalidIntegerE>>>
          | S.NextE<S.RefinementE<S.LeafE<S.PositiveE>>>
        >
      >
  >,
  Int & Positive,
  number,
  S.CompositionE<
    | S.PrevE<S.RefinementE<S.LeafE<S.InvalidIntegerE>>>
    | S.NextE<S.RefinementE<S.LeafE<S.PositiveE>>>
  >,
  number,
  S.ApiSelfType<Int & Positive>
> = pipe(
  number[">>>"](positiveIntFromNumber),
  brand<Int & Positive>(),
  S.identified(positiveIntIdentifier, {})
)
