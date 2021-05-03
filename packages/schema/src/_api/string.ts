// tracing: off

import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema"
import * as Th from "../These"
import { refinement } from "./refinement"

export const unknownStringIdentifier = Symbol.for("@effect-ts/schema/ids/unknownString")
export const stringIdentifier = Symbol.for("@effect-ts/schema/ids/string")

export const unknownString: S.Schema<
  unknown,
  S.RefinementE<S.LeafE<S.ParseStringE>>,
  string,
  string,
  never,
  string,
  string,
  {}
> = pipe(
  refinement(
    (u): u is string => typeof u === "string",
    (v) => S.leafE(S.parseStringE(v))
  ),
  S.constructor((s: string) => Th.succeed(s)),
  S.arbitrary((_) => _.string()),
  S.encoder((s) => s),
  S.mapApi(() => ({})),
  S.identified(unknownStringIdentifier, {})
)

export const string: S.Schema<
  string,
  never,
  string,
  string,
  never,
  string,
  string,
  {}
> = pipe(
  S.identity((u): u is string => typeof u === "string"),
  S.arbitrary((_) => _.string()),
  S.mapApi(() => ({})),
  S.identified(stringIdentifier, {})
)
