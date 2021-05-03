import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"

import * as MO from "../src"
import * as Parser from "../src/Parser"

export class A extends MO.Schemed(
  pipe(
    MO.required({
      a: MO.unknownString
    }),
    MO.tag("A")
  )
) {
  static Model = MO.schema(A)
}

export class B extends MO.Schemed(
  pipe(
    MO.required({
      b: MO.unknownString
    }),
    MO.withTag("_type", "TB"),
    MO.withTag("_tag", "B")
  )
) {
  static Model = MO.schema(B)
}

export class C extends MO.Schemed(
  pipe(
    MO.required({
      c: MO.unknownString
    }),
    MO.withTag("_type", "TC"),
    MO.withTag("_tag", "C")
  )
) {
  static Model = MO.schema(C)
}

const ABC = MO.makeTagged("_tag")(A.Model, B.Model, C.Model)
const BC = MO.makeTagged("_type")(B.Model, C.Model)

const parseABC = Parser.for(ABC)["|>"](MO.condemnFail)
const parseBC = Parser.for(BC)["|>"](MO.condemnFail)

describe("Tagged Union", () => {
  it("parse", async () => {
    const result = await T.runPromise(T.either(parseABC({ _tag: "A", a: "ok" })))

    expect(result._tag).equals("Right")

    const result_2 = await T.runPromise(
      T.either(parseBC({ _tag: "B", _type: "TB", b: "ok" }))
    )

    expect(result_2._tag).equals("Right")
  })
})
