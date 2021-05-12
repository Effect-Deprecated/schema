// tracing: off
import * as MO from "../_schema"
import type { ApiSelfType, Schema } from "../_schema/schema"
import * as Arbitrary from "../Arbitrary"
import * as Constructor from "../Constructor"
import * as Encoder from "../Encoder"
import * as Guard from "../Guard"
import * as Parser from "../Parser"
import { unsafe } from "./condemn"

export interface Branded<
  ParserInput,
  ParserError,
  ConstructorInput,
  ConstructorError extends MO.AnyError,
  Encoded,
  Api,
  B
> extends Schema<
    ParserInput,
    ParserError,
    B,
    ConstructorInput,
    ConstructorError,
    Encoded,
    Api & ApiSelfType<B>
  > {
  (_: ConstructorInput): B

  readonly Parser: Parser.Parser<ParserInput, ParserError, B>

  readonly Constructor: Constructor.Constructor<ConstructorInput, B, ConstructorError>

  readonly Encoder: Encoder.Encoder<B, Encoded>

  readonly Guard: Guard.Guard<B>

  readonly Arbitrary: Arbitrary.Arbitrary<B>

  readonly id: <Meta>(
    identifier: symbol,
    meta: Meta
  ) => Branded<
    ParserInput,
    ParserError,
    ConstructorInput,
    ConstructorError,
    Encoded,
    Api,
    B
  >
}

export function brand<ParsedShape, B extends ParsedShape>(_: (_: ParsedShape) => B) {
  return <
    ParserInput,
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
  ): Branded<
    ParserInput,
    ParserError,
    ConstructorInput,
    ConstructorError,
    Encoded,
    Api,
    B
  > => {
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
        const x = brand(_)(self)
        x["identifier"] = identifier
        x["self"] = self
        x["meta"] = meta
        return x
      }
    })

    // @ts-expect-error
    return schemed
  }
}
