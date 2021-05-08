import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import type { Refinement } from "@effect-ts/core/Function"
import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema"
import { parseUuidE } from "../_schema"
import { brand } from "./brand"
import { nonEmpty } from "./nonEmpty"
import type { NonEmptyString } from "./nonEmptyString"
import { fromString, string } from "./string"

export interface UUIDBrand {
  readonly UUID: unique symbol
}

export const regexUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export type UUID = NonEmptyString & UUIDBrand

export const UUIDFromStringIdentifier = Symbol.for("@effect-ts/schema/ids/UUID")

const isUUID: Refinement<string, UUID> = (s: string): s is UUID => {
  return regexUUID.test(s)
}

export const UUIDFromString = pipe(
  fromString,
  S.arbitrary((FC) => FC.uuid()),
  nonEmpty,
  S.refine(isUUID, (n) => S.leafE(parseUuidE(n))),
  S.mapParserError((_) => Chunk.unsafeHead(_.errors).error),
  S.mapConstructorError((_) => Chunk.unsafeHead(_.errors).error),
  brand((_) => _ as UUID),
  S.identified(UUIDFromStringIdentifier, {})
)

export const UUID = string[">>>"](UUIDFromString)
