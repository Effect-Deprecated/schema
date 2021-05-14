import * as T from "@effect-ts/core/Effect"
import * as Ex from "@effect-ts/core/Effect/Exit"
import * as fc from "fast-check"

import * as S from "../src"
import { number, string } from "../src"
import * as Arbitrary from "../src/Arbitrary"
import * as Constructor from "../src/Constructor"
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
  age: S.prop(S.number).opt(),
  birthDate: S.prop(S.date).opt().from("bd")
})

const Animal = S.props({
  _tag: S.prop(S.literal("Animal")),
  ...Identified.props,
  age: S.prop(S.number).opt(),
  birthDate: S.prop(S.date).opt().from("bd"),
  color: S.prop(S.string)
})

const PersonOrAnimal = S.tagged(Person, Animal)

const parsePerson = Parser.for(PersonOrAnimal)["|>"](S.condemnFail)
const encodePerson = Encoder.for(Person)
const createPerson = Constructor.for(Person)["|>"](S.unsafe)

export const PersonOrAnimal2 = S.union({ Person, Animal })
export const StringOrNumber = S.union({ string, number })

export const parsePersonOrAnimal2 = Parser.for(PersonOrAnimal2)["|>"](S.condemnFail)
export const parseStringOrNumber = Parser.for(StringOrNumber)["|>"](S.condemnFail)
export const isStringOrNumber = Guard.for(StringOrNumber)
export const encodeStringOrNumber = Encoder.for(StringOrNumber)
export const isPersonOrAnimal2 = Guard.for(PersonOrAnimal2)
export const encodePersonOrAnimal2 = Encoder.for(PersonOrAnimal2)
export const arbStringOrNumber = Arbitrary.for(StringOrNumber)(fc)
export const arbPersonOrAnimal2 = Arbitrary.for(PersonOrAnimal2)(fc)

describe("Props", () => {
  it("parse succeed", async () => {
    const dt = new Date().toISOString()
    const res = await T.runPromiseExit(
      parsePerson({ _tag: "Person", sub: "ok", bd: dt })
    )

    expect(res).toEqual(
      Ex.succeed({ _tag: "Person", id: "ok", birthDate: new Date(Date.parse(dt)) })
    )
    if (res._tag === "Success" && res.value._tag === "Person") {
      expect(encodePerson(res.value)).toEqual({ _tag: "Person", sub: "ok", bd: dt })
    }

    const created = createPerson({ id: "ok" })

    expect(encodePerson(created)).toEqual({ _tag: "Person", sub: "ok" })
  })

  it("union", async () => {
    const dt = new Date().toISOString()

    const res = await T.runPromiseExit(
      parsePersonOrAnimal2({ _tag: "Person", sub: "ok", bd: dt })
    )

    expect(res).toEqual(
      Ex.succeed({ _tag: "Person", id: "ok", birthDate: new Date(Date.parse(dt)) })
    )

    const res2 = await T.runPromiseExit(parseStringOrNumber("ok"))

    expect(res2).toEqual(Ex.succeed("ok"))

    expect(isStringOrNumber(0)).toEqual(true)

    expect(isPersonOrAnimal2({})).toEqual(false)

    if (res._tag === "Success") {
      expect(isPersonOrAnimal2(res.value)).toEqual(true)

      expect(
        PersonOrAnimal2.matchW({
          Animal: (_) => `got animal: ${_.id}`,
          Person: (_) => `got person: ${_.id}`
        })(res.value)
      ).toEqual("got person: ok")

      expect(encodePersonOrAnimal2(res.value)).toEqual({
        _tag: "Person",
        sub: "ok",
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
    fc.assert(fc.property(arbPersonOrAnimal2, isPersonOrAnimal2))
  })
})
