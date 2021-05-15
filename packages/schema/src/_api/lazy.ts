import type { AnyError, Schema } from "../_schema"
import { SchemaLazy } from "../_schema"
import type { DefaultSchema } from "./withDefaults"
import { withDefaults } from "./withDefaults"

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
