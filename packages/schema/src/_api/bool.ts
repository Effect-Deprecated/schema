import { pipe } from "@effect-ts/core/Function"

import type { ParseBoolE } from "../_schema"
import * as S from "../_schema"
import { parseBoolE } from "../_schema"
import * as Th from "../These"
import { refinement } from "./refinement"

export const boolIdentifier = Symbol.for("@effect-ts/schema/ids/bool")

export const bool: S.Schema<
  unknown,
  S.RefinementE<S.LeafE<ParseBoolE>>,
  boolean,
  boolean,
  never,
  boolean,
  {}
> = pipe(
  refinement(
    (u): u is boolean => typeof u === "boolean",
    (v) => S.leafE(parseBoolE(v))
  ),
  S.constructor((s: boolean) => Th.succeed(s)),
  S.arbitrary((_) => _.boolean()),
  S.encoder((s) => s),
  S.mapApi(() => ({})),
  S.identified(boolIdentifier, {})
)
