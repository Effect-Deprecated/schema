import { pipe } from "@effect-ts/core/Function"

import type { ParsedShapeOf } from "../_schema"
import * as S from "../_schema"
import * as Constructor from "../Constructor"
import type * as Encoder from "../Encoder"
import type * as Parser from "../Parser"

export function composeParser_<Self extends S.SchemaAny, That extends S.SchemaAny, E>(
  self: Self,
  that: That,
  parser: Parser.Parser<S.ParsedShapeOf<Self>, E, ParsedShapeOf<That>>,
  encoder: Encoder.Encoder<S.ParsedShapeOf<That>, S.EncodedOf<Self>>
): S.Schema<
  S.ParserInputOf<Self>,
  S.CompositionE<S.PrevE<S.ParserErrorOf<Self>> | S.NextE<E>>,
  S.ParsedShapeOf<That>,
  S.ConstructorInputOf<That>,
  S.ConstructorErrorOf<That>,
  S.ConstructedShapeOf<That>,
  S.EncodedOf<Self>,
  { Self: S.ApiOf<Self>; That: S.ApiOf<That> }
> {
  return pipe(
    self,
    S.compose(pipe(that, S.parser(parser), S.constructor(parser))),
    S.constructor(Constructor.for(that)),
    S.encoder(encoder),
    S.mapApi(() => ({ Self: self.Api, That: that.Api }))
  )
}

export function composeParser<Self extends S.SchemaAny, That extends S.SchemaAny, E>(
  that: That,
  parser: Parser.Parser<S.ParsedShapeOf<Self>, E, ParsedShapeOf<That>>,
  encoder: Encoder.Encoder<S.ParsedShapeOf<That>, S.EncodedOf<Self>>
): (
  self: Self
) => S.Schema<
  S.ParserInputOf<Self>,
  S.CompositionE<S.PrevE<S.ParserErrorOf<Self>> | S.NextE<E>>,
  S.ParsedShapeOf<That>,
  S.ConstructorInputOf<That>,
  S.ConstructorErrorOf<That>,
  S.ConstructedShapeOf<That>,
  S.EncodedOf<Self>,
  { Self: S.ApiOf<Self>; That: S.ApiOf<That> }
> {
  return (self) => composeParser_(self, that, parser, encoder)
}
