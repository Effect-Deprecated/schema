import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import * as Dictionary from "@effect-ts/core/Collections/Immutable/Dictionary"
import { pipe } from "@effect-ts/core/Function"
import type { Compute, UnionToIntersection } from "@effect-ts/core/Utils"
import { intersect } from "@effect-ts/core/Utils"
import type * as fc from "fast-check"

import type { HasContinuation } from "../_schema"
import * as S from "../_schema"
import { augmentRecord } from "../_utils"
import * as Arbitrary from "../Arbitrary"
import * as Encoder from "../Encoder"
import * as Guard from "../Guard"
import * as Parser from "../Parser"
import * as Th from "../These"
import { unknown } from "./unknown"

export class Property<
  Key extends PropertyKey,
  Self extends S.SchemaUPI,
  Optional extends "optional" | "required",
  As extends PropertyKey
> {
  constructor(
    readonly _key: Key,
    readonly _as: As,
    readonly _schema: Self,
    readonly _optional: Optional
  ) {}

  schema<That extends S.SchemaUPI>(schema: That): Property<Key, That, Optional, As> {
    return new Property(this._key, this._as, schema, this._optional)
  }

  optional(): Property<Key, Self, "optional", As> {
    return new Property(this._key, this._as, this._schema, "optional")
  }

  required(): Property<Key, Self, "required", As> {
    return new Property(this._key, this._as, this._schema, "required")
  }

  as<As1 extends PropertyKey>(as: As1): Property<Key, Self, Optional, As1> {
    return new Property(this._key, as, this._schema, this._optional)
  }
}

export function property<Key extends PropertyKey>(
  key: Key
): Property<Key, typeof unknown, "required", Key>
export function property<Key extends PropertyKey, Self extends S.SchemaUPI>(
  key: Key,
  schema: Self
): Property<Key, Self, "required", Key>
export function property<Key extends PropertyKey, Self extends S.SchemaUPI>(
  key: Key,
  schema?: Self | typeof unknown
): Property<Key, Self | typeof unknown, "required", Key> {
  return new Property(key, key, schema || unknown, "required")
}

export type AnyProperty = Property<any, any, any, any>

export type PropertyArray = readonly AnyProperty[]

export type ShapeFromProperties<Props extends PropertyArray> = Compute<
  UnionToIntersection<
    {
      [k in keyof Props]: Props[k] extends AnyProperty
        ? Props[k]["_optional"] extends "optional"
          ? {
              [h in Props[k]["_key"]]?: S.ParsedShapeOf<Props[k]["_schema"]>
            }
          : {
              [h in Props[k]["_key"]]: S.ParsedShapeOf<Props[k]["_schema"]>
            }
        : never
    }[number]
  >,
  "flat"
>

export type EncodedFromProperties<Props extends PropertyArray> = Compute<
  UnionToIntersection<
    {
      [k in keyof Props]: Props[k] extends AnyProperty
        ? Props[k]["_optional"] extends "optional"
          ? {
              [h in Props[k]["_as"]]?: S.EncodedOf<Props[k]["_schema"]>
            }
          : {
              [h in Props[k]["_as"]]: S.EncodedOf<Props[k]["_schema"]>
            }
        : never
    }[number]
  >,
  "flat"
>

export type HasRequiredProperty<Props extends PropertyArray> = unknown extends {
  [k in keyof Props]: Props[k] extends AnyProperty
    ? Props[k]["_optional"] extends "required"
      ? unknown
      : never
    : never
}[number]
  ? true
  : false

export type ParserErrorFromProperties<Props extends PropertyArray> = S.CompositionE<
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
                        : Props[k]["_as"]
                      : never
                  }[number]
                >
              >
            | S.NextE<
                S.StructE<
                  {
                    [k in keyof Props]: Props[k] extends AnyProperty
                      ? Props[k]["_optional"] extends "optional"
                        ? S.OptionalKeyE<
                            Props[k]["_as"],
                            S.ParserErrorOf<Props[k]["_schema"]>
                          >
                        : S.RequiredKeyE<
                            Props[k]["_as"],
                            S.ParserErrorOf<Props[k]["_schema"]>
                          >
                      : never
                  }[number]
                >
              >
          >
        : S.StructE<
            {
              [k in keyof Props]: Props[k] extends AnyProperty
                ? Props[k]["_optional"] extends "optional"
                  ? S.OptionalKeyE<
                      Props[k]["_as"],
                      S.ParserErrorOf<Props[k]["_schema"]>
                    >
                  : S.RequiredKeyE<
                      Props[k]["_as"],
                      S.ParserErrorOf<Props[k]["_schema"]>
                    >
                : never
            }[number]
          >
    >
>

export const propertiesIdentifier = Symbol.for("@effect-ts/schema/ids/properties")

export class SchemaProperties<Props extends PropertyArray>
  extends S.Schema<
    unknown,
    ParserErrorFromProperties<Props>,
    ShapeFromProperties<Props>,
    ShapeFromProperties<Props>,
    never,
    EncodedFromProperties<Props>,
    {}
  >
  implements HasContinuation
{
  readonly _tag = "SchemaProperties"

  readonly Api = {};

  readonly [S.SchemaContinuationSymbol]: S.SchemaAny = this.self

  constructor(
    readonly self: S.Schema<
      unknown,
      ParserErrorFromProperties<Props>,
      ShapeFromProperties<Props>,
      ShapeFromProperties<Props>,
      never,
      EncodedFromProperties<Props>,
      {}
    >,
    readonly props: Props
  ) {
    super()
  }
}

export function properties<Props extends PropertyArray>(
  ...props: Props
): SchemaProperties<Props> {
  const parsers = {} as Record<string, Parser.Parser<unknown, unknown, unknown>>
  const encoders = {}
  const guards = {}
  const arbitrariesReq = {} as Record<string, Arbitrary.Gen<unknown>>
  const arbitrariesPar = {} as Record<string, Arbitrary.Gen<unknown>>
  const keys = {}
  const mapped = {}
  const required = [] as string[]

  for (const entry of props) {
    parsers[entry._as] = Parser.for(entry._schema)
    encoders[entry._as] = Encoder.for(entry._schema)
    guards[entry._as] = Guard.for(entry._schema)
    keys[entry._as] = entry._key
    mapped[entry._key] = entry._as
    if (entry._optional === "required") {
      required.push(entry._as)
      arbitrariesReq[entry._key] = Arbitrary.for(entry._schema)
    } else {
      arbitrariesPar[entry._key] = Arbitrary.for(entry._schema)
    }
  }

  const hasRequired = required.length > 0

  function guard(_: unknown): _ is ShapeFromProperties<Props> {
    if (typeof _ !== "object" || _ === null) {
      return false
    }
    for (const k of props) {
      if (k._optional === "required" && !(k._key in _)) {
        return false
      }
      if (k._key in _) {
        if (!guards[k._as](_[k._key])) {
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

    for (const k of props) {
      if (k._as in _) {
        const res = parsers[k._as](_[k._as])

        if (res.effect._tag === "Left") {
          errors = Chunk.append_(
            errors,
            k._optional === "required"
              ? S.requiredKeyE(k._as, res.effect.left)
              : S.optionalKeyE(k._as, res.effect.left)
          )
          isError = true
        } else {
          result[k._key] = res.effect.right.get(0)

          const warnings = res.effect.right.get(1)

          if (warnings._tag === "Some") {
            errors = Chunk.append_(
              errors,
              k._optional === "required"
                ? S.requiredKeyE(k._as, warnings.value)
                : S.optionalKeyE(k._as, warnings.value)
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
    for (const p of props) {
      if (p._key in _) {
        enc[p._as] = encoders[p._as](_[p._key])
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

  return new SchemaProperties(
    pipe(
      S.identity(guard),
      S.parser(parser),
      S.encoder(encoder),
      S.arbitrary(arb),
      S.identified(propertiesIdentifier, { props })
    ),
    props
  )
}
