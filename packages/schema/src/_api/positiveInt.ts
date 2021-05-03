// tracing: off

import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema"
import type { Int } from "./int"
import { intFromNumber } from "./int"
import { number } from "./number"
import type { Positive, PositiveBrand } from "./positive"
import { positive } from "./positive"

export const positiveIntIdentifier = Symbol.for("@effect-ts/schema/ids/positiveInt")

export const positiveIntFromNumber: S.Schema<
  number,
  S.CompositionE<
    | S.PrevE<S.RefinementE<S.LeafE<S.InvalidIntegerE>>>
    | S.NextE<S.RefinementE<S.LeafE<S.PositiveE>>>
  >,
  Int & PositiveBrand,
  number,
  S.CompositionE<
    | S.PrevE<S.RefinementE<S.LeafE<S.InvalidIntegerE>>>
    | S.NextE<S.RefinementE<S.LeafE<S.PositiveE>>>
  >,
  Int & PositiveBrand,
  number,
  {}
> = pipe(
  intFromNumber,
  positive,
  S.arbitrary((FC) => FC.integer({ min: 1 }).map((_) => _ as Int & Positive)),
  S.identified(positiveIntIdentifier, {})
)

export const positiveInt: S.Schema<
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
  Int & PositiveBrand,
  number,
  S.CompositionE<
    | S.PrevE<S.RefinementE<S.LeafE<S.InvalidIntegerE>>>
    | S.NextE<S.RefinementE<S.LeafE<S.PositiveE>>>
  >,
  Int & PositiveBrand,
  number,
  {}
> = number[">>>"](positiveIntFromNumber)
