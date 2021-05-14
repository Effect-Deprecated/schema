// tracing: off

import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema"
import * as Arbitrary from "../Arbitrary"
import * as Encoder from "../Encoder"
import * as Guard from "../Guard"
import * as Th from "../These"
import { chunk } from "./chunk"

export const arrayIdentifier = S.makeAnnotation<{ self: S.SchemaUPI }>()

export function array<Self extends S.SchemaUPI>(
  self: Self
): S.Schema<
  unknown,
  S.CompositionE<
    | S.PrevE<S.RefinementE<S.LeafE<S.UnknownArrayE>>>
    | S.NextE<S.CollectionE<S.OptionalIndexE<number, S.ParserErrorOf<Self>>>>
  >,
  readonly S.ParsedShapeOf<Self>[],
  readonly S.ParsedShapeOf<Self>[],
  never,
  readonly S.EncodedOf<Self>[],
  {}
> {
  const guardSelf = Guard.for(self)
  const arbitrarySelf = Arbitrary.for(self)
  const encodeSelf = Encoder.for(self)

  const fromChunk = pipe(
    S.identity(
      (u): u is readonly S.ParsedShapeOf<Self>[] =>
        Array.isArray(u) && u.every(guardSelf)
    ),
    S.parser((u: Chunk.Chunk<S.ParsedShapeOf<Self>>) => Th.succeed(Chunk.toArray(u))),
    S.encoder((u): Chunk.Chunk<S.ParsedShapeOf<Self>> => Chunk.from(u)),
    S.arbitrary((_) => _.array(arbitrarySelf(_)))
  )

  return pipe(
    chunk(self)[">>>"](fromChunk),
    S.mapParserError((_) => Chunk.unsafeHead(_.errors).error),
    S.constructor((_: readonly S.ParsedShapeOf<Self>[]) => Th.succeed(_)),
    S.encoder((u) => u.map(encodeSelf)),
    S.annotate(arrayIdentifier, { self })
  )
}
