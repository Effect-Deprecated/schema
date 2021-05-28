// tracing: off

import * as E from "@effect-ts/core/Either"
import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema"
import { makeAnnotation } from "../_schema"
import * as Arbitrary from "../Arbitrary"
import * as Encoder from "../Encoder"
import * as Guard from "../Guard"
import * as Parser from "../Parser"
import * as Th from "../These"
import { object } from "./object"
import type { DefaultSchema } from "./withDefaults"
import { withDefaults } from "./withDefaults"

export const fromEitherIdentifier =
  makeAnnotation<{ left: S.SchemaAny; right: S.SchemaAny }>()

export function fromEither<
  LeftParserInput,
  LeftParserError extends S.AnyError,
  LeftParsedShape,
  LeftConstructorInput,
  LeftConstructorError extends S.AnyError,
  LeftEncoded,
  LeftApi,
  ParserInput,
  ParserError extends S.AnyError,
  ParsedShape,
  ConstructorInput,
  ConstructorError extends S.AnyError,
  Encoded,
  Api
>(
  left: S.Schema<
    LeftParserInput,
    LeftParserError,
    LeftParsedShape,
    LeftConstructorInput,
    LeftConstructorError,
    LeftEncoded,
    LeftApi
  >,
  right: S.Schema<
    ParserInput,
    ParserError,
    ParsedShape,
    ConstructorInput,
    ConstructorError,
    Encoded,
    Api
  >
): DefaultSchema<
  object,
  LeftParserError | ParserError, // TODO
  E.Either<LeftParsedShape, ParsedShape>,
  object,
  LeftParserError | ParserError, // TODO
  E.Either<LeftEncoded, Encoded>,
  { left: LeftApi; right: Api }
> {
  const leftGuard = Guard.for(left)
  const leftArb = Arbitrary.for(left)
  const leftParse = Parser.for(left)
  const leftEncode = Encoder.for(left)

  const guard = Guard.for(right)
  const arb = Arbitrary.for(right)
  const parse = Parser.for(right)
  const encode = Encoder.for(right)

  const refinement = (_: unknown): _ is E.Either<LeftParsedShape, ParsedShape> => {
    const ei = _ as E.Either<any, any>
    return (
      typeof _ === "object" &&
      _ != null &&
      ((E.isLeft(ei) && leftGuard(ei.left)) || (E.isRight(ei) && guard(ei.right)))
    )
  }

  const parseEither = (i: object) => {
    const ei = i as E.Either<any, any>
    if (E.isLeft(ei)) {
      return leftParse(ei.left)
    }
    if (E.isRight(ei)) {
      return parse(ei.right)
    }
    return Th.fail(S.parseObjectE("not an either"))
  }

  return pipe(
    S.identity(refinement),
    S.arbitrary((_) => _.oneof(leftArb(_).map(E.left), arb(_).map(E.right)) as any),
    S.parser(parseEither),
    S.constructor(parseEither),
    S.encoder((_) => E.bimap_(_, leftEncode, encode)),
    S.mapApi(() => ({ left: left.Api, right: right.Api })),
    withDefaults,
    S.annotate(fromEitherIdentifier, { left, right })
  )
}

export const eitherIdentifier =
  makeAnnotation<{ left: S.SchemaAny; right: S.SchemaAny }>()

export function either<
  LeftParserError extends S.AnyError,
  LeftParsedShape,
  LeftConstructorInput,
  LeftConstructorError extends S.AnyError,
  LeftEncoded,
  LeftApi,
  ParserError extends S.AnyError,
  ParsedShape,
  ConstructorInput,
  ConstructorError extends S.AnyError,
  Encoded,
  Api
>(
  left: S.Schema<
    unknown,
    LeftParserError,
    LeftParsedShape,
    LeftConstructorInput,
    LeftConstructorError,
    LeftEncoded,
    LeftApi
  >,
  right: S.Schema<
    unknown,
    ParserError,
    ParsedShape,
    ConstructorInput,
    ConstructorError,
    Encoded,
    Api
  >
): DefaultSchema<
  unknown,
  S.CompositionE<
    | S.PrevE<S.RefinementE<S.LeafE<S.ParseObjectE>>>
    | S.NextE<LeftParserError | ParserError>
  >,
  E.Either<LeftParsedShape, ParsedShape>,
  object,
  S.LeafE<S.UnknownArrayE>,
  E.Either<LeftEncoded, Encoded>,
  { left: LeftApi; right: Api }
> {
  const encodeLeft = Encoder.for(left)
  const encodeSelf = Encoder.for(right)
  return pipe(
    object[">>>"](fromEither(left, right)),
    S.encoder((_) => E.bimap_(_, encodeLeft, encodeSelf)),
    withDefaults,
    S.annotate(eitherIdentifier, { left, right })
  )
}
