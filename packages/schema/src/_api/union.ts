import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import * as D from "@effect-ts/core/Collections/Immutable/Dictionary"
import { tuple } from "@effect-ts/core/Collections/Immutable/Tuple"
import { pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import type { EnforceNonEmptyRecord } from "@effect-ts/core/Utils"

import * as S from "../_schema"
import * as Arbitrary from "../Arbitrary"
import * as Encoder from "../Encoder"
import * as Guard from "../Guard"
import * as Parser from "../Parser"
import * as Th from "../These"

export interface UnionApi<Props extends Record<PropertyKey, S.SchemaUPI>>
  extends S.ApiSelfType<unknown> {
  readonly matchS: <A>(
    _: {
      [K in keyof Props]: (_: S.ParsedShapeOf<Props[K]>) => A
    }
  ) => (
    ks: S.GetApiSelfType<
      this,
      {
        [k in keyof Props]: S.ParsedShapeOf<Props[k]>
      }[keyof Props]
    >
  ) => A
  readonly matchW: <
    M extends {
      [K in keyof Props]: (_: S.ParsedShapeOf<Props[K]>) => any
    }
  >(
    _: M
  ) => (
    ks: S.GetApiSelfType<
      this,
      {
        [k in keyof Props]: S.ParsedShapeOf<Props[k]>
      }[keyof Props]
    >
  ) => {
    [K in keyof M]: ReturnType<M[K]>
  }[keyof M]
}

export type SchemaUnion<Props extends Record<PropertyKey, S.SchemaUPI>> = S.Schema<
  unknown,
  S.CompositionE<
    | S.PrevE<S.LeafE<S.ExtractKeyE>>
    | S.NextE<
        S.UnionE<
          {
            [k in keyof Props]: S.MemberE<k, S.ParserErrorOf<Props[k]>>
          }[keyof Props]
        >
      >
  >,
  {
    [k in keyof Props]: S.ParsedShapeOf<Props[k]>
  }[keyof Props],
  {
    [k in keyof Props]: S.ParsedShapeOf<Props[k]>
  }[keyof Props],
  never,
  {
    [k in keyof Props]: S.EncodedOf<Props[k]>
  }[keyof Props],
  UnionApi<Props>
>

export const unionIdentifier = Symbol.for("@effect-ts/schema/ids/union")

export function union<Props extends Record<PropertyKey, S.SchemaUPI>>(
  props: Props & EnforceNonEmptyRecord<Props>
): SchemaUnion<Props> {
  const parsers = D.map_(props, Parser.for)
  const guards = D.map_(props, Guard.for)
  const encoders = D.map_(props, Encoder.for)
  const arbitraries = D.map_(props, Arbitrary.for)

  const keys = Object.keys(props)

  const entries = D.collect_(props, (k, v) => [k, v] as const)

  const head = entries[0]![1]

  const tag: O.Option<{
    key: string
    index: D.Dictionary<string>
    reverse: D.Dictionary<string>
    values: readonly string[]
  }> =
    "fields" in head.Api
      ? A.findFirstMap_(Object.keys(head.Api["fields"]), (key) => {
          const prop = head.Api["fields"][key]

          if ("value" in prop && typeof prop["value"] === "string") {
            const tags = A.filterMap_(entries, ([k, s]) => {
              if (
                "fields" in s.Api &&
                key in s.Api["fields"] &&
                "value" in s.Api["fields"][key] &&
                typeof s.Api["fields"][key]["value"] === "string"
              ) {
                return O.some(tuple(s.Api["fields"][key]["value"], k))
              }
              return O.none
            })["|>"](A.uniq({ equals: (x, y) => x.get(0) === y.get(0) }))

            if (tags.length === entries.length) {
              return O.some({
                key,
                index: D.fromArray(tags),
                reverse: D.fromArray(tags.map(({ tuple: [a, b] }) => tuple(b, a))),
                values: tags.map((_) => _.get(0))
              })
            }
          }

          return O.none
        })
      : O.none

  function guard(u: unknown): u is {
    [k in keyof Props]: S.ParsedShapeOf<Props[k]>
  }[keyof Props] {
    if (O.isSome(tag)) {
      if (
        typeof u !== "object" ||
        u === null ||
        !(tag.value.key in u) ||
        typeof u[tag.value.key] !== "string" ||
        !(u[tag.value.key] in tag.value.index)
      ) {
        return false
      } else {
        return guards[tag.value.index[u[tag.value.key]]](u)
      }
    }
    for (const k of keys) {
      if (guards[k](u)) {
        return true
      }
    }
    return false
  }

  function encoder(
    u: {
      [k in keyof Props]: S.ParsedShapeOf<Props[k]>
    }[keyof Props]
  ): {
    [k in keyof Props]: S.EncodedOf<Props[k]>
  }[keyof Props] {
    if (O.isSome(tag)) {
      return encoders[tag.value.index[u[tag.value.key]]](u)
    }
    for (const k of keys) {
      if (guards[k](u)) {
        return encoders[k](u)
      }
    }
    throw new Error(`bug: can't find any valid encoder`)
  }

  function parser(u: unknown): Th.These<
    S.CompositionE<
      | S.PrevE<S.LeafE<S.ExtractKeyE>>
      | S.NextE<
          S.UnionE<
            {
              [k in keyof Props]: S.MemberE<k, S.ParserErrorOf<Props[k]>>
            }[keyof Props]
          >
        >
    >,
    {
      [k in keyof Props]: S.ParsedShapeOf<Props[k]>
    }[keyof Props]
  > {
    if (O.isSome(tag)) {
      if (
        typeof u !== "object" ||
        u === null ||
        !(tag.value.key in u) ||
        typeof u[tag.value.key] !== "string" ||
        !(u[tag.value.key] in tag.value.index)
      ) {
        return Th.fail(
          S.compositionE(
            Chunk.single(
              S.prevE(S.leafE(S.extractKeyE(tag.value.key, tag.value.values, u)))
            )
          )
        )
      } else {
        return Th.mapError_(parsers[tag.value.index[u[tag.value.key]]](u), (e) =>
          S.compositionE(
            Chunk.single(
              S.nextE(
                S.unionE(Chunk.single(S.memberE(tag.value.index[u[tag.value.key]], e)))
              )
            )
          )
        )
      }
    }

    let errors = Chunk.empty<S.MemberE<string, any>>()

    for (const k of keys) {
      const parser = parsers[k]
      const res = parser(u)

      if (res.effect._tag === "Right") {
        return Th.mapError_(res, (e) =>
          S.compositionE(Chunk.single(S.nextE(S.unionE(Chunk.single(S.memberE(k, e))))))
        )
      } else {
        errors = Chunk.append_(errors, S.memberE(k, res.effect.left))
      }
    }

    return Th.fail(S.compositionE(Chunk.single(S.nextE(S.unionE(errors)))))
  }

  return pipe(
    S.identity(guard),
    S.parser(parser),
    S.encoder(encoder),
    S.arbitrary((fc) => fc.oneof(...D.collect_(arbitraries, (_, g) => g(fc)))),
    S.mapApi(
      () =>
        ({
          matchS: (matcher) => (ks) => {
            if (O.isSome(tag)) {
              return matcher[ks[tag.value.key]](ks)
            }
            for (const k of keys) {
              if (guards[k](ks)) {
                return matcher[k](ks)
              }
            }
            throw new Error(`bug: can't find any valid matcher`)
          },
          matchW: (matcher) => (ks) => {
            if (O.isSome(tag)) {
              return matcher[ks[tag.value.key]](ks)
            }
            for (const k of keys) {
              if (guards[k](ks)) {
                return matcher[k](ks)
              }
            }
            throw new Error(`bug: can't find any valid matcher`)
          }
        } as UnionApi<Props>)
    ),
    S.identified(unionIdentifier, { props })
  )
}
