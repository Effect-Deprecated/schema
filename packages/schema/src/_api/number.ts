// tracing: off

import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema"
import * as Th from "../These"
import { refinement } from "./refinement"
import { fromString, string } from "./string"

export const fromNumberIdentifier = Symbol.for("@effect-ts/schema/ids/fromNumber")

export const fromNumber: S.Schema<number, never, number, number, never, number, {}> =
  pipe(
    S.identity((u): u is number => typeof u === "number"),
    S.arbitrary((_) => _.double()),
    S.mapApi(() => ({})),
    S.identified(fromNumberIdentifier, {})
  )

export const numberIdentifier = Symbol.for("@effect-ts/schema/ids/number")

export const number: S.Schema<
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
  S.identified(numberIdentifier, {})
)

export const stringNumberIdentifier = Symbol.for("@effect-ts/schema/ids/stringNumber")

export const stringNumberFromString: S.Schema<
  string,
  S.LeafE<S.ParseNumberE>,
  number,
  number,
  never,
  string,
  {}
> = fromString[">>>"](
  pipe(
    number,
    S.encoder((_) => String(_)),
    S.parser((s) =>
      pipe(Number.parseFloat(s), (n) =>
        Number.isNaN(n) ? Th.fail(S.leafE(S.parseNumberE(s))) : Th.succeed(n)
      )
    )
  )
)["|>"](S.mapParserError((e) => Chunk.unsafeHead(e.errors).error))

export const stringNumber: S.Schema<
  unknown,
  S.CompositionE<
    S.PrevE<S.RefinementE<S.LeafE<S.ParseStringE>>> | S.NextE<S.LeafE<S.ParseNumberE>>
  >,
  number,
  number,
  never,
  string,
  {}
> = string[">>>"](stringNumberFromString)
