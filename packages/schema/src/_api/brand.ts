// ets_tracing: off
import type * as MO from "../_schema/index.js"
import type { ApiSelfType, Schema } from "../_schema/schema.js"
import type { DefaultSchema } from "./withDefaults.js"
import { withDefaults } from "./withDefaults.js"

export function brand<B>() {
  return <
    ParserInput,
    ParserError extends MO.AnyError,
    ParsedShape,
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
  ): DefaultSchema<
    ParserInput,
    ParserError,
    B,
    ConstructorInput,
    ConstructorError,
    Encoded,
    Api & ApiSelfType<B>
  > => {
    // @ts-expect-error
    return withDefaults(self)
  }
}
