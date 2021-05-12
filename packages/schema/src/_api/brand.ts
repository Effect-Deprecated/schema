// tracing: off
import type * as MO from "../_schema"
import type { Schema } from "../_schema/schema"
import type { SchemaWithDefaults } from "./withDefaults"
import { withDefaults } from "./withDefaults"

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
  ): SchemaWithDefaults<
    ParserInput,
    ParserError,
    B,
    ConstructorInput,
    ConstructorError,
    Encoded,
    Api
  > => {
    // @ts-expect-error
    return withDefaults(self)
  }
}
