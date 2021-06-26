// tracing: off

import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import * as O from "@effect-ts/core/Option"

import * as S from "../../_schema"
import { hasContinuation, SchemaContinuationSymbol } from "../../_schema"
import * as Th from "../../These"

export type Constructor<Input, Output, ConstructorError> = {
  (u: Input): Th.These<ConstructorError, Output>
}

export const interpreters: ((
  schema: S.SchemaAny
) => O.Option<() => Constructor<unknown, unknown, unknown>>)[] = [
  O.partial(
    (miss) =>
      (schema: S.SchemaAny): (() => Constructor<unknown, unknown, unknown>) => {
        if (schema instanceof S.SchemaNamed) {
          return () => {
            const self = constructorFor(schema.self)
            return (u) => Th.mapError_(self(u), (e) => S.namedE(schema.name, e))
          }
        }
        if (schema instanceof S.SchemaMapConstructorError) {
          return () => {
            const self = constructorFor(schema.self)
            return (u) => Th.mapError_(self(u), schema.mapError)
          }
        }
        if (schema instanceof S.SchemaIdentity) {
          return () => (u) => Th.succeed(u)
        }
        if (schema instanceof S.SchemaConstructor) {
          return () => schema.of
        }
        if (schema instanceof S.SchemaRefinement) {
          return () => {
            const self = constructorFor(schema.self)
            return (u) =>
              Th.chain_(
                self(u)["|>"](
                  Th.mapError((e) => S.compositionE(Chunk.single(S.prevE(e))))
                ),
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
        }
        return miss()
      }
  )
]

const cache = new WeakMap()

function constructorFor<
  ParserInput,
  ParserError extends S.AnyError,
  ParsedShape,
  ConstructorInput,
  ConstructorError extends S.AnyError,
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
  if (schema instanceof S.SchemaLazy) {
    const of_: Constructor<unknown, unknown, unknown> = (__) =>
      constructorFor(schema.self())(__)
    cache.set(schema, of_)
    return of_ as Constructor<ConstructorInput, ParsedShape, ConstructorError>
  }
  for (const interpreter of interpreters) {
    const _ = interpreter(schema)
    if (_._tag === "Some") {
      let x: Constructor<unknown, unknown, unknown>
      const of_: Constructor<unknown, unknown, unknown> = (__) => {
        if (!x) {
          x = _.value()
        }
        return x(__)
      }
      cache.set(schema, of_)
      return of_ as Constructor<ConstructorInput, ParsedShape, ConstructorError>
    }
  }
  if (hasContinuation(schema)) {
    let x: Constructor<unknown, unknown, unknown>
    const of_: Constructor<unknown, unknown, unknown> = (__) => {
      if (!x) {
        x = constructorFor(schema[SchemaContinuationSymbol])
      }
      return x(__)
    }
    return of_ as Constructor<ConstructorInput, ParsedShape, ConstructorError>
  }
  throw new Error(`Missing guard integration for: ${JSON.stringify(schema)}`)
}

export { constructorFor as for }
