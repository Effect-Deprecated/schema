import * as T from "@effect-ts/core/Effect"
import * as Ex from "@effect-ts/core/Effect/Exit"
import * as fc from "fast-check"

import * as S from "../src"
import { number, string } from "../src"
import * as Arbitrary from "../src/Arbitrary"
import * as Encoder from "../src/Encoder"
import * as Guard from "../src/Guard"
import * as Parser from "../src/Parser"

const Identified = S.props({
  id: S.prop(S.string).from("sub"),
  name: S.prop(S.string).opt()
})

const Person = S.props({
  _tag: S.prop(S.literal("Person")),
  ...Identified.props,
  age: S.prop(S.number).def(() => 30),
  birthDate: S.prop(S.date).opt().from("bd")
})

const Animal = S.props({
  _tag: S.prop(S.literal("Animal")),
  ...Identified.props,
  age: S.prop(S.number).opt(),
  birthDate: S.prop(S.date).opt().from("bd"),
  color: S.prop(S.string)
})

export const PersonOrAnimal = S.union({ Person, Animal })
export const StringOrNumber = S.union({ string, number })

export const parsePersonOrAnimal = Parser.for(PersonOrAnimal)["|>"](S.condemnFail)
export const parseStringOrNumber = Parser.for(StringOrNumber)["|>"](S.condemnFail)
export const isStringOrNumber = Guard.for(StringOrNumber)
export const encodeStringOrNumber = Encoder.for(StringOrNumber)
export const isPersonOrAnimal = Guard.for(PersonOrAnimal)
export const encodePersonOrAnimal = Encoder.for(PersonOrAnimal)
export const arbStringOrNumber = Arbitrary.for(StringOrNumber)(fc)
export const arbPersonOrAnimal = Arbitrary.for(PersonOrAnimal)(fc)

describe("Props", () => {
  it("union", async () => {
    const dt = new Date().toISOString()

    const res = await T.runPromiseExit(
      parsePersonOrAnimal({ _tag: "Person", sub: "ok", bd: dt })
    )

    expect(res).toEqual(
      Ex.succeed({
        _tag: "Person",
        id: "ok",
        age: 30,
        birthDate: new Date(Date.parse(dt))
      })
    )

    const res2 = await T.runPromiseExit(parseStringOrNumber("ok"))

    expect(res2).toEqual(Ex.succeed("ok"))

    expect(isStringOrNumber(0)).toEqual(true)

    expect(isPersonOrAnimal({})).toEqual(false)

    if (res._tag === "Success") {
      expect(isPersonOrAnimal(res.value)).toEqual(true)

      expect(
        PersonOrAnimal.matchW({
          Animal: (_) => `got animal: ${_.id}`,
          Person: (_) => `got person: ${_.id}`
        })(res.value)
      ).toEqual("got person: ok")

      expect(encodePersonOrAnimal(res.value)).toEqual({
        _tag: "Person",
        sub: "ok",
        age: 30,
        bd: dt
      })
    }

    const matchStringOrNumber = StringOrNumber.matchS({
      number: (_) => `got number: ${_}`,
      string: (_) => `got string: ${_}`
    })

    expect(matchStringOrNumber(0)).toEqual("got number: 0")

    expect(matchStringOrNumber("ok")).toEqual("got string: ok")
    expect(encodeStringOrNumber("ok")).toEqual("ok")

    fc.assert(fc.property(arbStringOrNumber, isStringOrNumber))
    fc.assert(fc.property(arbPersonOrAnimal, isPersonOrAnimal))
  })
})
