import * as T from "@effect-ts/core/Effect"
import * as Ex from "@effect-ts/core/Effect/Exit"

import * as S from "../src"
import * as Constructor from "../src/Constructor"
import * as Encoder from "../src/Encoder"
import * as Parser from "../src/Parser"

const Identified = S.props({
  id: S.prop(S.string).from("sub"),
  name: S.prop(S.string).opt()
})

const Person = S.props({
  _tag: S.prop(S.literal("Person")),
  ...Identified.Api.props,
  age: S.prop(S.number).opt(),
  birthDate: S.prop(S.date).opt().from("bd")
})

const Animal = S.props({
  _tag: S.prop(S.literal("Animal")),
  ...Identified.Api.props,
  age: S.prop(S.number).opt(),
  birthDate: S.prop(S.date).opt().from("bd"),
  color: S.prop(S.string)
})

const PersonOrAnimal = S.tagged(Person, Animal)

const parsePerson = Parser.for(PersonOrAnimal)["|>"](S.condemnFail)
const encodePerson = Encoder.for(Person)
const createPerson = Constructor.for(Person)["|>"](S.unsafe)

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
})
