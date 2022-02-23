// ets_tracing: off

import type { AnyError, Schema } from "../_schema/index.js"
import { SchemaLazy } from "../_schema/index.js"
import type { DefaultSchema } from "./withDefaults.js"
import { withDefaults } from "./withDefaults.js"

export function lazy<
  ParserInput,
  ParserError extends AnyError,
  ParsedShape,
  ConstructorInput,
  ConstructorError extends AnyError,
  Encoded,
  Api
>(
  self: () => Schema<
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
  ParsedShape,
  ConstructorInput,
  ConstructorError,
  Encoded,
  {}
> {
  return withDefaults(new SchemaLazy(self))
}
