// ets_tracing: off

import { pipe } from "@effect-ts/core/Function"

import type { ApiSelfType } from "../_schema"
import * as S from "../_schema"
import * as Th from "../These"
import { refinement } from "./refinement"
import type { DefaultSchema } from "./withDefaults"
import { withDefaults } from "./withDefaults"

export interface LiteralApi<KS extends readonly string[]> extends ApiSelfType {
  readonly literals: KS
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

export const literalIdentifier = S.makeAnnotation<{ literals: readonly string[] }>()

export function literal<KS extends readonly string[]>(
  ...literals: KS
): DefaultSchema<
  unknown,
  S.RefinementE<S.LeafE<S.LiteralE<KS>>>,
  KS[number],
  KS[number],
  never,
  KS[number],
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
        literals,
        matchS: (m) => (k) => m[k](k),
        matchW: (m) => (k) => m[k](k)
      })
    ),
    withDefaults,
    S.annotate(literalIdentifier, { literals })
  )
}
