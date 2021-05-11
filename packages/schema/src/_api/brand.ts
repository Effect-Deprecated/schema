// tracing: off

import type { ApiSelfType, Schema } from "../_schema/schema"

export function brand<ParsedShape, B extends ParsedShape>(_: (_: ParsedShape) => B) {
  return <ParserInput, ParserError, ConstructorInput, ConstructorError, Encoded, Api>(
    self: Schema<
      ParserInput,
      ParserError,
      ParsedShape,
      ConstructorInput,
      ConstructorError,
      Encoded,
      Api
    >
  ): Schema<
    ParserInput,
    ParserError,
    B,
    ConstructorInput,
    ConstructorError,
    Encoded,
    Api & ApiSelfType<B>
  > => self as any
}
