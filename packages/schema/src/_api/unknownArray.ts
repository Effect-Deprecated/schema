// ets_tracing: off

import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema/index.js"
import { unknown } from "./unknown.js"
import type { DefaultSchema } from "./withDefaults.js"
import { withDefaults } from "./withDefaults.js"

export const unknownArrayIdentifier = S.makeAnnotation<{}>()

export const unknownArray: DefaultSchema<
  unknown,
  S.RefinementE<S.LeafE<S.UnknownArrayE>>,
  readonly unknown[],
  unknown,
  S.RefinementE<S.LeafE<S.UnknownArrayE>>,
  readonly unknown[],
  {}
> = pipe(
  unknown,
  S.refine(
    (u): u is readonly unknown[] => Array.isArray(u),
    (val) => S.leafE(S.unknownArrayE(val))
  ),
  S.mapParserError((_) => Chunk.unsafeHead(_.errors).error),
  S.mapConstructorError((_) => Chunk.unsafeHead(_.errors).error),
  S.encoder((_) => _),
  withDefaults,
  S.annotate(unknownArrayIdentifier, {})
)
