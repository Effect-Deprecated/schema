import * as T from "@effect-ts/core/Effect"
import * as Ex from "@effect-ts/core/Effect/Exit"

import * as S from "../src"

const binary = S.intersectLazy(
  (): S.Standard<{
    readonly left: Operation
    readonly right: Operation
  }> =>
    S.props({
      left: S.prop(Operation),
      right: S.prop(Operation)
    })
)

export class Add extends S.Model<Add>()(
  binary(
    S.props({
      _tag: S.prop(S.literal("Add"))
    })
  )
) {}

export class Mul extends S.Model<Mul>()(
  binary(
    S.props({
      _tag: S.prop(S.literal("Mul"))
    })
  )
) {}

export class Val extends S.Model<Val>()(
  S.props({
    _tag: S.prop(S.literal("Val")),
    value: S.prop(S.number)
  })
) {}

export type Operation = Add | Mul | Val

export const Operation = S.union({ Add, Mul, Val })

const parseOperation = Operation.Parser["|>"](S.condemnFail)

describe("Operation", () => {
  it("parse/encode", async () => {
    const res = await T.runPromiseExit(
      parseOperation({
        _tag: "Add",
        left: { _tag: "Val", value: 0 },
        right: { _tag: "Val", value: 0 }
      })
    )
    expect(res).toEqual(
      Ex.succeed({
        _tag: "Add",
        left: { _tag: "Val", value: 0 },
        right: { _tag: "Val", value: 0 }
      })
    )
  })
})
