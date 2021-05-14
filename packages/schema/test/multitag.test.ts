import * as T from "@effect-ts/core/Effect"

import * as MO from "../src"
import * as Parser from "../src/Parser"

export class A extends MO.Model<A>()(
  MO.props({
    _tag: MO.prop(MO.literal("A")),
    a: MO.prop(MO.string)
  })
) {}

export class B extends MO.Model<B>()(
  MO.props({
    _tag: MO.prop(MO.literal("B")),
    _type: MO.prop(MO.literal("TB")),
    b: MO.prop(MO.string)
  })
) {}

export class C extends MO.Model<C>()(
  MO.props({
    _tag: MO.prop(MO.literal("C")),
    _type: MO.prop(MO.literal("TC")),
    c: MO.prop(MO.string)
  })
) {
  static Model = MO.schema(C)
}

const ABC = MO.union({
  A,
  B,
  C
})

const BC = MO.union({
  B,
  C
})

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
