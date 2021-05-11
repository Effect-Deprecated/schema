// tracing: off

import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
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
  Encoded,
  Api
>(
  schema: S.Schema<
    ParserInput,
    ParserError,
    ParsedShape,
    ConstructorInput,
    ConstructorError,
    Encoded,
    Api
  >
): Constructor<ConstructorInput, ParsedShape, ConstructorError> {
  if (cache.has(schema)) {
    return cache.get(schema)
  }
  for (const interpreter of interpreters) {
    const _ = interpreter(schema)
    if (_._tag === "Some") {
      cache.set(schema, _.value)
      return _.value as Constructor<ConstructorInput, ParsedShape, ConstructorError>
    }
  }
  if (hasContinuation(schema)) {
    const of_ = constructorFor(schema[SchemaContinuationSymbol])
    cache.set(schema, of_)
    return of_ as Constructor<ConstructorInput, ParsedShape, ConstructorError>
  }
  throw new Error(`Missing guard integration for: ${JSON.stringify(schema)}`)
}

export { constructorFor as for }
