// tracing: off

import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import { pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"

import * as S from "../../_schema"
import { hasContinuation, SchemaContinuationSymbol } from "../../_schema"
import * as Th from "../../These"

export type Constructor<Input, Output, ConstructorError> = {
  (u: Input): Th.These<ConstructorError, Output>
}

const interpreterCache = new WeakMap()
const interpretedCache = new WeakMap()

export const interpreters: ((
  schema: S.SchemaAny
) => O.Option<Constructor<unknown, unknown, unknown>>)[] = [
  O.partial((miss) => (schema: S.SchemaAny): Constructor<unknown, unknown, unknown> => {
    if (schema instanceof S.SchemaRecursive) {
      if (interpreterCache.has(schema)) {
        return interpreterCache.get(schema)
      }
      const parser = (u: unknown) => {
        if (interpretedCache.has(schema)) {
          return interpretedCache.get(schema)(u)
        }
        const e = constructorFor(schema.self(schema))
        interpretedCache.set(schema, e)
        return e(u)
      }
      interpreterCache.set(schema, parser)
      return parser
    }
    if (schema instanceof S.SchemaNamed) {
      const self = constructorFor(schema.self)
      return (u) => Th.mapError_(self(u), (e) => S.namedE(schema.name, e))
    }
    if (schema instanceof S.SchemaMapConstructorError) {
      const self = constructorFor(schema.self)
      return (u) => Th.mapError_(self(u), schema.mapError)
    }
    if (schema instanceof S.SchemaIdentity) {
      return (u) => Th.succeed(u)
    }
    if (schema instanceof S.SchemaCompose) {
      const self = constructorFor(schema.self)
      const that = constructorFor(schema.that)
      return (u) =>
        Th.chain_(
          self(u)["|>"](Th.mapError((e) => S.compositionE(Chunk.single(S.prevE(e))))),
          (a, w) =>
            that(a)["|>"](
              Th.foldM(
                (a) => (w._tag === "Some" ? Th.warn(a, w.value) : Th.succeed(a)),
                (a, e) =>
                  w._tag === "Some"
                    ? Th.warn(
                        a,
                        S.compositionE(Chunk.append_(w.value.errors, S.nextE(e)))
                      )
                    : Th.warn(a, e),
                (e) =>
                  w._tag === "None"
                    ? Th.fail(S.compositionE(Chunk.single(S.nextE(e))))
                    : Th.fail(S.compositionE(Chunk.append_(w.value.errors, S.nextE(e))))
              )
            )
        )
    }
    if (schema instanceof S.SchemaConstructor) {
      return schema.of
    }
    if (schema instanceof S.SchemaRefinement) {
      const self = constructorFor(schema.self)
      return (u) =>
        Th.chain_(
          self(u)["|>"](Th.mapError((e) => S.compositionE(Chunk.single(S.prevE(e))))),
          (
            a,
            w
          ): Th.These<
            S.CompositionE<S.PrevE<unknown> | S.NextE<S.RefinementE<unknown>>>,
            unknown
          > =>
            schema.refinement(a)
              ? w._tag === "Some"
                ? Th.warn(a, w.value)
                : Th.succeed(a)
              : Th.fail(
                  S.compositionE(
                    w._tag === "None"
                      ? Chunk.single(S.nextE(S.refinementE(schema.error(a))))
                      : Chunk.append_(
                          w.value.errors,
                          S.nextE(S.refinementE(schema.error(a)))
                        )
                  )
                )
        )
    }
    return miss()
  })
]

const cache = new WeakMap()

function constructorFor<
  ParserInput,
  ParserError,
  ParsedShape,
  ConstructorInput,
  ConstructorError,
  ConstructedShape extends ParsedShape,
  Encoded,
  Api
>(
  schema: S.Schema<
    ParserInput,
    ParserError,
    ParsedShape,
    ConstructorInput,
    ConstructorError,
    ConstructedShape,
    Encoded,
    Api
  >
): Constructor<ConstructorInput, ConstructedShape, ConstructorError> {
  if (cache.has(schema)) {
    return cache.get(schema)
  }
  for (const interpreter of interpreters) {
    const _ = interpreter(schema)
    if (_._tag === "Some") {
      cache.set(schema, _.value)
      return _.value as Constructor<
        ConstructorInput,
        ConstructedShape,
        ConstructorError
      >
    }
  }
  if (hasContinuation(schema)) {
    const of_ = constructorFor(schema[SchemaContinuationSymbol])
    cache.set(schema, of_)
    return of_ as Constructor<ConstructorInput, ConstructedShape, ConstructorError>
  }
  throw new Error(`Missing guard integration for: ${JSON.stringify(schema)}`)
}

export { constructorFor as for }

/**
 * Turns the Constructor to Builder pattern: Expecting the A types.
 * useful on Record types.
 *
 * NOTE: Be sure to use this as high up as possible, as it will overwrite other compositions.
 */
export const asBuilder: <
  ParserInput,
  ParserError,
  ParsedShape,
  ConstructorInput,
  ConstructorError,
  ConstructedShape extends ParsedShape,
  Encoded,
  Api
>(
  self: S.Schema<
    ParserInput,
    ParserError,
    ParsedShape,
    ConstructorInput,
    ConstructorError,
    ConstructedShape,
    Encoded,
    Api
  >
) => S.Schema<
  ParserInput,
  ParserError,
  ParsedShape,
  ParsedShape, // ConstructorInput
  ConstructorError,
  ConstructedShape,
  Encoded,
  Api
> = (self) =>
  pipe(
    self,
    S.constructor((u) => Th.succeed(u as any))
  )
