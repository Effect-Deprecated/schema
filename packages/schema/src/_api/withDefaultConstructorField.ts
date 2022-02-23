// ets_tracing: off

import type { Lazy } from "@effect-ts/core/Function"
import { pipe } from "@effect-ts/system/Function"

import * as S from "../_schema/index.js"
import * as Constructor from "../Constructor/index.js"
import type { DefaultSchema } from "./withDefaults.js"
import { withDefaults } from "./withDefaults.js"

export type OptionalKey<ConstructorInput, Key extends keyof ConstructorInput> = Omit<
  ConstructorInput,
  Key
> &
  Partial<Pick<ConstructorInput, Key>>

export const withDefaultConstructorFieldIdentifier = S.makeAnnotation<{
  key: PropertyKey
  value: Lazy<unknown>
  self: S.SchemaAny
}>()

export function withDefaultConstructorField<
  ConstructorInput,
  Key extends keyof ConstructorInput
>(
  key: Key,
  value: Lazy<ConstructorInput[Key]>
): <
  ParserInput,
  ParserError extends S.AnyError,
  ParsedShape,
  ConstructorError extends S.AnyError,
  Encoded,
  Api
>(
  self: S.Schema<
    ParserInput,
    ParserError,
    ParsedShape,
    ConstructorInput,
    ConstructorError,
    Encoded,
    Api
  >
) => DefaultSchema<
  ParserInput,
  ParserError,
  ParsedShape,
  OptionalKey<ConstructorInput, Key>,
  ConstructorError,
  Encoded,
  Api
> {
  return (self) => {
    const constructSelf = Constructor.for(self)
    return pipe(
      self,
      S.constructor((u: any) =>
        constructSelf(typeof u[key] !== "undefined" ? u : { ...u, [key]: value() })
      ),
      withDefaults,
      S.annotate(withDefaultConstructorFieldIdentifier, { self, key, value })
    )
  }
}
