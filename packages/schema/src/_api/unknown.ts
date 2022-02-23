// ets_tracing: off

import { pipe } from "@effect-ts/core/Function"

import * as S from "../_schema/index.js"
import { annotate, identity } from "../_schema/index.js"
import type { DefaultSchema } from "./withDefaults.js"
import { withDefaults } from "./withDefaults.js"

export const unknownIdentifier = S.makeAnnotation<{}>()

export const unknown: DefaultSchema<
  unknown,
  never,
  unknown,
  unknown,
  never,
  unknown,
  {}
> = pipe(
  identity((_): _ is unknown => true),
  withDefaults,
  annotate(unknownIdentifier, {})
)
