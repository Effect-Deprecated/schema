// tracing: off

import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import type { Dictionary } from "@effect-ts/core/Collections/Immutable/Dictionary"
import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema"
import { augmentRecord } from "../_utils"
import * as Arbitrary from "../Arbitrary"
import * as Encoder from "../Encoder"
import * as Guard from "../Guard"
import * as Parser from "../Parser"
import * as Th from "../These"
import { refinement } from "./refinement"
import type { DefaultSchema } from "./withDefaults"
import { withDefaults } from "./withDefaults"

export const dictionaryIdentifier = S.makeAnnotation<{}>()

export type ParserErrorFromDictionary = S.CompositionE<
  S.PrevE<S.LeafE<S.UnknownRecordE>> | S.NextE<S.LeafE<S.ParseObjectE>>
> // TODO

export function dictionary<
  ParserInput,
  ParserError extends S.AnyError,
  ParsedShape,
  ConstructorInput,
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
): DefaultSchema<
  unknown,
  ParserErrorFromDictionary,
  Dictionary<ParsedShape>,
  Dictionary<ParsedShape>,
  never,
  Dictionary<Encoded>,
  {}
> {
  const guard = Guard.for(self)
  const arb = Arbitrary.for(self)
  const parse = Parser.for(self)
  const encode = Encoder.for(self)

  function parser(
    _: unknown
  ): Th.These<ParserErrorFromDictionary, Dictionary<ParsedShape>> {
    if (typeof _ !== "object" || _ === null) {
      return Th.fail(
        S.compositionE(Chunk.single(S.prevE(S.leafE(S.unknownRecordE(_)))))
      )
    }
    let errors =
      Chunk.empty<S.OptionalKeyE<string, unknown> | S.RequiredKeyE<string, unknown>>()

    let isError = false

    const result = {}

    const keys = Object.keys(_)

    for (const key of keys) {
      const res = parse(_[key])

      if (res.effect._tag === "Left") {
        errors = Chunk.append_(errors, S.requiredKeyE(key, res.effect.left))
        isError = true
      } else {
        result[key] = res.effect.right.get(0)

        const warnings = res.effect.right.get(1)

        if (warnings._tag === "Some") {
          errors = Chunk.append_(errors, S.requiredKeyE(key, warnings.value))
        }
      }
    }

    if (!isError) {
      augmentRecord(result)
    }

    if (Chunk.isEmpty(errors)) {
      return Th.succeed(result as Dictionary<ParsedShape>)
    }

    const error_ = S.compositionE(Chunk.single(S.nextE(S.structE(errors))))
    const error = error_

    if (isError) {
      // @ts-expect-error
      return Th.fail(error)
    }

    // @ts-expect-error
    return Th.warn(result, error)
  }

  const refine = (u: unknown): u is Dictionary<ParsedShape> =>
    typeof u === "object" &&
    u != null &&
    !Object.keys(u).every((x) => typeof x === "string" && Object.values(u).every(guard))

  return pipe(
    refinement(refine, (v) => S.leafE(S.parseObjectE(v))),
    S.constructor((s: Dictionary<ParsedShape>) => Th.succeed(s)),
    S.arbitrary((_) => _.dictionary<ParsedShape>(_.string(), arb(_))),
    S.parser(parser),
    S.encoder((_) =>
      Object.keys(_).reduce((prev, cur) => {
        prev[cur] = encode(_[cur])
        return prev
      }, {} as Record<string, Encoded>)
    ),
    S.mapApi(() => ({})),
    withDefaults,
    S.annotate(dictionaryIdentifier, {})
  )
}
