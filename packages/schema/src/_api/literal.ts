// tracing: off

import { pipe } from "@effect-ts/core/Function"

import type { ApiSelfType } from "../_schema"
import * as S from "../_schema"
import * as Th from "../These"
import { brand } from "./brand"
import { refinement } from "./refinement"
import type { SchemaWithDefaults } from "./withDefaults"

export interface LiteralApi<KS extends readonly string[]> extends ApiSelfType {
  readonly matchS: <A>(
    _: {
      [K in KS[number]]: (_: K) => A
    }
  ) => (ks: S.GetApiSelfType<this, KS[number]>) => A
  readonly matchW: <
    M extends {
      [K in KS[number]]: (_: K) => any
    }
  >(
    _: M
  ) => (ks: S.GetApiSelfType<this, KS[number]>) => {
    [K in keyof M]: ReturnType<M[K]>
  }[keyof M]
}

export const literalIdentifier = Symbol.for("@effect-ts/schema/ids/literal")

export function literal<KS extends readonly string[]>(
  ...literals: KS
): SchemaWithDefaults<
  unknown,
  S.RefinementE<S.LeafE<S.LiteralE<KS>>>,
  KS[number],
  KS[number],
  never,
  string,
  LiteralApi<KS>
> {
  const ko = {}
  for (const k of literals) {
    ko[k] = true
  }
  return pipe(
    refinement(
      (u): u is KS[number] => typeof u === "string" && u in ko,
      (actual) => S.leafE(S.literalE(literals, actual))
    ),
    S.constructor((s: KS[number]) => Th.succeed(s)),
    S.arbitrary((_) => _.oneof(...literals.map((k) => _.constant(k)))),
    S.encoder((_) => _ as string),
    S.mapApi(
      (): LiteralApi<KS> => ({
        _AS: undefined as any,
        matchS: (m) => (k) => m[k](k),
        matchW: (m) => (k) => m[k](k)
      })
    ),
    brand((_) => _ as KS[number]),
    S.identified(literalIdentifier, { literals })
  )
}
