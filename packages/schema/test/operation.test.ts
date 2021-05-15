import * as T from "@effect-ts/core/Effect"
import * as Ex from "@effect-ts/core/Effect/Exit"

import * as S from "../src"

type BinaryOp = (left: Operation, right: Operation) => Operation

const withLeftAndRight = S.intersectLazy(
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
  })["|>"](withLeftAndRight)
) {
  static of: BinaryOp = (left, right) => new Add({ left, right })
}

export class Mul extends S.Model<Mul>()(
  S.props({
    _tag: S.prop(S.literal("Mul"))
  })["|>"](withLeftAndRight)
) {
  static of: BinaryOp = (left, right) => new Mul({ left, right })
}

export class Val extends S.Model<Val>()(
  S.props({
    _tag: S.prop(S.literal("Val")),
    value: S.prop(S.number)
  })
) {
  static of = (value: number): Operation => new Val({ value })
}

export type Operation = Add | Mul | Val

export const Operation = S.union({ Add, Mul, Val })
  ["|>"](S.ensureShape<Operation>())
  ["|>"](S.brand<Operation>())

export const compute = Operation.matchW({
  Add: ({ left, right }): T.UIO<number> =>
    T.suspend(() => T.zipWith_(compute(left), compute(right), (a, b) => a + b)),
  Mul: ({ left, right }): T.UIO<number> =>
    T.suspend(() => T.zipWith_(compute(left), compute(right), (a, b) => a * b)),
  Val: ({ value }) => T.succeed(value)
})

const parseOperation = Operation.Parser["|>"](S.condemnFail)

describe("Operation", () => {
  it("parse/encode", async () => {
    const res = await T.runPromiseExit(
      parseOperation({
        _tag: "Add",
        left: { _tag: "Val", value: 1 },
        right: { _tag: "Val", value: 2 }
      })
    )
    expect(res).toEqual(
      Ex.succeed({
        _tag: "Add",
        left: { _tag: "Val", value: 1 },
        right: { _tag: "Val", value: 2 }
      })
    )

    if (res._tag === "Success") {
      expect(
        await T.runPromiseExit(
          Operation.matchW({
            Add: () => T.succeed("add"),
            Mul: () => T.succeed("mul"),
            Val: () => T.succeed("val")
          })(res.value)
        )
      ).toEqual(Ex.succeed("add"))

      expect(await T.runPromiseExit(compute(res.value))).toEqual(Ex.succeed(3))
      expect(
        await T.runPromiseExit(compute(Mul.of(Add.of(Val.of(2), Val.of(3)), Val.of(4))))
      ).toEqual(Ex.succeed(20))
    }
  })
})
