// tracing: off

import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema"
import * as Th from "../These"
import { refinement } from "./refinement"
import type { DefaultSchema } from "./withDefaults"
import { withDefaults } from "./withDefaults"

export const objectIdentifier = S.makeAnnotation<{}>()

export const object: DefaultSchema<unknown, {}, {}, {}, {}> = pipe(
  refinement(
    (u): u is {} => typeof u === "object" && u != null,
    (v) => S.leafE(S.parseObjectE(v))
  ),
  S.constructor((s: {}) => Th.succeed(s)),
  S.arbitrary((_) => _.object()),
  S.encoder((_) => _),
  S.mapApi(() => ({})),
  withDefaults,
  S.annotate(objectIdentifier, {})
)
