import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import * as Dictionary from "@effect-ts/core/Collections/Immutable/Dictionary"
import { pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import type { Compute, UnionToIntersection } from "@effect-ts/core/Utils"
import { intersect } from "@effect-ts/core/Utils"
import type * as fc from "fast-check"

import * as S from "../_schema"
import { augmentRecord } from "../_utils"
import * as Arbitrary from "../Arbitrary"
import * as Encoder from "../Encoder"
import * as Guard from "../Guard"
import * as Parser from "../Parser"
import * as Th from "../These"
import type { LiteralApi } from "./literal"

export class Property<
  Self extends S.SchemaUPI,
  Optional extends "optional" | "required",
  As extends O.Option<PropertyKey>
> {
  constructor(readonly _as: As, readonly _schema: Self, readonly _optional: Optional) {}

  schema<That extends S.SchemaUPI>(schema: That): Property<That, Optional, As> {
    return new Property(this._as, schema, this._optional)
  }

  optional(): Property<Self, "optional", As> {
    return new Property(this._as, this._schema, "optional")
  }

  required(): Property<Self, "required", As> {
    return new Property(this._as, this._schema, "required")
  }

  from<As1 extends PropertyKey>(as: As1): Property<Self, Optional, O.Some<As1>> {
    return new Property(new O.Some(as), this._schema, this._optional)
  }

  removeFrom(): Property<Self, Optional, O.None> {
    return new Property(new O.None(), this._schema, this._optional)
  }
}

export function property<Self extends S.SchemaUPI>(
  schema: Self
): Property<Self, "required", O.None> {
  return new Property(new O.None(), schema, "required")
}

export type AnyProperty = Property<any, any, any>

export type PropertyRecord = Record<PropertyKey, AnyProperty>

export type ShapeFromProperties<
  Props extends PropertyRecord,
  Excluded extends keyof Props = never
> = Compute<
  UnionToIntersection<
    {
      [k in keyof Props]: k extends Excluded
        ? never
        : Props[k] extends AnyProperty
        ? Props[k]["_optional"] extends "optional"
          ? {
              readonly [h in k]?: S.ParsedShapeOf<Props[k]["_schema"]>
            }
          : {
              readonly [h in k]: S.ParsedShapeOf<Props[k]["_schema"]>
            }
        : never
    }[keyof Props]
  >,
  "flat"
>

export type EncodedFromProperties<Props extends PropertyRecord> = Compute<
  UnionToIntersection<
    {
      [k in keyof Props]: Props[k] extends AnyProperty
        ? Props[k]["_optional"] extends "optional"
          ? {
              readonly [h in Props[k]["_as"] extends O.Some<any>
                ? Props[k]["_as"]["value"]
                : k]?: S.EncodedOf<Props[k]["_schema"]>
            }
          : {
              readonly [h in Props[k]["_as"] extends O.Some<any>
                ? Props[k]["_as"]["value"]
                : k]: S.EncodedOf<Props[k]["_schema"]>
            }
        : never
    }[keyof Props]
  >,
  "flat"
>

export type HasRequiredProperty<Props extends PropertyRecord> = unknown extends {
  [k in keyof Props]: Props[k] extends AnyProperty
    ? Props[k]["_optional"] extends "required"
      ? unknown
      : never
    : never
}[keyof Props]
  ? true
  : false

export type ParserErrorFromProperties<Props extends PropertyRecord> = S.CompositionE<
  | S.PrevE<S.LeafE<S.UnknownRecordE>>
  | S.NextE<
      HasRequiredProperty<Props> extends true
        ? S.CompositionE<
            | S.PrevE<
                S.MissingKeysE<
                  {
                    [k in keyof Props]: Props[k] extends AnyProperty
                      ? Props[k]["_optional"] extends "optional"
                        ? never
                        : Props[k]["_as"] extends O.Some<any>
                        ? Props[k]["_as"]["value"]
                        : k
                      : never
                  }[keyof Props]
                >
              >
            | S.NextE<
                S.StructE<
                  {
                    [k in keyof Props]: Props[k] extends AnyProperty
                      ? Props[k]["_optional"] extends "optional"
                        ? S.OptionalKeyE<
                            Props[k]["_as"] extends O.Some<any>
                              ? Props[k]["_as"]["value"]
                              : k,
                            S.ParserErrorOf<Props[k]["_schema"]>
                          >
                        : S.RequiredKeyE<
                            Props[k]["_as"] extends O.Some<any>
                              ? Props[k]["_as"]["value"]
                              : k,
                            S.ParserErrorOf<Props[k]["_schema"]>
                          >
                      : never
                  }[keyof Props]
                >
              >
          >
        : S.StructE<
            {
              [k in keyof Props]: Props[k] extends AnyProperty
                ? Props[k]["_optional"] extends "optional"
                  ? S.OptionalKeyE<
                      Props[k]["_as"] extends O.Some<any>
                        ? Props[k]["_as"]["value"]
                        : k,
                      S.ParserErrorOf<Props[k]["_schema"]>
                    >
                  : S.RequiredKeyE<
                      Props[k]["_as"] extends O.Some<any>
                        ? Props[k]["_as"]["value"]
                        : k,
                      S.ParserErrorOf<Props[k]["_schema"]>
                    >
                : never
            }[keyof Props]
          >
    >
>

export const propertiesIdentifier = Symbol.for("@effect-ts/schema/ids/properties")

export type SchemaProperties<Props extends PropertyRecord> = S.Schema<
  unknown,
  ParserErrorFromProperties<Props>,
  ShapeFromProperties<Props>,
  ShapeFromProperties<Props, keyof TagsFromProps<Props>>,
  never,
  EncodedFromProperties<Props>,
  { props: Props; fields: TagsFromProps<Props> }
>

export type TagsFromProps<Props extends PropertyRecord> = UnionToIntersection<
  {
    [k in keyof Props]: Props[k]["_as"] extends O.None
      ? Props[k]["_optional"] extends "required"
        ? S.ApiOf<Props[k]["_schema"]> extends LiteralApi<infer KS>
          ? KS extends [infer X]
            ? { [h in k]: { value: X } }
            : never
          : never
        : never
      : never
  }[keyof Props]
>

export function properties<Props extends PropertyRecord>(
  props: Props
): SchemaProperties<Props> {
  const parsers = {} as Record<string, Parser.Parser<unknown, unknown, unknown>>
  const encoders = {}
  const guards = {}
  const fields = {} as TagsFromProps<Props>
  const tags = {}
  const arbitrariesReq = {} as Record<string, Arbitrary.Gen<unknown>>
  const arbitrariesPar = {} as Record<string, Arbitrary.Gen<unknown>>
  const keys = Object.keys(props)
  const required = [] as string[]

  for (const key of keys) {
    parsers[key] = Parser.for(props[key]._schema)
    encoders[key] = Encoder.for(props[key]._schema)
    guards[key] = Guard.for(props[key]._schema)

    if (props[key]._optional === "required") {
      required.push(O.getOrElse_(props[key]._as, () => key))

      arbitrariesReq[key] = Arbitrary.for(props[key]._schema)
    } else {
      arbitrariesPar[key] = Arbitrary.for(props[key]._schema)
    }

    const s: S.SchemaUPI = props[key]._schema

    if (
      "literals" in s.Api &&
      Array.isArray(s.Api["literals"]) &&
      s.Api["literals"].length === 1 &&
      typeof s.Api["literals"][0] === "string"
    ) {
      fields[key] = { value: s.Api["literals"][0] }
      tags[key] = s.Api["literals"][0]
    }
  }

  const hasRequired = required.length > 0

  function guard(_: unknown): _ is ShapeFromProperties<Props> {
    if (typeof _ !== "object" || _ === null) {
      return false
    }

    for (const key of keys) {
      const s = props[key]

      if (s._optional === "required" && !(key in _)) {
        return false
      }
      if (key in _) {
        if (!guards[key](_[key])) {
          return false
        }
      }
    }
    return true
  }

  function parser(
    _: unknown
  ): Th.These<ParserErrorFromProperties<Props>, ShapeFromProperties<Props>> {
    if (typeof _ !== "object" || _ === null) {
      return Th.fail(
        S.compositionE(Chunk.single(S.prevE(S.leafE(S.unknownRecordE(_)))))
      )
    }
    let missingKeys = Chunk.empty()
    for (const k of required) {
      if (!(k in _)) {
        missingKeys = Chunk.append_(missingKeys, k)
      }
    }
    if (!Chunk.isEmpty(missingKeys)) {
      // @ts-expect-error
      return Th.fail(
        S.compositionE(
          Chunk.single(
            S.nextE(S.compositionE(Chunk.single(S.prevE(S.missingKeysE(missingKeys)))))
          )
        )
      )
    }

    let errors =
      Chunk.empty<S.OptionalKeyE<string, unknown> | S.RequiredKeyE<string, unknown>>()

    let isError = false

    const result = {}

    for (const key of keys) {
      const prop = props[key]
      const _as: string = O.getOrElse_(props[key]._as, () => key)

      if (_as in _) {
        const res = parsers[key](_[_as])

        if (res.effect._tag === "Left") {
          errors = Chunk.append_(
            errors,
            prop._optional === "required"
              ? S.requiredKeyE(_as, res.effect.left)
              : S.optionalKeyE(_as, res.effect.left)
          )
          isError = true
        } else {
          result[key] = res.effect.right.get(0)

          const warnings = res.effect.right.get(1)

          if (warnings._tag === "Some") {
            errors = Chunk.append_(
              errors,
              prop._optional === "required"
                ? S.requiredKeyE(_as, warnings.value)
                : S.optionalKeyE(_as, warnings.value)
            )
          }
        }
      }
    }

    if (!isError) {
      augmentRecord(result)
    }

    if (Chunk.isEmpty(errors)) {
      return Th.succeed(result as ShapeFromProperties<Props>)
    }

    const error_ = S.compositionE(Chunk.single(S.nextE(S.structE(errors))))
    const error = hasRequired ? S.compositionE(Chunk.single(S.nextE(error_))) : error_

    if (isError) {
      // @ts-expect-error
      return Th.fail(error)
    }

    // @ts-expect-error
    return Th.warn(result, error)
  }

  function encoder(_: ShapeFromProperties<Props>): EncodedFromProperties<Props> {
    const enc = {}

    for (const key of keys) {
      if (key in _) {
        const _as: string = O.getOrElse_(props[key]._as, () => key)
        enc[_as] = encoders[key](_[key])
      }
    }
    // @ts-expect-error
    return enc
  }

  function arb(_: typeof fc): fc.Arbitrary<ShapeFromProperties<Props>> {
    const req = Dictionary.map_(arbitrariesReq, (g) => g(_))
    const par = Dictionary.map_(arbitrariesPar, (g) => g(_))

    // @ts-expect-error
    return _.record(req).chain((a) =>
      _.record(par, { withDeletedKeys: true }).map((b) => intersect(a, b))
    )
  }

  return pipe(
    S.identity(guard),
    S.parser(parser),
    S.encoder(encoder),
    S.arbitrary(arb),
    S.mapApi(() => ({ props, fields })),
    S.identified(propertiesIdentifier, { props }),
    S.constructor((_) => {
      const res = {} as ShapeFromProperties<Props>
      Object.assign(res, _, tags)
      return Th.succeed(res)
    })
  )
}
