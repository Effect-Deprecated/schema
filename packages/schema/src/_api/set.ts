// ets_tracing: off

// tracing: off

import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import {
  every_,
  fromArray,
  Set,
  toArray
} from "@effect-ts/core/Collections/Immutable/Set"
import type * as Eq from "@effect-ts/core/Equal"
import { pipe } from "@effect-ts/core/Function"
import * as Ord from "@effect-ts/core/Ord"

import * as S from "../_schema/index.js"
import * as Arbitrary from "../Arbitrary/index.js"
import * as Encoder from "../Encoder/index.js"
import * as Guard from "../Guard/index.js"
import * as Th from "../These/index.js"
import { chunk } from "./chunk.js"
import type { DefaultSchema } from "./withDefaults.js"
import { withDefaults } from "./withDefaults.js"

export const setIdentifier = S.makeAnnotation<{ self: S.SchemaUPI }>()

export function set<
  ParserError extends S.AnyError,
  ParsedShape,
  ConstructorInput,
  ConstructorError extends S.AnyError,
  Encoded,
  Api
>(
  self: S.Schema<
    unknown,
    ParserError,
    ParsedShape,
    ConstructorInput,
    ConstructorError,
    Encoded,
    Api
  >,
  ord: Ord.Ord<ParsedShape>,
  eq?: Eq.Equal<ParsedShape>
): DefaultSchema<
  unknown,
  S.CompositionE<
    | S.PrevE<S.RefinementE<S.LeafE<S.UnknownArrayE>>>
    | S.NextE<S.CollectionE<S.OptionalIndexE<number, ParserError>>>
  >,
  Set<ParsedShape>,
  Set<ParsedShape>,
  never,
  readonly Encoded[],
  { self: Api; eq: Eq.Equal<ParsedShape>; ord: Ord.Ord<ParsedShape> }
> {
  const refinement = (_: unknown): _ is Set<ParsedShape> =>
    _ instanceof Set && every_(_, guardSelf)

  const guardSelf = Guard.for(self)
  const arbitrarySelf = Arbitrary.for(self)
  const encodeSelf = Encoder.for(self)

  const eq_ = eq ?? Ord.getEqual(ord)

  const fromArray_ = fromArray(eq_)
  const toArray_ = toArray(ord)

  const fromChunk = pipe(
    S.identity(refinement),
    S.parser((u: Chunk.Chunk<ParsedShape>) => Th.succeed(fromArray_(Chunk.toArray(u)))),
    S.encoder((u): Chunk.Chunk<ParsedShape> => Chunk.from(u)),
    S.arbitrary((_) => _.set(arbitrarySelf(_)).map(fromArray_))
  )

  return pipe(
    chunk(self)[">>>"](fromChunk),
    S.mapParserError((_) => Chunk.unsafeHead(_.errors).error),
    S.constructor((_: Set<ParsedShape>) => Th.succeed(_)),
    S.encoder((u) => toArray_(u).map(encodeSelf)),
    S.mapApi(() => ({ self: self.Api, eq: eq_, ord })),
    withDefaults,
    S.annotate(setIdentifier, { self })
  )
}
