// tracing: off

import * as S from "../_schema"
import { annotate, identity } from "../_schema"

export const unknownIdentifier = S.makeAnnotation<{}>()

export const unknown: S.Schema<unknown, never, unknown, unknown, never, unknown, {}> =
  identity((_): _ is unknown => true)["|>"](annotate(unknownIdentifier, {}))
