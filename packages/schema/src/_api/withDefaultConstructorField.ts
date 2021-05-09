import type { Lazy } from "@effect-ts/core/Function"
import { pipe } from "@effect-ts/system/Function"

import * as S from "../_schema"
import * as Constructor from "../Constructor"

export type OptionalKey<ConstructorInput, Key extends keyof ConstructorInput> = {
  [K in Exclude<keyof ConstructorInput, Key>]: ConstructorInput[K]
} &
  {
    [K in Key]?: ConstructorInput[Key]
  }

export function withDefaultConstructorField<
  ConstructorInput,
  Key extends keyof ConstructorInput
>(
  key: Key,
  value: Lazy<ConstructorInput[Key]>
): <
  ParserInput,
  ParserError,
  ParsedShape,
  ConstructorError,
  ConstructedShape extends ParsedShape,
  Encoded,
  Api
>(
  self: S.Schema<
    ParserInput,
    ParserError,
    ParsedShape,
    ConstructorInput,
    ConstructorError,
    ConstructedShape,
    Encoded,
    Api
  >
) => S.Schema<
  ParserInput,
  ParserError,
  ParsedShape,
  OptionalKey<ConstructorInput, Key>,
  ConstructorError,
  ConstructedShape,
  Encoded,
  Api
> {
  return (self) => {
    const constructSelf = Constructor.for(self)
    return pipe(
      self,
      S.constructor((u: any) =>
        constructSelf(typeof u[key] !== "undefined" ? u : { ...u, [key]: value() })
      )
    )
  }
}

export function withDefaultConstructorFields<
  ConstructorInput,
  Changes extends {
    [P in keyof ConstructorInput]?: Lazy<ConstructorInput[P]>
  }
>(kvs: Changes) {
  return <
    ParserInput,
    ParserError,
    ParsedShape,
    ConstructorError,
    ConstructedShape extends ParsedShape,
    Encoded,
    Api
  >(
    self: S.Schema<
      ParserInput,
      ParserError,
      ParsedShape,
      ConstructorInput,
      ConstructorError,
      ConstructedShape,
      Encoded,
      Api
    >
  ): S.Schema<
    ParserInput,
    ParserError,
    ParsedShape,
    OptionalKey<ConstructorInput, keyof Changes & keyof ConstructorInput>,
    ConstructorError,
    ConstructedShape,
    Encoded,
    Api
  > => {
    const constructSelf = Constructor.for(self)
    return pipe(
      self,
      S.constructor((u: any) =>
        constructSelf({
          ...u,
          ...Object.keys(kvs).reduce((prev, cur) => {
            if (typeof u[cur] === "undefined") {
              prev[cur] = kvs[cur]()
            }
            return prev
          }, {} as any)
        } as any)
      )
    )
  }
}
