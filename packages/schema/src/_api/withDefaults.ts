import * as MO from "../_schema"
import type { Schema } from "../_schema/schema"
import * as Arbitrary from "../Arbitrary"
import * as Constructor from "../Constructor"
import * as Encoder from "../Encoder"
import * as Guard from "../Guard"
import * as Parser from "../Parser"
import { unsafe } from "./condemn"

export interface SchemaWithDefaults<
  ParserInput,
  ParserError,
  ParsedShape,
  ConstructorInput,
  ConstructorError extends MO.AnyError,
  Encoded,
  Api
> extends Schema<
    ParserInput,
    ParserError,
    ParsedShape,
    ConstructorInput,
    ConstructorError,
    Encoded,
    Api
  > {
  (_: ConstructorInput): ParsedShape

  readonly Parser: Parser.Parser<ParserInput, ParserError, ParsedShape>

  readonly Constructor: Constructor.Constructor<
    ConstructorInput,
    ParsedShape,
    ConstructorError
  >

  readonly Encoder: Encoder.Encoder<ParsedShape, Encoded>

  readonly Guard: Guard.Guard<ParsedShape>

  readonly Arbitrary: Arbitrary.Arbitrary<ParsedShape>

  readonly id: <Meta>(
    identifier: symbol,
    meta: Meta
  ) => SchemaWithDefaults<
    ParserInput,
    ParserError,
    ParsedShape,
    ConstructorInput,
    ConstructorError,
    Encoded,
    Api
  >
}

export function withDefaults<
  ParserInput,
  ParsedShape,
  ParserError,
  ConstructorInput,
  ConstructorError extends MO.AnyError,
  Encoded,
  Api
>(
  self: Schema<
    ParserInput,
    ParserError,
    ParsedShape,
    ConstructorInput,
    ConstructorError,
    Encoded,
    Api
  >
): SchemaWithDefaults<
  ParserInput,
  ParserError,
  ParsedShape,
  ConstructorInput,
  ConstructorError,
  Encoded,
  Api
> {
  const of_ = Constructor.for(self)["|>"](unsafe)

  function schemed(_: ConstructorInput) {
    return of_(_)
  }

  Object.defineProperty(schemed, MO.SchemaContinuationSymbol, {
    value: self
  })

  Object.defineProperty(schemed, "Api", {
    value: self.Api
  })

  Object.defineProperty(schemed, ">>>", {
    value: self[">>>"]
  })

  Object.defineProperty(schemed, "Parser", {
    value: Parser.for(self)
  })

  Object.defineProperty(schemed, "Constructor", {
    value: Constructor.for(self)
  })

  Object.defineProperty(schemed, "Encoder", {
    value: Encoder.for(self)
  })

  Object.defineProperty(schemed, "Guard", {
    value: Guard.for(self)
  })

  Object.defineProperty(schemed, "Arbitrary", {
    value: Arbitrary.for(self)
  })

  Object.defineProperty(schemed, "id", {
    value: <Meta>(identifier: symbol, meta: Meta) => {
      const x = withDefaults(self)
      x["identifier"] = identifier
      x["self"] = self
      x["meta"] = meta
      return x
    }
  })

  // @ts-expect-error
  return schemed
}
