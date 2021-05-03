// tracing: off

import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema"
import * as Th from "../These"
import { refinement } from "./refinement"
import { string } from "./string"

export const numberIdentifier = Symbol.for("@effect-ts/schema/ids/number")
export const unknownNumberIdentifier = Symbol.for("@effect-ts/schema/ids/unknownNumber")
export const stringNumberIdentifier = Symbol.for("@effect-ts/schema/ids/stringNumber")

export const number: S.Schema<
  number,
  never,
  number,
  number,
  never,
  number,
  number,
  {}
> = pipe(
  S.identity((u): u is number => typeof u === "number"),
  S.arbitrary((_) => _.double()),
  S.mapApi(() => ({})),
  S.identified(numberIdentifier, {})
)

export const unknownNumber: S.Schema<
  unknown,
  S.RefinementE<S.LeafE<S.ParseNumberE>>,
  number,
  number,
  never,
  number,
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
  S.identified(unknownNumberIdentifier, {})
)

export const stringNumber: S.Schema<
  unknown,
  S.CompositionE<
    S.PrevE<S.RefinementE<S.LeafE<S.ParseStringE>>> | S.NextE<S.LeafE<S.ParseNumberE>>
  >,
  number,
  number,
  never,
  number,
  string,
  {}
> = string[">>>"](
  pipe(
    unknownNumber,
    S.encoder((_) => String()),
    S.parser((s) =>
      pipe(Number.parseFloat(s), (n) =>
        Number.isNaN(n) ? Th.fail(S.leafE(S.parseNumberE(s))) : Th.succeed(n)
      )
    )
  )
)["|>"](S.mapApi(() => ({})))
