import * as T from "@effect-ts/core/Effect"
import * as Ex from "@effect-ts/core/Effect/Exit"

import * as S from "../src"

const binaryOp = S.intersectLazy(
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
  S.props({
    _tag: S.prop(S.literal("Add"))
  })["|>"](binaryOp)
) {}

export class Mul extends S.Model<Mul>()(
  S.props({
    _tag: S.prop(S.literal("Mul"))
  })["|>"](binaryOp)
) {}

export class Val extends S.Model<Val>()(
  S.props({
    _tag: S.prop(S.literal("Val")),
    value: S.prop(S.number)
  })
) {}

export type Operation = Add | Mul | Val

export const Operation = S.union({ Add, Mul, Val })["|>"](S.ensureShape<Operation>())

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
