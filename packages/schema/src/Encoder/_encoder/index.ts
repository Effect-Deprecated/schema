// tracing: off

import * as O from "@effect-ts/core/Option"

import * as S from "../../_schema"

export type Encoder<Output, Encoded> = {
  (u: Output): Encoded
}

export const interpreters: ((
  schema: S.SchemaAny
) => O.Option<() => Encoder<unknown, unknown>>)[] = [
  O.partial((miss) => (schema: S.SchemaAny): (() => Encoder<unknown, unknown>) => {
    if (schema instanceof S.SchemaIdentity) {
      return () => (_) => _
    }
    if (schema instanceof S.SchemaPipe) {
      const encodeSelf = encoderFor(schema.that)
      const encodeThat = encoderFor(schema.self)

      return () => (_) => encodeThat(encodeSelf(_))
    }
    if (schema instanceof S.SchemaRefinement) {
      return () => encoderFor(schema.self)
    }
    if (schema instanceof S.SchemaEncoder) {
      return () => schema.encoder
    }
    return miss()
  })
]

const cache = new WeakMap()

function encoderFor<
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
): Encoder<ParsedShape, Encoded> {
  if (cache.has(schema)) {
    return cache.get(schema)
  }
  if (schema instanceof S.SchemaLazy) {
    const encoder: Encoder<unknown, unknown> = (__) => encoderFor(schema.self())(__)
    cache.set(schema, encoder)
    return encoder as Encoder<ParsedShape, Encoded>
  }
  for (const interpreter of interpreters) {
    const _ = interpreter(schema)
    if (_._tag === "Some") {
      let x: Encoder<unknown, unknown>
      const encoder: Encoder<unknown, unknown> = (u) => {
        if (!x) {
          x = _.value()
        }
        return x(u)
      }
      cache.set(schema, encoder)
      return encoder as Encoder<ParsedShape, Encoded>
    }
  }
  if (S.hasContinuation(schema)) {
    let x: Encoder<unknown, unknown>
    const encoder: Encoder<unknown, unknown> = (u) => {
      if (!x) {
        x = encoderFor(schema[S.SchemaContinuationSymbol])
      }
      return x(u)
    }
    cache.set(schema, encoder)
    return encoder as Encoder<ParsedShape, Encoded>
  }
  throw new Error(`Missing parser integration for: ${schema.constructor}`)
}

export { encoderFor as for }
