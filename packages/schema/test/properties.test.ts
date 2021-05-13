import * as T from "@effect-ts/core/Effect"
import * as Ex from "@effect-ts/core/Effect/Exit"

import * as S from "../src"
import * as Encoder from "../src/Encoder"
import * as Parser from "../src/Parser"

const Identified = S.properties({
  id: S.property(S.string).from("sub"),
  name: S.property(S.string).optional()
})

const Person = S.properties({
  ...Identified.props,
  age: S.property(S.number).optional(),
  birthDate: S.property(S.date).optional().from("bd")
})

const parsePerson = Parser.for(Person)["|>"](S.condemnFail)
const encodePerson = Encoder.for(Person)

describe("Props", () => {
  it("parse succeed", async () => {
    const dt = new Date().toISOString()
    const res = await T.runPromiseExit(parsePerson({ sub: "ok", bd: dt }))

    expect(res).toEqual(Ex.succeed({ id: "ok", birthDate: new Date(Date.parse(dt)) }))
    if (res._tag === "Success") {
      expect(encodePerson(res.value)).toEqual({ sub: "ok", bd: dt })
    }
  })
})
