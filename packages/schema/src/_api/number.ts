// ets_tracing: off

import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema/index.js"
import * as Th from "../These/index.js"
import { refinement } from "./refinement.js"
import { fromString, string } from "./string.js"
import type { DefaultSchema } from "./withDefaults.js"
import { withDefaults } from "./withDefaults.js"

export const fromNumberIdentifier = S.makeAnnotation<{}>()

export const fromNumber: DefaultSchema<
  number,
  never,
  number,
  number,
  never,
  number,
  {}
> = pipe(
  S.identity((u): u is number => typeof u === "number"),
  S.arbitrary((_) => _.double()),
  S.mapApi(() => ({})),
  withDefaults,
  S.annotate(fromNumberIdentifier, {})
)

export const numberIdentifier = S.makeAnnotation<{}>()

export const number: DefaultSchema<
  unknown,
  S.RefinementE<S.LeafE<S.ParseNumberE>>,
  number,
  number,
  never,
  number,
  {}
> = pipe(
  refinement(
    (u): u is number => typeof u === "number",
    (v) => S.leafE(S.parseNumberE(v))
  ),
  S.arbitrary((_) => _.double()),
  S.constructor((n: number) => Th.succeed(n)),
  S.encoder((_) => _),
  S.mapApi(() => ({})),
  withDefaults,
  S.annotate(numberIdentifier, {})
)

export const stringNumberFromStringIdentifier = S.makeAnnotation<{}>()

export const stringNumberFromString: DefaultSchema<
  string,
  S.LeafE<S.ParseNumberE>,
  number,
  number,
  never,
  string,
  {}
> = pipe(
  fromString[">>>"](
    pipe(
      number,
      S.encoder((_) => String(_)),
      S.parser((s) =>
        pipe(Number.parseFloat(s), (n) =>
          Number.isNaN(n) ? Th.fail(S.leafE(S.parseNumberE(s))) : Th.succeed(n)
        )
      )
    )
  ),
  S.mapParserError((e) => Chunk.unsafeHead(e.errors).error),
  withDefaults,
  S.annotate(stringNumberFromStringIdentifier, {})
)

export const stringNumberIdentifier = S.makeAnnotation<{}>()

export const stringNumber: DefaultSchema<
  unknown,
  S.CompositionE<
    S.PrevE<S.RefinementE<S.LeafE<S.ParseStringE>>> | S.NextE<S.LeafE<S.ParseNumberE>>
  >,
  number,
  number,
  never,
  string,
  {}
> = pipe(
  string[">>>"](stringNumberFromString),
  withDefaults,
  S.annotate(stringNumberIdentifier, {})
)
