// tracing: off

import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema"
import { augmentRecord } from "../_utils"
import * as Arbitrary from "../Arbitrary"
import * as Constructor from "../Constructor"
import * as Encoder from "../Encoder"
import * as Guard from "../Guard"
import * as Parser from "../Parser"
import * as Th from "../These"
import type { DefaultSchema } from "./withDefaults"
import { withDefaults } from "./withDefaults"

export type IntersectionApi<Self, That> = Self & That extends { props: infer X }
  ? { props: { [k in keyof X]: X[k] } }
  : {}

export type IntersectionSchema<
  Self extends S.Schema<unknown, any, any, any, any, any, any>,
  That extends S.Schema<unknown, any, any, any, any, any, any>,
  Api
> = DefaultSchema<
  unknown,
  S.IntersectionE<
    S.MemberE<0, S.ParserErrorOf<Self>> | S.MemberE<1, S.ParserErrorOf<That>>
  >,
  S.ParsedShapeOf<Self> & S.ParsedShapeOf<That>,
  S.ConstructorInputOf<Self> & S.ConstructorInputOf<That>,
  S.IntersectionE<
    S.MemberE<0, S.ConstructorErrorOf<Self>> | S.MemberE<1, S.ConstructorErrorOf<That>>
  >,
  S.EncodedOf<Self> & S.EncodedOf<That>,
  Api
>

export const intersectIdentifier =
  S.makeAnnotation<{ self: S.SchemaUPI; that: S.SchemaUPI }>()

export function intersect_<
  Self extends S.Schema<unknown, any, any, any, any, any, any>,
  That extends S.Schema<unknown, any, any, any, any, any, any>
>(
  self: Self,
  that: That
): IntersectionSchema<Self, That, IntersectionApi<S.ApiOf<Self>, S.ApiOf<That>>> {
  const guardSelf = Guard.for(self)
  const guardThat = Guard.for(that)
  const parseSelf = Parser.for(self)
  const parseThat = Parser.for(that)
  const constructSelf = Constructor.for(self)
  const constructThat = Constructor.for(that)
  const encodeSelf = Encoder.for(self)
  const encodeThat = Encoder.for(that)
  const arbSelf = Arbitrary.for(self)
  const arbThat = Arbitrary.for(that)

  const guard = (
    u: unknown
  ): u is S.ParsedShapeOf<
    IntersectionSchema<Self, That, IntersectionApi<S.ApiOf<Self>, S.ApiOf<That>>>
  > => guardSelf(u) && guardThat(u)

  return pipe(
    S.identity(guard),
    S.parser((u) => {
      const left = Th.result(parseSelf(u))
      const right = Th.result(parseThat(u))

      let errors =
        Chunk.empty<
          S.MemberE<0, S.ParserErrorOf<Self>> | S.MemberE<1, S.ParserErrorOf<That>>
        >()

      let errored = false
      let warned = false

      const intersection = {} as unknown as S.ParsedShapeOf<Self> &
        S.ParsedShapeOf<That>

      if (left._tag === "Left") {
        errors = Chunk.append_(errors, S.memberE(0, left.left))

        errored = true
      } else {
        const warnings = left.right.get(1)
        if (warnings._tag === "Some") {
          errors = Chunk.append_(errors, S.memberE(0, warnings.value))

          warned = true
        }
        Object.assign(intersection, left.right.get(0))
      }
      if (right._tag === "Left") {
        errors = Chunk.append_(errors, S.memberE(1, right.left))

        errored = true
      } else {
        const warnings = right.right.get(1)
        if (warnings._tag === "Some") {
          errors = Chunk.append_(errors, S.memberE(1, warnings.value))

          warned = true
        }
        Object.assign(intersection, right.right.get(0))
      }

      if (errored) {
        return Th.fail(S.intersectionE(errors))
      }

      augmentRecord(intersection)

      if (warned) {
        return Th.warn(intersection, S.intersectionE(errors))
      }

      return Th.succeed(intersection)
    }),
    S.constructor((u: S.ConstructorInputOf<Self> & S.ConstructorInputOf<That>) => {
      const left = Th.result(constructSelf(u))
      const right = Th.result(constructThat(u))

      let errors =
        Chunk.empty<
          | S.MemberE<0, S.ConstructorErrorOf<Self>>
          | S.MemberE<1, S.ConstructorErrorOf<That>>
        >()

      let errored = false
      let warned = false

      const intersection = {} as unknown as S.ParsedShapeOf<Self> &
        S.ParsedShapeOf<That>

      if (left._tag === "Left") {
        errors = Chunk.append_(errors, S.memberE(0, left.left))

        errored = true
      } else {
        const warnings = left.right.get(1)
        if (warnings._tag === "Some") {
          errors = Chunk.append_(errors, S.memberE(0, warnings.value))

          warned = true
        }
        Object.assign(intersection, left.right.get(0))
      }
      if (right._tag === "Left") {
        errors = Chunk.append_(errors, S.memberE(1, right.left))

        errored = true
      } else {
        const warnings = right.right.get(1)
        if (warnings._tag === "Some") {
          errors = Chunk.append_(errors, S.memberE(1, warnings.value))

          warned = true
        }
        Object.assign(intersection, right.right.get(0))
      }

      if (errored) {
        return Th.fail(S.intersectionE(errors))
      }

      augmentRecord(intersection)

      if (warned) {
        return Th.warn(intersection, S.intersectionE(errors))
      }

      return Th.succeed(intersection)
    }),
    S.encoder((_): S.EncodedOf<Self> & S.EncodedOf<That> => ({
      ...encodeSelf(_),
      ...encodeThat(_)
    })),
    S.arbitrary((FC) => {
      const self = arbSelf(FC)
      const that = arbThat(FC)
      return self.chain((a) => that.map((b) => ({ ...a, ...b })))
    }),
    S.mapApi(() => {
      const props = {}
      if ("props" in self.Api) {
        for (const k of Object.keys(self.Api["props"])) {
          props[k] = self.Api["props"][k]
        }
      }
      if ("props" in that.Api) {
        for (const k of Object.keys(that.Api["props"])) {
          props[k] = that.Api["props"][k]
        }
      }
      if (Object.keys(props).length > 0) {
        return { props } as IntersectionApi<S.ApiOf<Self>, S.ApiOf<That>>
      }
      return {} as IntersectionApi<S.ApiOf<Self>, S.ApiOf<That>>
    }),
    withDefaults,
    S.annotate(intersectIdentifier, { self, that })
  )
}

export function intersect<That extends S.Schema<unknown, any, any, any, any, any, any>>(
  that: That
): <Self extends S.Schema<unknown, any, any, any, any, any, any>>(
  self: Self
) => IntersectionSchema<Self, That, IntersectionApi<S.ApiOf<Self>, S.ApiOf<That>>> {
  return (self) => intersect_(self, that)
}

export function intersectLazy<
  That extends S.Schema<unknown, any, any, any, any, any, any>
>(that: () => That) {
  return <Self extends S.Schema<unknown, any, any, any, any, any, any>>(
    self: Self
  ): IntersectionSchema<Self, That, S.ApiOf<Self>> =>
    pipe(
      intersect_(self, S.lazy(that)),
      S.mapApi(() => self.Api as S.ApiOf<Self>),
      withDefaults
    )
}
