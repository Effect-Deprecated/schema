import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema"
import * as Th from "../These"
import { string } from "./string"

export const jsonFromStringIdentifier = Symbol.for(
  "@effect-ts/schema/ids/jsonFromString"
)

export class JsonDecodingE
  extends S.DefaultLeafE<{ readonly actual: string; readonly error: unknown }>
  implements S.Actual<string>
{
  readonly _tag = "NotJsonString"

  get [S.toTreeSymbol](): S.Tree<string> {
    return S.tree(
      `cannot decode JSON from ${this.actual}, expected a valid JSON string`
    )
  }
}

export const jsonString: S.Schema<
  string,
  S.LeafE<JsonDecodingE>,
  unknown,
  unknown,
  never,
  string,
  {}
> = pipe(
  S.identity((u): u is string => typeof u === "string"),
  S.constructor((n) => Th.succeed(n)),
  S.arbitrary((_) => _.anything()),
  S.encoder((_) => JSON.stringify(_)),
  S.parser((p: string) => {
    try {
      return Th.succeed(JSON.parse(p as any))
    } catch (err) {
      return Th.fail(S.leafE(new JsonDecodingE({ actual: p, error: err })))
    }
  }),
  S.identified(jsonFromStringIdentifier, {})
)

export const jsonIdentifier = Symbol.for("@effect-ts/schema/ids/json")

export const json: S.Schema<
  unknown,
  S.CompositionE<
    S.PrevE<S.RefinementE<S.LeafE<S.ParseStringE>>> | S.NextE<S.LeafE<JsonDecodingE>>
  >,
  unknown,
  unknown,
  never,
  string,
  {}
> = pipe(string[">>>"](jsonString), S.identified(jsonIdentifier, {}))
