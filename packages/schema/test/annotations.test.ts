import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"

import * as S from "../src"
import * as Collect from "../src/Collect"

const id = S.makeAnnotation<{ a: number }>()
const id2 = S.makeAnnotation<{ b: number }>()

export const schema = S.string.annotate(id, { a: 1 }).annotate(id2, { b: 2 })
export const collectSchemaAnnotations = Collect.for(schema)

it("should collect annotations", () => {
  expect(Chunk.toArray(collectSchemaAnnotations(id, id2))).toEqual([{ a: 1 }, { b: 2 }])
})
