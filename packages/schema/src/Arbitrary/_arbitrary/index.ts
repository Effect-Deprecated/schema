// tracing: off

import * as O from "@effect-ts/core/Option"
import type * as fc from "fast-check"

import * as S from "../../_schema"
import { hasContinuation, SchemaContinuationSymbol } from "../../_schema"

export type Gen<T> = { (_: typeof fc): fc.Arbitrary<T> }

const interpreterCache = new WeakMap()
const interpretedCache = new WeakMap()

export const interpreters: ((schema: S.SchemaAny) => O.Option<Gen<unknown>>)[] = [
  O.partial((miss) => (schema: S.SchemaAny): Gen<unknown> => {
    if (schema instanceof S.SchemaRecursive) {
      if (interpreterCache.has(schema)) {
        return interpreterCache.get(schema)
      }
      const parser = (_: typeof fc) => {
        if (interpretedCache.has(schema)) {
          return interpretedCache.get(schema)
        }
        const e = for_(schema.self(schema))(_)
        interpretedCache.set(schema, e)
        return e
      }
      interpreterCache.set(schema, parser)
      return parser
    }
    if (schema instanceof S.SchemaIdentity) {
      return (_) => _.anything().filter(schema.guard)
    }
    if (schema instanceof S.SchemaArbitrary) {
      return schema.arbitrary
    }
    if (schema instanceof S.SchemaRefinement) {
      const self = for_(schema.self)
      return (_) => self(_).filter(schema.refinement)
    }
    return miss()
  })
]

const cache = new WeakMap()

function for_<
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
): Gen<ParsedShape> {
  if (cache.has(schema)) {
    return cache.get(schema)
  }
  for (const interpreter of interpreters) {
    const _ = interpreter(schema)
    if (_._tag === "Some") {
      cache.set(schema, _.value)
      return _.value as Gen<ParsedShape>
    }
  }
  if (hasContinuation(schema)) {
    const arb = for_(schema[SchemaContinuationSymbol])
    cache.set(schema, arb)
    return arb as Gen<ParsedShape>
  }
  throw new Error(`Missing arbitrary integration for: ${schema.constructor}`)
}

export { for_ as for }
