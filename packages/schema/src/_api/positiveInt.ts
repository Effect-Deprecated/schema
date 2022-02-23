// ets_tracing: off

import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema/index.js"
import { brand } from "./brand.js"
import type { Int } from "./int.js"
import { intFromNumber } from "./int.js"
import { number } from "./number.js"
import type { Positive } from "./positive.js"
import { positive } from "./positive.js"
import type { DefaultSchema } from "./withDefaults.js"

export const positiveIntFromNumberIdentifier = S.makeAnnotation<{}>()

export const positiveIntFromNumber: DefaultSchema<
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
  S.annotate(positiveIntFromNumberIdentifier, {})
)

export const positiveIntIdentifier = S.makeAnnotation<{}>()

export const positiveInt: DefaultSchema<
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
  S.annotate(positiveIntIdentifier, {})
)
